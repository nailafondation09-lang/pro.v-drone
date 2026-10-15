import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Merchant, Product, Zone } from '../../core/models';
import { CesiumMap, MapMarker } from '../../shared/cesium-map';
import { XofPipe } from '../../shared/format';

const MAX_PAYLOAD_G = 2000;

@Component({
  selector: 'app-shop',
  imports: [FormsModule, CesiumMap, XofPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Commander une livraison par drone</h1>
      <div class="split">
        <div class="stack">
          <section class="card">
            <h2>1. Choisissez un marchand</h2>
            @if (!merchants().length) { <p class="muted">Aucun marchand disponible pour le moment.</p> }
            <div class="stack">
              @for (m of merchants(); track m.id) {
                <button type="button" class="btn block" [class.primary]="m.id === merchant()?.id" (click)="select(m)">{{ m.businessName }}<span class="small"> — {{ m.address || 'adresse non renseignée' }}</span></button>
              }
            </div>
          </section>

          @if (merchant()) {
            <section class="card">
              <h2>2. Produits</h2>
              @if (!products().length) { <p class="muted">Aucun produit disponible.</p> }
              <table><tbody>
                @for (p of products(); track p.id) {
                  <tr>
                    <td>{{ p.name }}<div class="small muted">{{ p.weightG }} g</div></td>
                    <td>{{ p.priceXof | xof }}</td>
                    <td class="row" style="justify-content:flex-end">
                      <button class="btn small" (click)="change(p, -1)" [disabled]="!qty(p.id)">−</button>
                      <b>{{ qty(p.id) }}</b>
                      <button class="btn small" (click)="change(p, 1)">+</button>
                    </td>
                  </tr>
                }
              </tbody></table>
            </section>

            <section class="card">
              <h2>3. Adresse de livraison</h2>
              <p class="small muted">Cliquez sur la carte pour placer le point de livraison (hors zones rouges), ou saisissez les coordonnées.</p>
              <div class="field"><label for="addr">Adresse / repère</label><input id="addr" [(ngModel)]="address" name="addr" /></div>
              <div class="row">
                <div class="field grow"><label for="dla">Latitude</label><input id="dla" type="number" step="any" [(ngModel)]="dLat" name="dla" /></div>
                <div class="field grow"><label for="dlo">Longitude</label><input id="dlo" type="number" step="any" [(ngModel)]="dLng" name="dlo" /></div>
              </div>
              <button class="btn small" (click)="locate()">📍 Ma position</button>
            </section>

            <section class="card">
              <div class="row spread"><span>Poids total</span><b [class.error]="overweight()">{{ weight() }} g / {{ max }} g</b></div>
              <div class="row spread"><span>Total</span><span class="kpi">{{ total() | xof }}</span></div>
              @if (error()) { <div class="error">{{ error() }}</div> }
              <button class="btn primary block" style="margin-top:.5rem" [disabled]="busy() || !count() || overweight() || dLat === null || dLng === null" (click)="order()">
                {{ busy() ? 'Création…' : 'Commander et payer' }}
              </button>
            </section>
          }
        </div>
        <div class="card pad0 map-box">
          <app-cesium-map [markers]="markers()" [zones]="zones()" [center]="center()" [pickable]="!!merchant()" (picked)="pick($event)" />
        </div>
      </div>
    </div>
  `,
})
export class ShopPage implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  protected max = MAX_PAYLOAD_G;
  merchants = signal<Merchant[]>([]);
  merchant = signal<Merchant | null>(null);
  products = signal<Product[]>([]);
  zones = signal<Zone[]>([]);
  cart = signal<Record<string, number>>({});
  address = '';
  dLat: number | null = null;
  dLng: number | null = null;
  error = signal('');
  busy = signal(false);
  private delivery = signal<[number, number] | null>(null);

  count = computed(() => Object.values(this.cart()).reduce((a, b) => a + b, 0));
  weight = computed(() => this.products().reduce((s, p) => s + p.weightG * (this.cart()[p.id] ?? 0), 0));
  total = computed(() => this.products().reduce((s, p) => s + p.priceXof * (this.cart()[p.id] ?? 0), 0));
  overweight = computed(() => this.weight() > MAX_PAYLOAD_G);
  center = computed<[number, number] | null>(() => { const m = this.merchant(); return m ? [m.lat, m.lng] : null; });
  markers = computed<MapMarker[]>(() => {
    const out: MapMarker[] = this.merchants().map((m) => ({ id: m.id, label: m.businessName, lat: m.lat, lng: m.lng, color: '#2563eb' }));
    const d = this.delivery();
    if (d) out.push({ id: 'dest', label: 'Livraison', lat: d[0], lng: d[1], color: '#22c55e' });
    return out;
  });

  async ngOnInit() {
    const [m, z] = await Promise.all([this.api.merchants(), this.api.zones()]);
    this.merchants.set(m);
    this.zones.set(z);
  }

  qty(id: string) { return this.cart()[id] ?? 0; }

  async select(m: Merchant) {
    this.merchant.set(m);
    this.cart.set({});
    this.products.set(await this.api.productsOf(m.id));
  }

  change(p: Product, delta: number) {
    this.cart.update((c) => ({ ...c, [p.id]: Math.max(0, (c[p.id] ?? 0) + delta) }));
  }

  pick(e: { lat: number; lng: number }) {
    this.dLat = +e.lat.toFixed(6);
    this.dLng = +e.lng.toFixed(6);
    this.delivery.set([this.dLat, this.dLng]);
  }

  locate() {
    navigator.geolocation?.getCurrentPosition((p) => this.pick({ lat: p.coords.latitude, lng: p.coords.longitude }));
  }

  async order() {
    const m = this.merchant();
    if (!m || this.dLat === null || this.dLng === null) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const items = Object.entries(this.cart()).filter(([, q]) => q > 0).map(([productId, quantity]) => ({ productId, quantity }));
      const o = await this.api.createOrder({ merchantId: m.id, items, deliveryLat: this.dLat, deliveryLng: this.dLng, deliveryAddress: this.address || undefined });
      const pay = await this.api.initiatePayment(o.id);
      window.location.href = pay.paymentUrl; // page de paiement du fournisseur (Mobile Money / carte)
    } catch (e) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(' · ') : (msg ?? 'Impossible de créer la commande.'));
      this.busy.set(false);
    }
  }
}
