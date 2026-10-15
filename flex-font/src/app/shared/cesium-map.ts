import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, effect, input, output, signal, viewChild,
} from '@angular/core';
import type * as CesiumNS from 'cesium';
import { LatLng, Waypoint, Zone } from '../core/models';

export interface MapDrone { id: string; name: string; lat: number; lng: number; alt: number; heading?: number; status: string; selected?: boolean }
export interface MapRoute { id: string; color: string; points: Waypoint[]; dashed?: boolean }
export interface MapMarker { id: string; label: string; lat: number; lng: number; color: string }

type CesiumModule = typeof CesiumNS;

const STATUS_COLOR: Record<string, string> = {
  IN_FLIGHT: '#22c55e', HOVERING: '#f59e0b', RETURNING: '#3b82f6', EMERGENCY_LANDED: '#ef4444', IDLE: '#94a3b8',
};

/**
 * Vue 3D (CesiumJS) : drones, trajectoires, zones interdites/dangereuses extrudées en altitude.
 * Cesium est chargé à la demande (chunk séparé). Fond de carte OpenStreetMap, sans jeton Cesium ion.
 */
@Component({
  selector: 'app-cesium-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div #host class="host"></div>
      @if (!ready()) { <div class="loading">Chargement de la vue 3D…</div> }
      <div class="toolbar">
        <button type="button" class="btn small" (click)="recenter()">Recentrer</button>
        <button type="button" class="btn small" (click)="tilt()">Vue 3D inclinée</button>
        <button type="button" class="btn small" (click)="top()">Vue du dessus</button>
      </div>
      <div class="legend">
        <span><i style="background:#ef4444"></i>Zone interdite</span>
        <span><i style="background:#f59e0b"></i>Zone dangereuse</span>
        <span><i style="background:#22c55e"></i>Drone en vol</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; min-height: 320px; }
    .wrap { position: relative; height: 100%; min-height: inherit; border-radius: 12px; overflow: hidden; background: #0f172a; }
    .host { position: absolute; inset: 0; }
    .loading { position: absolute; inset: 0; display: grid; place-items: center; color: #cbd5e1; background: #0f172a; z-index: 2; }
    .toolbar { position: absolute; top: 8px; left: 8px; display: flex; gap: 6px; z-index: 3; }
    .legend { position: absolute; bottom: 8px; left: 8px; z-index: 3; display: flex; gap: 12px; padding: 6px 10px;
      background: rgba(15,23,42,.8); color: #e2e8f0; border-radius: 8px; font-size: 12px; }
    .legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; }
  `],
})
export class CesiumMap implements OnDestroy {
  drones = input<MapDrone[]>([]);
  routes = input<MapRoute[]>([]);
  zones = input<Zone[]>([]);
  markers = input<MapMarker[]>([]);
  /** Centre initial [lat, lng] */
  center = input<LatLng | null>(null);
  followId = input<string | null>(null);
  /** Si vrai, un clic sur le globe émet les coordonnées. */
  pickable = input(false);
  /** Aperçu d'un polygone en cours de dessin. */
  draft = input<LatLng[]>([]);
  picked = output<{ lat: number; lng: number }>();
  droneClicked = output<string>();

  protected ready = signal(false);
  private host = viewChild.required<ElementRef<HTMLDivElement>>('host');
  private C!: CesiumModule;
  private viewer?: CesiumNS.Viewer;
  private droneEntities = new Map<string, CesiumNS.Entity>();
  private staticEntities: CesiumNS.Entity[] = [];
  private zoneEntities: CesiumNS.Entity[] = [];
  private draftEntities: CesiumNS.Entity[] = [];
  private handler?: CesiumNS.ScreenSpaceEventHandler;
  private centered = false;
  private destroyed = false;

  constructor() {
    void this.init();
    effect(() => { const d = this.drones(); const f = this.followId(); if (this.ready()) this.syncDrones(d, f); });
    effect(() => { const r = this.routes(); const m = this.markers(); if (this.ready()) this.syncStatic(r, m); });
    effect(() => { const z = this.zones(); if (this.ready()) this.syncZones(z); });
    effect(() => { const p = this.draft(); if (this.ready()) this.syncDraft(p); });
  }

  private async init() {
    (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = '/cesium/';
    const C = (await import('cesium')) as CesiumModule;
    if (this.destroyed) return;
    this.C = C;
    const viewer = new C.Viewer(this.host().nativeElement, {
      baseLayer: new C.ImageryLayer(new C.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' })),
      baseLayerPicker: false, geocoder: false, homeButton: false, navigationHelpButton: false,
      animation: false, timeline: false, fullscreenButton: false, infoBox: false, selectionIndicator: false,
      sceneModePicker: true,
    });
    viewer.scene.globe.depthTestAgainstTerrain = false;
    this.viewer = viewer;

    this.handler = new C.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.handler.setInputAction((e: CesiumNS.ScreenSpaceEventHandler.PositionedEvent) => {
      const hit = viewer.scene.pick(e.position);
      const id = (hit as { id?: CesiumNS.Entity } | undefined)?.id?.id;
      if (id && this.droneEntities.has(id.replace('drone:', ''))) this.droneClicked.emit(id.replace('drone:', ''));
      if (!this.pickable()) return;
      const cart = viewer.camera.pickEllipsoid(e.position, viewer.scene.globe.ellipsoid);
      if (!cart) return;
      const c = C.Cartographic.fromCartesian(cart);
      this.picked.emit({ lat: C.Math.toDegrees(c.latitude), lng: C.Math.toDegrees(c.longitude) });
    }, C.ScreenSpaceEventType.LEFT_CLICK);

    this.ready.set(true);
    this.recenter();
  }

  // ---------- synchronisation ----------

  private syncDrones(drones: MapDrone[], followId: string | null) {
    const C = this.C; const v = this.viewer!;
    const seen = new Set<string>();
    for (const d of drones) {
      seen.add(d.id);
      const pos = C.Cartesian3.fromDegrees(d.lng, d.lat, Math.max(d.alt, 1));
      const ground = C.Cartesian3.fromDegrees(d.lng, d.lat, 0);
      const color = C.Color.fromCssColorString(STATUS_COLOR[d.status] ?? '#94a3b8');
      let e = this.droneEntities.get(d.id);
      if (!e) {
        e = v.entities.add({
          id: `drone:${d.id}`,
          position: pos,
          point: { pixelSize: 14, color, outlineColor: C.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
          label: {
            text: d.name, font: '13px sans-serif', fillColor: C.Color.WHITE, outlineColor: C.Color.BLACK, outlineWidth: 3,
            style: C.LabelStyle.FILL_AND_OUTLINE, pixelOffset: new C.Cartesian2(0, -22), disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          polyline: { positions: [ground, pos], width: 1.5, material: color.withAlpha(0.7) },
        });
        this.droneEntities.set(d.id, e);
      } else {
        e.position = new C.ConstantPositionProperty(pos);
        if (e.point) e.point.color = new C.ConstantProperty(color);
        if (e.polyline) {
          e.polyline.positions = new C.ConstantProperty([ground, pos]);
          e.polyline.material = new C.ColorMaterialProperty(color.withAlpha(0.7));
        }
      }
    }
    for (const [id, e] of this.droneEntities) {
      if (!seen.has(id)) { v.entities.remove(e); this.droneEntities.delete(id); }
    }
    const target = followId ? this.droneEntities.get(followId) : undefined;
    if (target && v.trackedEntity !== target) v.trackedEntity = target;
    else if (!followId && v.trackedEntity) v.trackedEntity = undefined;
  }

  private syncStatic(routes: MapRoute[], markers: MapMarker[]) {
    const C = this.C; const v = this.viewer!;
    this.staticEntities.forEach((e) => v.entities.remove(e));
    this.staticEntities = [];
    for (const r of routes) {
      if (r.points.length < 2) continue;
      const color = C.Color.fromCssColorString(r.color);
      this.staticEntities.push(v.entities.add({
        polyline: {
          positions: C.Cartesian3.fromDegreesArrayHeights(r.points.flatMap((p) => [p.lng, p.lat, p.alt])),
          width: 4,
          material: r.dashed ? new C.PolylineDashMaterialProperty({ color, dashLength: 16 }) : new C.PolylineGlowMaterialProperty({ glowPower: 0.2, color }),
        },
      }));
    }
    for (const m of markers) {
      this.staticEntities.push(v.entities.add({
        position: C.Cartesian3.fromDegrees(m.lng, m.lat, 0),
        point: { pixelSize: 12, color: C.Color.fromCssColorString(m.color), outlineColor: C.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY },
        label: { text: m.label, font: '12px sans-serif', fillColor: C.Color.WHITE, outlineColor: C.Color.BLACK, outlineWidth: 3, style: C.LabelStyle.FILL_AND_OUTLINE, pixelOffset: new C.Cartesian2(0, 20), disableDepthTestDistance: Number.POSITIVE_INFINITY },
      }));
    }
  }

  private syncZones(zones: Zone[]) {
    const C = this.C; const v = this.viewer!;
    this.zoneEntities.forEach((e) => v.entities.remove(e));
    this.zoneEntities = [];
    for (const z of zones) {
      if (!z.active || z.polygon.length < 3) continue;
      const base = C.Color.fromCssColorString(z.type === 'FORBIDDEN' ? '#ef4444' : '#f59e0b');
      this.zoneEntities.push(v.entities.add({
        name: z.name,
        polygon: {
          hierarchy: C.Cartesian3.fromDegreesArray(z.polygon.flatMap(([lat, lng]) => [lng, lat])),
          height: z.minAltM,
          extrudedHeight: z.maxAltM,
          material: base.withAlpha(0.3),
          outline: true,
          outlineColor: base,
        },
      }));
    }
  }

  private syncDraft(points: LatLng[]) {
    const C = this.C; const v = this.viewer!;
    this.draftEntities.forEach((e) => v.entities.remove(e));
    this.draftEntities = [];
    if (!points.length) return;
    const flat = points.flatMap(([lat, lng]) => [lng, lat]);
    this.draftEntities.push(v.entities.add({
      polyline: { positions: C.Cartesian3.fromDegreesArray(points.length > 2 ? [...flat, flat[0], flat[1]] : flat), width: 3, clampToGround: true, material: C.Color.CYAN },
    }));
    for (const [lat, lng] of points) {
      this.draftEntities.push(v.entities.add({ position: C.Cartesian3.fromDegrees(lng, lat, 0), point: { pixelSize: 9, color: C.Color.CYAN, disableDepthTestDistance: Number.POSITIVE_INFINITY } }));
    }
  }

  // ---------- caméra ----------

  recenter() {
    if (!this.viewer) return;
    const C = this.C;
    const target = this.firstTarget();
    if (!target) return;
    this.viewer.trackedEntity = undefined;
    this.viewer.camera.flyTo({
      destination: C.Cartesian3.fromDegrees(target[1], target[0] - 0.006, 650),
      orientation: { heading: 0, pitch: C.Math.toRadians(-40), roll: 0 },
      duration: this.centered ? 1 : 0,
    });
    this.centered = true;
  }

  tilt() {
    const t = this.firstTarget(); if (!t || !this.viewer) return;
    this.viewer.trackedEntity = undefined;
    this.viewer.camera.flyTo({ destination: this.C.Cartesian3.fromDegrees(t[1], t[0] - 0.004, 420), orientation: { heading: 0, pitch: this.C.Math.toRadians(-28), roll: 0 }, duration: 1.2 });
  }

  top() {
    const t = this.firstTarget(); if (!t || !this.viewer) return;
    this.viewer.trackedEntity = undefined;
    this.viewer.camera.flyTo({ destination: this.C.Cartesian3.fromDegrees(t[1], t[0], 1400), orientation: { heading: 0, pitch: this.C.Math.toRadians(-90), roll: 0 }, duration: 1 });
  }

  private firstTarget(): LatLng | null {
    const c = this.center(); if (c) return c;
    const d = this.drones()[0]; if (d) return [d.lat, d.lng];
    const m = this.markers()[0]; if (m) return [m.lat, m.lng];
    const r = this.routes()[0]?.points[0]; if (r) return [r.lat, r.lng];
    return null;
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.handler?.destroy();
    if (this.viewer && !this.viewer.isDestroyed()) this.viewer.destroy();
  }
}
