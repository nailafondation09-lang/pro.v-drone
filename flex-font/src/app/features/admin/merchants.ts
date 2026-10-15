import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Merchant } from '../../core/models';
import { statusClass } from '../../shared/format';

@Component({
  selector: 'app-admin-merchants',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Marchands</h1>
      <div class="card pad0 table-wrap">
        <table>
          <thead><tr><th>Entreprise</th><th>Position</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            @for (m of merchants(); track m.id) {
              <tr>
                <td><b>{{ m.businessName }}</b><div class="small muted">{{ m.address }}</div></td>
                <td class="small">{{ m.lat.toFixed(4) }}, {{ m.lng.toFixed(4) }}</td>
                <td><span class="badge" [class]="'badge ' + cls(m.status ?? '')">{{ m.status }}</span></td>
                <td style="text-align:right">
                  @if (m.status !== 'APPROVED') { <button class="btn small primary" (click)="set(m, 'APPROVED')">Approuver</button> }
                  @if (m.status === 'APPROVED') { <button class="btn small danger" (click)="set(m, 'SUSPENDED')">Suspendre</button> }
                </td>
              </tr>
            } @empty { <tr><td colspan="4" class="empty">Aucun marchand.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AdminMerchantsPage implements OnInit {
  private api = inject(ApiService);
  merchants = signal<Merchant[]>([]);
  protected cls = statusClass;

  async ngOnInit() { await this.load(); }
  private async load() { this.merchants.set(await this.api.adminMerchants()); }

  async set(m: Merchant, status: string) {
    await this.api.setMerchantStatus(m.id, status);
    await this.load();
  }
}
