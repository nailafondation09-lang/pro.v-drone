import { createHmac, timingSafeEqual } from 'node:crypto';
export class MockProvider {
    cfg;
    name = 'mock';
    constructor(cfg) {
        this.cfg = cfg;
    }
    async initiate(_o, payment) {
        return { paymentUrl: `${this.cfg.get('FRONTEND_URL', 'http://localhost:4200')}/pay/mock?ref=${payment.providerRef}` };
    }
    static sign(secret, body) {
        return createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
    }
    async parseWebhook(headers, body) {
        const secret = this.cfg.getOrThrow('MOCK_WEBHOOK_SECRET');
        const given = Buffer.from(String(headers['x-mock-signature'] ?? ''));
        const expected = Buffer.from(MockProvider.sign(secret, body));
        if (given.length !== expected.length || !timingSafeEqual(given, expected))
            throw new Error('Signature invalide');
        return { providerRef: body.ref, success: body.status === 'successful', raw: body };
    }
    async refund() {
    }
}
export class FlutterwaveProvider {
    cfg;
    name = 'flutterwave';
    base = 'https://api.flutterwave.com/v3';
    constructor(cfg) {
        this.cfg = cfg;
    }
    get key() {
        return this.cfg.getOrThrow('FLW_SECRET_KEY');
    }
    async initiate(order, payment, email) {
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
        const json = await res.json();
        if (!res.ok || json.status !== 'success')
            throw new Error('Initialisation du paiement échouée');
        return { paymentUrl: json.data.link };
    }
    async parseWebhook(headers, body) {
        if (headers['verif-hash'] !== this.cfg.getOrThrow('FLW_WEBHOOK_HASH'))
            throw new Error('Signature invalide');
        const id = body?.data?.id;
        const res = await fetch(`${this.base}/transactions/${id}/verify`, { headers: { Authorization: `Bearer ${this.key}` } });
        const json = await res.json();
        const ok = json?.data?.status === 'successful' && json.data.currency === 'XOF';
        return { providerRef: json?.data?.tx_ref, success: ok, raw: json?.data };
    }
    async refund(payment) {
        const id = payment.rawPayload?.id;
        if (!id)
            return;
        await fetch(`${this.base}/transactions/${id}/refund`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: payment.amountXof }),
        });
    }
}
//# sourceMappingURL=providers.js.map