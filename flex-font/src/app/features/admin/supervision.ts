import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Drone, Mission, Zone } from '../../core/models';
import { TrackingService } from '../../core/tracking.service';
import { CesiumMap, MapDrone, MapRoute } from '../../shared/cesium-map';
import { ChronoPipe, StatusLabelPipe, statusClass } from '../../shared/format';

const ACTIVE = ['IN_FLIGHT', 'HOVERING', 'RETURNING'];

@Component({
  selector: 'app-supervision',
  imports: [CesiumMap, ChronoPipe, StatusLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Supervision globale</h1>
      <div class="grid cols-3" style="margin-bottom:1rem">
        <div class="card"><div class="muted small">Drones enregistrés</div><div class="kpi">{{ drones().length }}</div></div>
        <div class="card"><div class="muted small">En mission</div><div class="kpi">{{ activeCount() }}</div></div>
        <div class="card"><div class="muted small">Alertes récentes</div><div class="kpi">{{ tracking.alerts().length }}</div></div>
      </div>
      <div class="split">
        <div class="stack">
          <section class="card pad0 table-wrap">
            <table>
              <thead><tr><th>Drone</th><th>Statut</th><th>Batt.</th><th>Chrono</th><th></th></tr></thead>
              <tbody>
                @for (r of rows(); track r.drone.id) {
                  <tr>
                    <td><b>{{ r.drone.name }}</b></td>
                    <td><span class="badge" [class]="'badge ' + cls(r.drone.status)">{{ r.drone.status | statusLabel }}</span>
                      @if (r.t?.zones?.length) { <span class="badge bad">zone</span> }</td>
                    <td>{{ r.battery.toFixed(0) }} %</td>
                    <td>{{ (r.t?.elapsedS ?? 0) | chrono }}</td>
                    <td style="text-align:right">
                      @if (r.active && canIntercept()) {
                        <button class="btn small danger" (click)="intercept(r.drone, 'LAND_NOW')">⛔</button>
                        <button class="btn small primary" (click)="intercept(r.drone, 'RETURN_HOME')">↩</button>
                      }
                    </td>
                  </tr>
                } @empty { <tr><td colspan="5" class="empty">Aucun drone.</td></tr> }
              </tbody>
            </table>
          </section>
          <section class="card">
            <h2>Alertes</h2>
            @for (a of tracking.alerts(); track a.id) { <div class="small" style="padding:.25rem 0">• {{ a.message }}</div> } @empty { <p class="muted small">Aucune alerte.</p> }
          </section>
          @if (error()) { <div class="error">{{ error() }}</div> }
        </div>
        <div class="card pad0 map-box">
          <app-cesium-map [drones]="mapDrones()" [routes]="routes()" [zones]="zones()" [center]="center()" />
        </div>
      </div>
    </div>
  `,
})
export class SupervisionPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  protected tracking = inject(TrackingService);
  private destroyRef = inject(DestroyRef);

  drones = signal<Drone[]>([]);
  missions = signal<Mission[]>([]);
  zones = signal<Zone[]>([]);
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
  activeCount = computed(() => this.rows().filter((r) => r.active).length);
  mapDrones = computed<MapDrone[]>(() => this.rows().map(({ drone, t, active }) => ({
    id: drone.id, name: drone.name, status: drone.status,
    lat: active && t ? t.lat : drone.lat, lng: active && t ? t.lng : drone.lng, alt: active && t ? t.altitudeM : drone.altitudeM,
  })));
  routes = computed<MapRoute[]>(() => this.missions().map((m) => ({ id: m.id, color: '#38bdf8', points: m.route })));
  center = computed<[number, number] | null>(() => { const d = this.drones()[0]; return d ? [d.lat, d.lng] : null; });
  canIntercept = computed(() => this.auth.hasPermission('drones.intercept'));

  constructor() {
    effect(() => { this.tracking.orderEvents(); untracked(() => void this.reload()); });
  }

  async ngOnInit() {
    this.zones.set(await this.api.zones());
    await this.reload();
    const timer = setInterval(() => void this.reload(), 4000);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private async reload() {
    try {
      const [d, m] = await Promise.all([this.api.adminDrones(), this.api.adminFleet()]);
      this.drones.set(d);
      this.missions.set(m);
    } catch { /* ignoré */ }
  }

  async intercept(d: Drone, action: 'RETURN_HOME' | 'LAND_NOW') {
    if (!window.confirm(`Confirmer l'interception du drone « ${d.name} » (${action === 'LAND_NOW' ? 'atterrissage immédiat' : 'retour base'}) ?`)) return;
    try { await this.api.intercept(d.id, action, 'Interception administrateur'); await this.reload(); } catch { this.error.set('Interception impossible.'); }
  }
}
