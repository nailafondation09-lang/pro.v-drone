import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { Order } from '../../core/models';
import { TrackingService } from '../../core/tracking.service';
import { StatusLabelPipe, XofPipe, statusClass } from '../../shared/format';

@Component({
  selector: 'app-merchant-orders',
  imports: [DatePipe, XofPipe, StatusLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Commandes</h1>
      @if (error()) { <div class="error">{{ error() }}</div> }
      <div class="card pad0 table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Articles</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            @for (o of orders(); track o.id) {
              <tr>
                <td>{{ o.createdAt | date: 'dd/MM HH:mm' }}</td>
                <td>@for (i of o.items; track i.id) { <div class="small">{{ i.quantity }} × {{ i.product?.name }}</div> }</td>
                <td>{{ o.totalXof | xof }}</td>
                <td><span class="badge" [class]="'badge ' + cls(o.status)">{{ o.status | statusLabel }}</span></td>
                <td style="text-align:right">
                  @if (o.status === 'AWAITING_MERCHANT') {
                    <button class="btn small primary" [disabled]="busy() === o.id" (click)="accept(o)">Valider & lancer</button>
                    <button class="btn small danger" [disabled]="busy() === o.id" (click)="reject(o)">Refuser</button>
                  }
                </td>
              </tr>
            } @empty { <tr><td colspan="5" class="empty">Aucune commande.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class MerchantOrdersPage implements OnInit {
  private api = inject(ApiService);
  private tracking = inject(TrackingService);
  orders = signal<Order[]>([]);
  busy = signal<string | null>(null);
  error = signal('');
  protected cls = statusClass;

  constructor() {
    effect(() => { this.tracking.orderEvents(); untracked(() => void this.load()); });
  }

  ngOnInit() { return this.load(); }

  private async load() { this.orders.set(await this.api.merchantOrders()); }

  async accept(o: Order) {
    this.busy.set(o.id); this.error.set('');
    try { await this.api.acceptOrder(o.id); } catch (e) {
      this.error.set((e as { error?: { message?: string } })?.error?.message ?? 'Impossible de lancer la livraison.');
    }
    this.busy.set(null);
    await this.load();
  }

  async reject(o: Order) {
    if (!window.confirm('Refuser cette commande ? Le client sera remboursé.')) return;
    this.busy.set(o.id); this.error.set('');
    try { await this.api.rejectOrder(o.id); } catch { this.error.set('Impossible de refuser la commande.'); }
    this.busy.set(null);
    await this.load();
  }
}
