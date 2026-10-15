import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { LatLng, Zone } from '../../core/models';
import { CesiumMap } from '../../shared/cesium-map';

@Component({
  selector: 'app-zones',
  imports: [FormsModule, CesiumMap],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Zones interdites et dangereuses</h1>
      <div class="split">
        <div class="stack">
          <form class="card" (ngSubmit)="save()" #f="ngForm">
            <h2>Nouvelle zone</h2>
            <p class="small muted">Cliquez sur la carte pour ajouter les sommets (3 minimum).</p>
            <div class="field"><label for="zn">Nom</label><input id="zn" name="zn" [(ngModel)]="name" required /></div>
            <div class="field"><label for="zt">Type</label>
              <select id="zt" name="zt" [(ngModel)]="type"><option value="FORBIDDEN">Interdite (le drone la contourne)</option><option value="DANGEROUS">Dangereuse (alerte)</option></select></div>
            <div class="row">
              <div class="field grow"><label for="za">Altitude min (m)</label><input id="za" name="za" type="number" [(ngModel)]="minAlt" /></div>
              <div class="field grow"><label for="zb">Altitude max (m)</label><input id="zb" name="zb" type="number" [(ngModel)]="maxAlt" /></div>
            </div>
            <div class="row spread small"><span>{{ draft().length }} sommet(s)</span>
              <span><button type="button" class="btn small" (click)="undo()" [disabled]="!draft().length">Annuler le dernier</button> <button type="button" class="btn small" (click)="draft.set([])" [disabled]="!draft().length">Vider</button></span></div>
            @if (error()) { <div class="error">{{ error() }}</div> }
            <button class="btn primary block" style="margin-top:.6rem" [disabled]="f.invalid || draft().length < 3">Créer la zone</button>
          </form>

          <section class="card pad0 table-wrap">
            <table>
              <thead><tr><th>Zone</th><th>Alt.</th><th>Actif</th><th></th></tr></thead>
              <tbody>
                @for (z of zones(); track z.id) {
                  <tr>
                    <td><span class="badge" [class.bad]="z.type === 'FORBIDDEN'" [class.warn]="z.type === 'DANGEROUS'">{{ z.type === 'FORBIDDEN' ? 'Interdite' : 'Dangereuse' }}</span> {{ z.name }}</td>
                    <td class="small">{{ z.minAltM }}–{{ z.maxAltM }} m</td>
                    <td><input type="checkbox" [checked]="z.active" (change)="toggle(z)" [attr.aria-label]="'Active : ' + z.name" /></td>
                    <td style="text-align:right"><button class="btn small danger" (click)="remove(z)">Supprimer</button></td>
                  </tr>
                } @empty { <tr><td colspan="4" class="empty">Aucune zone.</td></tr> }
              </tbody>
            </table>
          </section>
        </div>
        <div class="card pad0 map-box">
          <app-cesium-map [zones]="zones()" [draft]="draft()" [pickable]="true" [center]="center" (picked)="add($event)" />
        </div>
      </div>
    </div>
  `,
})
export class ZonesPage implements OnInit {
  private api = inject(ApiService);
  zones = signal<Zone[]>([]);
  draft = signal<LatLng[]>([]);
  error = signal('');
  name = ''; type: 'FORBIDDEN' | 'DANGEROUS' = 'FORBIDDEN'; minAlt = 0; maxAlt = 150;
  center: LatLng = [6.1725, 1.2314]; // Lomé
  protected count = computed(() => this.zones().length);

  async ngOnInit() { await this.load(); }
  private async load() { this.zones.set(await this.api.adminZones()); }

  add(p: { lat: number; lng: number }) { this.draft.update((d) => [...d, [+p.lat.toFixed(6), +p.lng.toFixed(6)]]); }
  undo() { this.draft.update((d) => d.slice(0, -1)); }

  async save() {
    this.error.set('');
    try {
      await this.api.createZone({ name: this.name, type: this.type, polygon: this.draft(), minAltM: this.minAlt, maxAltM: this.maxAlt });
      this.name = ''; this.draft.set([]);
      await this.load();
    } catch (e) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(' · ') : (msg ?? 'Création impossible.'));
    }
  }

  async toggle(z: Zone) { await this.api.updateZone(z.id, { active: !z.active }); await this.load(); }

  async remove(z: Zone) {
    if (!window.confirm(`Supprimer la zone « ${z.name} » ?`)) return;
    await this.api.deleteZone(z.id);
    await this.load();
  }
}
