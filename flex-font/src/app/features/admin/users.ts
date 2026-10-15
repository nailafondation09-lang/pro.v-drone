import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { AppUser } from '../../core/models';

@Component({
  selector: 'app-users',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Utilisateurs</h1>
      <div class="card pad0 table-wrap">
        <table>
          <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Inscrit</th><th>Actif</th></tr></thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr>
                <td>{{ u.fullName }}</td><td>{{ u.email }}</td>
                <td><span class="badge">{{ u.role }}</span> @if (u.adminGroup) { <span class="small muted">{{ u.adminGroup.name }}</span> }</td>
                <td>{{ u.createdAt | date: 'dd/MM/yyyy' }}</td>
                <td>
                  @if (canBan() && u.id !== me()) {
                    <input type="checkbox" [checked]="u.isActive" (change)="toggle(u)" [attr.aria-label]="'Actif : ' + u.fullName" />
                  } @else { {{ u.isActive ? 'Oui' : 'Non' }} }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class UsersPage implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  users = signal<AppUser[]>([]);
  me = () => this.auth.user()?.id;
  canBan = () => this.auth.hasPermission('users.ban');

  async ngOnInit() { await this.load(); }
  private async load() { this.users.set(await this.api.adminUsers()); }

  async toggle(u: AppUser) {
    await this.api.setUserActive(u.id, !u.isActive);
    await this.load();
  }
}
