import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-audit',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Journal d'audit</h1>
      <div class="card pad0 table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Action</th><th>Entité</th><th>Auteur</th></tr></thead>
          <tbody>
            @for (a of logs(); track a.id) {
              <tr><td>{{ a.at | date: 'dd/MM HH:mm:ss' }}</td><td><b>{{ a.action }}</b></td><td class="small">{{ a.entity }} {{ a.entityId }}</td><td class="small">{{ a.userId }}</td></tr>
            } @empty { <tr><td colspan="4" class="empty">Aucune entrée.</td></tr> }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class AuditPage implements OnInit {
  private api = inject(ApiService);
  logs = signal<{ id: string; userId: string | null; action: string; entity: string; entityId: string; at: string }[]>([]);
  async ngOnInit() { this.logs.set(await this.api.audit()); }
}
