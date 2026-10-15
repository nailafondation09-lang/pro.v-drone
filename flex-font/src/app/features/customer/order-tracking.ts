import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Order, Zone } from '../../core/models';
import { TrackingService } from '../../core/tracking.service';
import { CesiumMap, MapDrone, MapMarker, MapRoute } from '../../shared/cesium-map';
import { ChronoPipe, StatusLabelPipe, XofPipe, statusClass } from '../../shared/format';

const STEPS: { key: string; label: string }[] = [
  { key: 'PAID', label: 'Paiement' },
  { key: 'AWAITING_MERCHANT', label: 'Validation marchand' },
  { key: 'IN_FLIGHT', label: 'Drone en route' },
  { key: 'DELIVERED', label: 'Livré' },
];
const ORDER_RANK: Record<string, number> = { PENDING_PAYMENT: 0, PAID: 1, AWAITING_MERCHANT: 2, ACCEPTED: 3, DRONE_ASSIGNED: 3, IN_FLIGHT: 3, DELIVERED: 4 };

@Component({
  selector: 'app-order-tracking',
  imports: [RouterLink, CesiumMap, ChronoPipe, XofPipe, StatusLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <div class="row spread"><h1>Suivi de ma commande</h1><a class="btn small" routerLink="/customer/orders">← Mes commandes</a></div>
      @if (order(); as o) {
        <div class="split">
          <div class="stack">
            <section class="card">
              <div class="row spread"><span class="badge" [class]="'badge ' + cls(o.status)">{{ o.status | statusLabel }}</span><b>{{ o.totalXof | xof }}</b></div>
              <ol class="steps">
                @for (s of steps; track s.key; let i = $index) {
                  <li [class.done]="rank() > i + 1" [class.current]="rank() === i + 1">{{ s.label }}</li>
                }
              </ol>
              @if (['REJECTED','REFUNDED'].includes(o.status)) { <p class="error">Le marchand a refusé la commande. Vous avez été remboursé.</p> }
              @if (o.status === 'INTERCEPTED') { <p class="error">La livraison a été interrompue par mesure de sécurité. Contactez le marchand.</p> }
              @if (o.status === 'PENDING_PAYMENT') { <p class="notice small">Paiement en attente. Finalisez-le depuis « Mes commandes ».</p> }
            </section>

            @if (tel(); as t) {
              <section class="card">
                <div class="row spread">
                  <div><div class="muted small">Temps écoulé</div><div class="chrono">{{ t.elapsedS | chrono }}</div></div>
                  <div><div class="muted small">Arrivée estimée</div><div class="chrono">{{ t.etaS | chrono }}</div></div>
                </div>
                <hr style="border:0;border-top:1px solid var(--line);margin:.8rem 0" />
                <div class="row spread small">
                  <span>Altitude <b>{{ t.altitudeM }} m</b></span>
                  <span>Vitesse <b>{{ (t.speedMs * 3.6).toFixed(0) }} km/h</b></span>
                  <span>Reste <b>{{ t.remainingM }} m</b></span>
                </div>
              </section>
            } @else if (o.status === 'IN_FLIGHT') {
              <section class="card muted">En attente du signal du drone…</section>
            } @else if (o.status === 'DELIVERED') {
              <section class="card"><b>🎉 Colis livré !</b></section>
            }
          </div>
          <div class="card pad0 map-box">
            <app-cesium-map [drones]="drones()" [routes]="routes()" [markers]="markers()" [zones]="zones()" [center]="center()" [followId]="null" />
          </div>
        </div>
      } @else { <p class="muted">Chargement…</p> }
    </div>
  `,
  styles: [`
    .steps { list-style: none; padding: 0; margin: 1rem 0 0; display: grid; gap: .5rem; }
    .steps li { padding-left: 1.6rem; position: relative; color: var(--muted); }
    .steps li::before { content: ''; position: absolute; left: 0; top: .25rem; width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--line); background: #fff; }
    .steps li.done { color: var(--ink); } .steps li.done::before { background: var(--ok); border-color: var(--ok); }
    .steps li.current { color: var(--brand); font-weight: 700; } .steps li.current::before { border-color: var(--brand); background: var(--brand); }
  `],
})
export class OrderTrackingPage implements OnInit {
  id = input.required<string>();
  private api = inject(ApiService);
  private tracking = inject(TrackingService);
  private destroyRef = inject(DestroyRef);

  protected steps = STEPS;
  order = signal<Order | null>(null);
  zones = signal<Zone[]>([]);
  protected cls = statusClass;

  rank = computed(() => ORDER_RANK[this.order()?.status ?? ''] ?? 0);
  tel = computed(() => {
    const m = this.order()?.mission;
    return m ? this.tracking.telemetry()[m.droneId] ?? null : null;
  });
  drones = computed<MapDrone[]>(() => {
    const t = this.tel();
    return t && this.order()?.status === 'IN_FLIGHT' ? [{ id: t.droneId, name: 'Votre colis', lat: t.lat, lng: t.lng, alt: t.altitudeM, status: 'IN_FLIGHT' }] : [];
  });
  routes = computed<MapRoute[]>(() => {
    const m = this.order()?.mission;
    return m ? [{ id: m.id, color: '#38bdf8', points: m.route }] : [];
  });
  markers = computed<MapMarker[]>(() => {
    const o = this.order();
    if (!o) return [];
    const out: MapMarker[] = [{ id: 'dest', label: 'Livraison', lat: o.deliveryLat, lng: o.deliveryLng, color: '#22c55e' }];
    const base = o.mission?.route[0];
    if (base) out.push({ id: 'base', label: 'Marchand', lat: base.lat, lng: base.lng, color: '#2563eb' });
    return out;
  });
  center = computed<[number, number] | null>(() => { const o = this.order(); return o ? [o.deliveryLat, o.deliveryLng] : null; });

  constructor() {
    // Recharge la commande à chaque événement de mission / statut reçu par WebSocket.
    effect(() => { this.tracking.orderEvents(); untracked(() => void this.load()); });
  }

  async ngOnInit() {
    await this.load();
    this.zones.set(await this.api.zones());
    this.tracking.subscribeOrder(this.id());
    const timer = setInterval(() => void this.load(), 5000); // filet de sécurité si le WebSocket est coupé
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  private async load() {
    try { this.order.set(await this.api.order(this.id())); } catch { /* ignoré */ }
  }
}
