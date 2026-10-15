import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

/** Page de paiement FACTICE (PAYMENT_PROVIDER=mock). Remplacée par la page hébergée du fournisseur en production. */
@Component({
  selector: 'app-mock-pay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" style="max-width:480px">
      <div class="card stack">
        <h1>Paiement (simulation)</h1>
        <p class="notice small">Environnement de développement : aucun argent réel n'est débité. En production, cette page est remplacée par Flutterwave / CinetPay (T-Money, Flooz, cartes).</p>
        @if (error()) { <div class="error">{{ error() }}</div> }
        <button class="btn primary block" [disabled]="busy()" (click)="confirm()">Simuler un paiement réussi</button>
        <button class="btn block" (click)="cancel()">Annuler</button>
      </div>
    </div>
  `,
})
export class MockPayPage {
  private api = inject(ApiService);
  private router = inject(Router);
  private ref = inject(ActivatedRoute).snapshot.queryParamMap.get('ref') ?? '';
  busy = signal(false);
  error = signal('');

  async confirm() {
    this.busy.set(true);
    try {
      await this.api.confirmMockPayment(this.ref);
      await this.router.navigateByUrl('/customer/orders');
    } catch {
      this.error.set('Paiement impossible.');
      this.busy.set(false);
    }
  }

  cancel() { void this.router.navigateByUrl('/customer/orders'); }
}
