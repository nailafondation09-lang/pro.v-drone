import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <form class="card" (ngSubmit)="submit()" #f="ngForm">
        <h1>🚁 DroneShip</h1>
        <p class="muted">Connectez-vous pour commander ou gérer vos livraisons par drone.</p>
        <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="username" /></div>
        <div class="field"><label for="pw">Mot de passe</label><input id="pw" name="pw" type="password" [(ngModel)]="password" required autocomplete="current-password" /></div>
        @if (error()) { <div class="error">{{ error() }}</div> }
        <button class="btn primary block" [disabled]="busy() || f.invalid">{{ busy() ? 'Connexion…' : 'Se connecter' }}</button>
        <p class="small muted" style="margin-top:1rem">Pas de compte ? <a routerLink="/register">Créer un compte</a></p>
      </form>
    </div>
  `,
  styles: [`.wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem; } form { width: 100%; max-width: 400px; }`],
})
export class LoginPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = '';
  password = '';
  error = signal('');
  busy = signal(false);

  async submit() {
    this.busy.set(true);
    this.error.set('');
    try {
      const u = await this.auth.login(this.email, this.password);
      await this.router.navigateByUrl(this.auth.homeFor(u.role));
    } catch (e) {
      this.error.set(typeof e === 'object' && e && 'status' in e && (e as { status: number }).status === 429 ? 'Trop de tentatives, réessayez dans une minute.' : 'Email ou mot de passe invalide.');
    } finally {
      this.busy.set(false);
    }
  }
}
