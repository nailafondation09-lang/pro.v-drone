import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Order } from '../../core/models';
import { StatusLabelPipe, XofPipe, statusClass } from '../../shared/format';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, DatePipe, XofPipe, StatusLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Mes commandes</h1>
      <div class="card pad0 table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Montant</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            @for (o of orders(); track o.id) {
              <tr>
                <td>{{ o.createdAt | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ o.totalXof | xof }}</td>
                <td><span class="badge" [class]="cls(o.status)">{{ o.status | statusLabel }}</span></td>
                <td style="text-align:right">
                  @if (o.status === 'PENDING_PAYMENT') { <button class="btn small primary" (click)="pay(o)">Payer</button> }
                  <a class="btn small" [routerLink]="['/customer/orders', o.id]">Suivre</a>
                </td>
              </tr>
            } @empty { <tr><td colspan="4" class="empty">Aucune commande pour le moment.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class OrdersPage implements OnInit {
  private api = inject(ApiService);
  orders = signal<Order[]>([]);
  protected cls = (s: string) => 'badge ' + statusClass(s);

  async ngOnInit() { this.orders.set(await this.api.myOrders()); }

  async pay(o: Order) {
    const p = await this.api.initiatePayment(o.id);
    window.location.href = p.paymentUrl;
  }
}
