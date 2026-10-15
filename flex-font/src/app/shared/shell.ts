import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { TrackingService } from '../core/tracking.service';

interface NavItem { label: string; link: string; perm?: string }

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header>
      <div class="bar">
        <a class="logo" [routerLink]="home()">🚁 DroneShip</a>
        <nav>
          @for (n of nav(); track n.link) {
            <a [routerLink]="n.link" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: n.link === home() }">{{ n.label }}</a>
          }
        </nav>
        <div class="who">
          <span class="dot" [class.on]="tracking.connected()" title="Temps réel"></span>
          <span class="muted small">{{ auth.user()?.fullName }}</span>
          <button class="btn small" (click)="logout()">Déconnexion</button>
        </div>
      </div>
    </header>
    <main><router-outlet /></main>
  `,
  styles: [`
    header { background: #0f172a; color: #fff; position: sticky; top: 0; z-index: 10; }
    .bar { max-width: 1280px; margin: 0 auto; padding: .6rem 1.25rem; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .logo { color: #fff; font-weight: 800; font-size: 1.1rem; text-decoration: none; }
    nav { display: flex; gap: .25rem; flex: 1; flex-wrap: wrap; }
    nav a { color: #cbd5e1; padding: .4rem .75rem; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: .9rem; }
    nav a:hover { background: #1e293b; color: #fff; }
    nav a.active { background: #2563eb; color: #fff; }
    .who { display: flex; align-items: center; gap: .6rem; }
    .who .muted { color: #94a3b8; }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: #64748b; }
    .dot.on { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
  `],
})
export class Shell {
  protected auth = inject(AuthService);
  protected tracking = inject(TrackingService);
  private router = inject(Router);

  protected home = computed(() => this.auth.homeFor(this.auth.user()?.role));

  protected nav = computed<NavItem[]>(() => {
    switch (this.auth.user()?.role) {
      case 'CUSTOMER':
        return [{ label: 'Commander', link: '/customer' }, { label: 'Mes commandes', link: '/customer/orders' }];
      case 'MERCHANT':
        return [
          { label: 'Supervision', link: '/merchant' }, { label: 'Commandes', link: '/merchant/orders' },
          { label: 'Drones', link: '/merchant/drones' }, { label: 'Produits', link: '/merchant/products' },
        ];
      case 'ADMIN':
        return ([
          { label: 'Supervision', link: '/admin', perm: 'fleet.view' }, { label: 'Utilisateurs', link: '/admin/users', perm: 'users.read' },
          { label: 'Marchands', link: '/admin/merchants', perm: 'merchants.approve' }, { label: 'Zones', link: '/admin/zones', perm: 'zones.write' },
          { label: 'Groupes', link: '/admin/groups', perm: 'groups.manage' }, { label: 'Audit', link: '/admin/audit', perm: 'groups.manage' },
        ] as NavItem[]).filter((n) => !n.perm || this.auth.hasPermission(n.perm));
      default:
        return [];
    }
  });

  constructor() {
    // Le flux temps réel est ouvert dès qu'on est connecté.
    effect(() => { if (this.auth.isLoggedIn()) this.tracking.connect(); });
  }

  protected logout() {
    this.tracking.disconnect();
    this.auth.logout();
  }
}
