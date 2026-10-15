import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Drone, Mission, Zone } from '../../core/models';
import { TrackingService } from '../../core/tracking.service';
import { CesiumMap, MapDrone, MapRoute } from '../../shared/cesium-map';
import { ChronoPipe, StatusLabelPipe, statusClass } from '../../shared/format';

type Action = 'RETURN_HOME' | 'LAND_NOW' | 'HOVER';
const ACTIVE = ['IN_FLIGHT', 'HOVERING', 'RETURNING'];

@Component({
  selector: 'app-fleet',
  imports: [CesiumMap, ChronoPipe, StatusLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="row spread">
        <h1>Supervision de la flotte</h1>
        <span class="muted small">{{ tracking.connected() ? 'Temps réel connecté' : 'Temps réel déconnecté' }}</span>
      </div>
      <div class="split">
        <div class="stack">
          @for (d of rows(); track d.drone.id) {
            <section class="card" [class.selected]="selected() === d.drone.id" (click)="selected.set(d.drone.id)" (keydown.enter)="selected.set(d.drone.id)" tabindex="0">
              <div class="row spread">
                <b>{{ d.drone.name }}</b>
                <span class="badge" [class]="'badge ' + cls(d.drone.status)">{{ d.drone.status | statusLabel }}</span>
              </div>
              <div class="row spread small" style="margin:.4rem 0">
                <span>Batterie <span class="battery" [class.mid]="d.battery < 40" [class.low]="d.battery < 20"><i [style.width.%]="d.battery"></i></span> <b>{{ d.battery.toFixed(0) }} %</b></span>
                <span class="muted">{{ d.drone.serial }}</span>
              </div>
              @if (d.active) {
                <div class="row spread">
                  <div><div class="muted small">Chrono</div><div class="chrono">{{ (d.t?.elapsedS ?? 0) | chrono }}</div></div>
                  <div><div class="muted small">Arrivée dans</div><div class="chrono">{{ (d.t?.etaS ?? 0) | chrono }}</div></div>
                </div>
                <div class="row spread small" style="margin-top:.4rem">
                  <span>Alt. <b>{{ d.t?.altitudeM ?? 0 }} m</b></span>
                  <span>Vit. <b>{{ ((d.t?.speedMs ?? 0) * 3.6).toFixed(0) }} km/h</b></span>
                  <span>Reste <b>{{ d.t?.remainingM ?? 0 }} m</b></span>
                </div>
                @for (z of d.t?.zones ?? []; track z.id) {
                  <div class="zone" [class.forbidden]="z.type === 'FORBIDDEN'">⚠ {{ z.type === 'FORBIDDEN' ? 'ZONE INTERDITE' : 'Zone dangereuse' }} : {{ z.name }}</div>
                }
                <div class="row" style="margin-top:.6rem" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
                  <button class="btn small warn" (click)="intercept(d.drone, 'HOVER')" [disabled]="d.drone.status === 'HOVERING'">⏸ Stationnaire</button>
                  <button class="btn small primary" (click)="intercept(d.drone, 'RETURN_HOME')">↩ Retour base</button>
                  <button class="btn small danger" (click)="intercept(d.drone, 'LAND_NOW')">⛔ Atterrir</button>
                </div>
              }
            </section>
          } @empty {
            <section class="card empty">Aucun drone enregistré. Ajoutez-en depuis l'onglet « Drones ».</section>
          }

          <section class="card">
            <div class="row spread"><h2>Alertes</h2>@if (tracking.alerts().length) { <button class="btn small" (click)="tracking.clearAlerts()">Effacer</button> }</div>
            @for (a of tracking.alerts(); track a.id) {
              <div class="alert" [class.critical]="a.severity === 'CRITICAL'" [class.info]="a.severity === 'INFO'">
                <span class="small muted">{{ time(a.at) }}</span> {{ a.message }}
              </div>
            } @empty { <p class="muted small">Aucune alerte.</p> }
          </section>
        </div>
        <div class="card pad0 map-box">
          <app-cesium-map [drones]="mapDrones()" [routes]="routes()" [zones]="zones()" [center]="center()" [followId]="null" (droneClicked)="selected.set($event)" />
        </div>
      </div>
      @if (error()) { <div class="error">{{ error() }}</div> }
    </div>
  `,
  styles: [`
    section.card { cursor: pointer; border: 2px solid transparent; }
    section.card.selected { border-color: var(--brand); }
    .zone { margin-top: .5rem; padding: .35rem .6rem; border-radius: 8px; background: #fef3c7; color: #92400e; font-weight: 700; font-size: .85rem; }
    .zone.forbidden { background: #fee2e2; color: #991b1b; }
    .alert { padding: .4rem .6rem; border-left: 4px solid var(--warn); background: #fffbeb; margin-top: .4rem; border-radius: 4px; font-size: .9rem; }
    .alert.critical { border-color: var(--bad); background: #fef2f2; font-weight: 700; }
    .alert.info { border-color: var(--brand); background: #eff6ff; }
  `],
})
export class FleetPage implements OnInit {
  private api = inject(ApiService);
  protected tracking = inject(TrackingService);
  private destroyRef = inject(DestroyRef);

  drones = signal<Drone[]>([]);
  missions = signal<Mission[]>([]);
  zones = signal<Zone[]>([]);
  selected = signal<string | null>(null);
  error = signal('');
  protected cls = statusClass;

  rows = computed(() => {
    const tel = this.tracking.telemetry();
    return this.drones().map((drone) => {
      const active = ACTIVE.includes(drone.status);
      const t = active ? tel[drone.id] : undefined;
      return { drone, t, active, battery: t?.batteryPct ?? drone.batteryPct };
    });
  });
  mapDrones = computed<MapDrone[]>(() =>
    this.rows().map(({ drone, t, active }) => ({
      id: drone.id, name: drone.name, status: drone.status,
      lat: active && t ? t.lat : drone.lat, lng: active && t ? t.lng : drone.lng, alt: active && t ? t.altitudeM : drone.altitudeM,
    })),
  );
  routes = computed<MapRoute[]>(() =>
    this.missions().filter((m) => ACTIVE.includes(this.drones().find((d) => d.id === m.droneId)?.status ?? '')).map((m) => ({ id: m.id, color: '#38bdf8', points: m.route })),
  );
  center = computed<[number, number] | null>(() => { const d = this.drones()[0]; return d ? [d.lat, d.lng] : null; });

  constructor() {
    effect(() => { this.tracking.orderEvents(); untracked(() => void this.reload()); });
    effect(() => {
      const last = this.tracking.alerts()[0];
      if (last?.kind === 'interception') untracked(() => void this.reload());
    });
  }

  async ngOnInit() {
    this.zones.set(await this.api.zones());
    await this.reload();
    const timer = setInterval(() => void this.reload(), 4000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  time(ts: number) { return new Date(ts).toLocaleTimeString('fr-FR'); }

  private async reload() {
    try {
      const [d, m] = await Promise.all([this.api.myDrones(), this.api.activeFleet()]);
      this.drones.set(d);
      this.missions.set(m);
    } catch { /* ignoré : nouvelle tentative au prochain cycle */ }
  }

  async intercept(drone: Drone, action: Action) {
    const label = { HOVER: 'mettre en vol stationnaire', RETURN_HOME: 'rappeler à la base', LAND_NOW: 'faire atterrir immédiatement' }[action];
    if (!window.confirm(`Confirmer : ${label} le drone « ${drone.name} » ?`)) return;
    this.error.set('');
    try {
      await this.api.intercept(drone.id, action, 'Interception depuis le tableau de bord');
      await this.reload();
    } catch {
      this.error.set('Interception impossible (le drone n\'est peut-être plus en mission).');
    }
  }
}
