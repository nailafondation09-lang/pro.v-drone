import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Product } from '../../core/models';
import { XofPipe } from '../../shared/format';

@Component({
  selector: 'app-products',
  imports: [FormsModule, XofPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <h1>Mes produits</h1>
      <div class="grid cols-2">
        <form class="card" (ngSubmit)="add()" #f="ngForm">
          <h2>Ajouter un produit</h2>
          <div class="field"><label for="n">Nom</label><input id="n" name="n" [(ngModel)]="name" required /></div>
          <div class="row">
            <div class="field grow"><label for="p">Prix (FCFA)</label><input id="p" name="p" type="number" [(ngModel)]="price" min="0" required /></div>
            <div class="field grow"><label for="w">Poids (g)</label><input id="w" name="w" type="number" [(ngModel)]="weight" min="1" required /></div>
          </div>
          @if (error()) { <div class="error">{{ error() }}</div> }
          <button class="btn primary" [disabled]="f.invalid">Ajouter</button>
        </form>
        <div class="card pad0 table-wrap">
          <table>
            <thead><tr><th>Produit</th><th>Prix</th><th>Poids</th><th>Dispo</th></tr></thead>
            <tbody>
              @for (p of products(); track p.id) {
                <tr><td>{{ p.name }}</td><td>{{ p.priceXof | xof }}</td><td>{{ p.weightG }} g</td>
                  <td><input type="checkbox" [checked]="p.available" (change)="toggle(p)" aria-label="Disponible" /></td></tr>
              } @empty { <tr><td colspan="4" class="empty">Aucun produit.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ProductsPage implements OnInit {
  private api = inject(ApiService);
  products = signal<Product[]>([]);
  error = signal('');
  name = ''; price = 0; weight = 500;

  async ngOnInit() { await this.load(); }
  private async load() {
    try { this.products.set(await this.api.myProducts()); } catch { this.error.set('Votre compte marchand n\'est pas encore approuvé.'); }
  }

  async add() {
    this.error.set('');
    try {
      await this.api.createProduct({ name: this.name, priceXof: this.price, weightG: this.weight });
      this.name = '';
      await this.load();
    } catch (e) {
      this.error.set((e as { error?: { message?: string } })?.error?.message ?? 'Ajout impossible.');
    }
  }

  async toggle(p: Product) {
    await this.api.updateProduct(p.id, { available: !p.available });
    await this.load();
  }
}
