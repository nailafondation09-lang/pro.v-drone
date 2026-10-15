import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { ALL_PERMISSIONS, AdminGroup, AppUser } from '../../core/models';

@Component({
  selector: 'app-groups',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Groupes d'administrateurs</h1>
      <div class="grid cols-2">
        <div class="stack">
          <form class="card" (ngSubmit)="saveGroup()" #f="ngForm">
            <h2>{{ editing() ? 'Modifier le groupe' : 'Nouveau groupe' }}</h2>
            <div class="field"><label for="gn">Nom</label><input id="gn" name="gn" [(ngModel)]="name" required minlength="2" /></div>
            <p class="small muted">Permissions du groupe</p>
            @for (p of perms; track p.key) {
              <label class="row" style="font-weight:400"><input type="checkbox" [checked]="selected().includes(p.key)" (change)="togglePerm(p.key)" /> {{ p.label }}</label>
            }
            @if (error()) { <div class="error">{{ error() }}</div> }
            <div class="row" style="margin-top:.6rem">
              <button class="btn primary" [disabled]="f.invalid || !selected().length">{{ editing() ? 'Enregistrer' : 'Créer' }}</button>
              @if (editing()) { <button type="button" class="btn" (click)="reset()">Annuler</button> }
            </div>
          </form>

          <form class="card" (ngSubmit)="addAdmin()" #g="ngForm">
            <h2>Nouvel administrateur</h2>
            <div class="field"><label for="an">Nom complet</label><input id="an" name="an" [(ngModel)]="aName" required /></div>
            <div class="field"><label for="ae">Email</label><input id="ae" name="ae" type="email" [(ngModel)]="aEmail" required /></div>
            <div class="field"><label for="ap">Mot de passe (10 caractères min.)</label><input id="ap" name="ap" type="password" [(ngModel)]="aPass" required minlength="10" autocomplete="new-password" /></div>
            <div class="field"><label for="ag">Groupe</label>
              <select id="ag" name="ag" [(ngModel)]="aGroup" required>@for (gr of groups(); track gr.id) { <option [value]="gr.id">{{ gr.name }}</option> }</select></div>
            @if (adminError()) { <div class="error">{{ adminError() }}</div> }
            <button class="btn primary" [disabled]="g.invalid">Créer l'administrateur</button>
          </form>
        </div>

        <div class="stack">
          @for (gr of groups(); track gr.id) {
            <section class="card">
              <div class="row spread"><h2>{{ gr.name }}</h2>@if (!gr.permissions.includes('*')) { <button class="btn small" (click)="edit(gr)">Modifier</button> }</div>
              <div class="row" style="gap:.35rem">
                @for (p of gr.permissions; track p) { <span class="badge">{{ p === '*' ? 'Toutes les permissions' : p }}</span> }
              </div>
              <p class="small muted" style="margin:.6rem 0 .2rem">Membres</p>
              @for (m of gr.members ?? []; track m.id) { <div class="small">{{ m.fullName }} — {{ m.email }}</div> } @empty { <div class="small muted">Aucun membre</div> }
            </section>
          }
        </div>
      </div>
    </div>
  `,
})
export class GroupsPage implements OnInit {
  private api = inject(ApiService);
  protected perms = ALL_PERMISSIONS;
  groups = signal<AdminGroup[]>([]);
  editing = signal<AdminGroup | null>(null);
  selected = signal<string[]>([]);
  error = signal('');
  adminError = signal('');
  name = '';
  aName = ''; aEmail = ''; aPass = ''; aGroup = '';
  protected _users = signal<AppUser[]>([]);

  async ngOnInit() { await this.load(); }
  private async load() {
    const g = await this.api.groups();
    this.groups.set(g);
    if (!this.aGroup && g.length) this.aGroup = (g.find((x) => !x.permissions.includes('*')) ?? g[0]).id;
  }

  togglePerm(k: string) { this.selected.update((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k])); }

  edit(g: AdminGroup) { this.editing.set(g); this.name = g.name; this.selected.set([...g.permissions]); }
  reset() { this.editing.set(null); this.name = ''; this.selected.set([]); this.error.set(''); }

  async saveGroup() {
    this.error.set('');
    try {
      const body = { name: this.name, permissions: this.selected() };
      const e = this.editing();
      if (e) await this.api.updateGroup(e.id, body); else await this.api.createGroup(body);
      this.reset();
      await this.load();
    } catch (err) {
      this.error.set((err as { error?: { message?: string } })?.error?.message?.toString() ?? 'Enregistrement impossible.');
    }
  }

  async addAdmin() {
    this.adminError.set('');
    try {
      await this.api.createAdmin({ fullName: this.aName, email: this.aEmail, password: this.aPass, groupId: this.aGroup });
      this.aName = this.aEmail = this.aPass = '';
      await this.load();
    } catch (err) {
      const msg = (err as { error?: { message?: string | string[] } })?.error?.message;
      this.adminError.set(Array.isArray(msg) ? msg.join(' · ') : (msg ?? 'Création impossible.'));
    }
  }
}
