import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Drone } from '../../core/models';
import { StatusLabelPipe, statusClass } from '../../shared/format';

@Component({
  selector: 'app-drones',
  imports: [FormsModule, StatusLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Mes drones</h1>
      <div class="grid cols-2">
        <form class="card" (ngSubmit)="add()" #f="ngForm">
          <h2>Enregistrer un drone</h2>
          <div class="field"><label for="n">Nom</label><input id="n" name="n" [(ngModel)]="name" required minlength="2" /></div>
          <div class="field"><label for="s">Numéro de série</label><input id="s" name="s" [(ngModel)]="serial" required minlength="3" /></div>
          <div class="field"><label for="m">Modèle</label><input id="m" name="m" [(ngModel)]="model" /></div>
          <div class="row">
            <div class="field grow"><label for="p">Charge utile max (g)</label><input id="p" name="p" type="number" [(ngModel)]="payload" min="100" /></div>
            <div class="field grow"><label for="r">Portée max (m)</label><input id="r" name="r" type="number" [(ngModel)]="range" min="500" /></div>
          </div>
          @if (error()) { <div class="error">{{ error() }}</div> }
          <button class="btn primary" [disabled]="f.invalid">Enregistrer</button>
        </form>
        <div class="card pad0 table-wrap">
          <table>
            <thead><tr><th>Drone</th><th>Statut</th><th>Batterie</th><th></th></tr></thead>
            <tbody>
              @for (d of drones(); track d.id) {
                <tr>
                  <td><b>{{ d.name }}</b><div class="small muted">{{ d.serial }} · {{ d.maxPayloadG }} g · {{ d.maxRangeM }} m</div></td>
                  <td><span class="badge" [class]="'badge ' + cls(d.status)">{{ d.status | statusLabel }}</span></td>
                  <td>{{ d.batteryPct.toFixed(0) }} %</td>
                  <td style="text-align:right">
                    @if (d.status === 'IDLE') { <button class="btn small" (click)="setStatus(d, 'MAINTENANCE')">Maintenance</button> }
                    @if (d.status === 'MAINTENANCE') { <button class="btn small" (click)="setStatus(d, 'IDLE')">Remettre en service</button> }
                  </td>
                </tr>
              } @empty { <tr><td colspan="4" class="empty">Aucun drone.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class DronesPage implements OnInit {
  private api = inject(ApiService);
  drones = signal<Drone[]>([]);
  error = signal('');
  name = ''; serial = ''; model = ''; payload = 2000; range = 10000;
  protected cls = statusClass;

  async ngOnInit() { this.drones.set(await this.api.myDrones()); }

  async add() {
    this.error.set('');
    try {
      await this.api.registerDrone({ name: this.name, serial: this.serial, model: this.model || undefined, maxPayloadG: this.payload, maxRangeM: this.range });
      this.name = this.serial = this.model = '';
      this.drones.set(await this.api.myDrones());
    } catch (e) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(' · ') : (msg ?? 'Enregistrement impossible.'));
    }
  }

  async setStatus(d: Drone, status: 'IDLE' | 'MAINTENANCE') {
    await this.api.updateDrone(d.id, { status });
    this.drones.set(await this.api.myDrones());
  }
}
