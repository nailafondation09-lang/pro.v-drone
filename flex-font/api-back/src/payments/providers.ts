import { createHmac, timingSafeEqual } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Order, Payment } from '../entities/entities.js';

export interface InitiateResult {
  paymentUrl: string;
}

export interface WebhookResult {
  providerRef: string;
  success: boolean;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  initiate(order: Order, payment: Payment, customerEmail: string): Promise<InitiateResult>;
  /** Vérifie la signature ET revérifie auprès du fournisseur. Lève une erreur si invalide. */
  parseWebhook(headers: Record<string, string | string[] | undefined>, body: any, rawBody?: Buffer): Promise<WebhookResult>;
  refund(payment: Payment): Promise<void>;
}

/** Fournisseur factice pour le développement. */
export class MockProvider implements PaymentProvider {
  readonly name = 'mock';
  constructor(private cfg: ConfigService) {}

  async initiate(_o: Order, payment: Payment): Promise<InitiateResult> {
    return { paymentUrl: `${this.cfg.get('FRONTEND_URL', 'http://localhost:4200')}/pay/mock?ref=${payment.providerRef}` };
  }

  static sign(secret: string, body: unknown) {
    return createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
  }

  async parseWebhook(headers: Record<string, any>, body: any): Promise<WebhookResult> {
    const secret = this.cfg.getOrThrow<string>('MOCK_WEBHOOK_SECRET');
    const given = Buffer.from(String(headers['x-mock-signature'] ?? ''));
    const expected = Buffer.from(MockProvider.sign(secret, body));
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) throw new Error('Signature invalide');
    return { providerRef: body.ref, success: body.status === 'successful', raw: body };
  }

  async refund(): Promise<void> {
    /* rien à faire */
  }
}

/**
 * Squelette Flutterwave (Mobile Money + cartes). À valider avec vos clés de test
 * et la documentation officielle avant mise en production.
 * Variables : FLW_SECRET_KEY, FLW_WEBHOOK_HASH, FRONTEND_URL
 */
export class FlutterwaveProvider implements PaymentProvider {
  readonly name = 'flutterwave';
  private base = 'https://api.flutterwave.com/v3';
  constructor(private cfg: ConfigService) {}

  private get key() {
    return this.cfg.getOrThrow<string>('FLW_SECRET_KEY');
  }

  async initiate(order: Order, payment: Payment, email: string): Promise<InitiateResult> {
    const res = await fetch(`${this.base}/payments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tx_ref: payment.providerRef,
        amount: order.totalXof,
        currency: 'XOF',
        redirect_url: `${this.cfg.get('FRONTEND_URL', 'http://localhost:4200')}/customer/orders/${order.id}`,
        payment_options: 'mobilemoneyfranco,card',
        customer: { email },
        customizations: { title: 'DroneShip' },
      }),
    });
    const json: any = await res.json();
    if (!res.ok || json.status !== 'success') throw new Error('Initialisation du paiement échouée');
    return { paymentUrl: json.data.link };
  }

  async parseWebhook(headers: Record<string, any>, body: any): Promise<WebhookResult> {
    if (headers['verif-hash'] !== this.cfg.getOrThrow('FLW_WEBHOOK_HASH')) throw new Error('Signature invalide');
    // Ne jamais faire confiance au corps : on revérifie la transaction auprès de l'API.
    const id = body?.data?.id;
    const res = await fetch(`${this.base}/transactions/${id}/verify`, { headers: { Authorization: `Bearer ${this.key}` } });
    const json: any = await res.json();
    const ok = json?.data?.status === 'successful' && json.data.currency === 'XOF';
    return { providerRef: json?.data?.tx_ref, success: ok, raw: json?.data };
  }

  async refund(payment: Payment): Promise<void> {
    // POST /transactions/:id/refund — nécessite l'id de transaction fournisseur (à stocker dans rawPayload).
    const id = (payment.rawPayload as any)?.id;
    if (!id) return;
    await fetch(`${this.base}/transactions/${id}/refund`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: payment.amountXof }),
    });
  }
}
