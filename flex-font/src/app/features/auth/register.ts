import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <form class="card" (ngSubmit)="submit()" #f="ngForm">
        <h1>Créer un compte</h1>
        <div class="row" style="margin-bottom:.75rem">
          <button type="button" class="btn grow" [class.primary]="role() === 'CUSTOMER'" (click)="role.set('CUSTOMER')">Client</button>
          <button type="button" class="btn grow" [class.primary]="role() === 'MERCHANT'" (click)="role.set('MERCHANT')">Marchand</button>
        </div>
        <div class="field"><label for="fn">Nom complet</label><input id="fn" name="fn" [(ngModel)]="fullName" required minlength="2" /></div>
        <div class="field"><label for="em">Email</label><input id="em" name="em" type="email" [(ngModel)]="email" required /></div>
        <div class="field"><label for="ph">Téléphone (Mobile Money)</label><input id="ph" name="ph" [(ngModel)]="phone" /></div>
        <div class="field"><label for="pw">Mot de passe (8 caractères min.)</label><input id="pw" name="pw" type="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password" /></div>
        @if (role() === 'MERCHANT') {
          <div class="field"><label for="bn">Nom de l'entreprise</label><input id="bn" name="bn" [(ngModel)]="businessName" required /></div>
          <div class="field"><label for="ad">Adresse</label><input id="ad" name="ad" [(ngModel)]="address" /></div>
          <div class="row">
            <div class="field grow"><label for="la">Latitude (base)</label><input id="la" name="la" type="number" step="any" [(ngModel)]="lat" required /></div>
            <div class="field grow"><label for="lo">Longitude (base)</label><input id="lo" name="lo" type="number" step="any" [(ngModel)]="lng" required /></div>
          </div>
          <button type="button" class="btn small" (click)="locate()">📍 Utiliser ma position</button>
          <p class="notice small" style="margin-top:.75rem">Votre compte marchand devra être approuvé par un administrateur avant de pouvoir enregistrer des drones.</p>
        }
        @if (error()) { <div class="error">{{ error() }}</div> }
        <button class="btn primary block" style="margin-top:.75rem" [disabled]="busy() || f.invalid">Créer mon compte</button>
        <p class="small muted" style="margin-top:1rem">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
      </form>
    </div>
  `,
  styles: [`.wrap { min-height: 100vh; display: grid; place-items: center; padding: 1rem; } form { width: 100%; max-width: 460px; }`],
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  role = signal<'CUSTOMER' | 'MERCHANT'>('CUSTOMER');
  fullName = ''; email = ''; phone = ''; password = '';
  businessName = ''; address = '';
  lat: number | null = 6.1725; lng: number | null = 1.2314;
  error = signal('');
  busy = signal(false);

  locate() {
    navigator.geolocation?.getCurrentPosition((p) => { this.lat = +p.coords.latitude.toFixed(6); this.lng = +p.coords.longitude.toFixed(6); });
  }

  async submit() {
    this.busy.set(true);
    this.error.set('');
    const body: Record<string, unknown> = { fullName: this.fullName, email: this.email, password: this.password, role: this.role(), ...(this.phone ? { phone: this.phone } : {}) };
    if (this.role() === 'MERCHANT') Object.assign(body, { businessName: this.businessName, address: this.address || undefined, lat: this.lat, lng: this.lng });
    try {
      const u = await this.auth.register(body);
      await this.router.navigateByUrl(this.auth.homeFor(u.role));
    } catch (e) {
      const msg = (e as { error?: { message?: string | string[] } })?.error?.message;
      this.error.set(Array.isArray(msg) ? msg.join(' · ') : (msg ?? 'Inscription impossible.'));
    } finally {
      this.busy.set(false);
    }
  }
}
