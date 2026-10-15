import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { OrderStatus, PaymentStatus } from '../common/enums.js';
import { Order, Payment, User } from '../entities/entities.js';
import { OrdersService } from '../orders/orders.service.js';
import { FlutterwaveProvider, MockProvider, PaymentProvider } from './providers.js';

@Injectable()
export class PaymentsService {
  private provider: PaymentProvider;

  constructor(
    @InjectRepository(Payment) private payments: Repository<Payment>,
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(User) private users: Repository<User>,
    private ordersSvc: OrdersService,
    private cfg: ConfigService,
  ) {
    this.provider = cfg.get('PAYMENT_PROVIDER', 'mock') === 'flutterwave' ? new FlutterwaveProvider(cfg) : new MockProvider(cfg);
  }

  get providerName() {
    return this.provider.name;
  }

  async initiate(customerId: string, orderId: string) {
    const order = await this.orders.findOne({ where: { id: orderId, customerId } });
    if (!order) throw new NotFoundException();
    if (order.status !== OrderStatus.PENDING_PAYMENT) throw new ConflictException('Commande déjà payée ou clôturée');
    const user = await this.users.findOneOrFail({ where: { id: customerId } });
    const payment = await this.payments.save(
      this.payments.create({
        orderId,
        provider: this.provider.name,
        providerRef: `ds_${randomUUID()}`,
        amountXof: order.totalXof, // le montant vient TOUJOURS du serveur
      }),
    );
    const { paymentUrl } = await this.provider.initiate(order, payment, user.email);
    return { paymentId: payment.id, paymentUrl };
  }

  /** Webhook fournisseur — idempotent grâce au statut du Payment. */
  async handleWebhook(headers: Record<string, any>, body: any) {
    let result;
    try {
      result = await this.provider.parseWebhook(headers, body);
    } catch {
      throw new BadRequestException('Webhook invalide');
    }
    const payment = await this.payments.findOne({ where: { providerRef: result.providerRef } });
    if (!payment) throw new NotFoundException();
    if (payment.status !== PaymentStatus.PENDING) return { ok: true, duplicate: true };
    payment.status = result.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
    payment.rawPayload = result.raw;
    await this.payments.save(payment);
    if (result.success) await this.ordersSvc.markPaid(payment.orderId);
    return { ok: true };
  }

  /** Dev uniquement : simule le retour du fournisseur factice. */
  async confirmMock(customerId: string, providerRef: string) {
    if (this.provider.name !== 'mock') throw new BadRequestException();
    const payment = await this.payments.findOne({ where: { providerRef } });
    if (!payment) throw new NotFoundException();
    const order = await this.orders.findOne({ where: { id: payment.orderId, customerId } });
    if (!order) throw new NotFoundException();
    const body = { ref: providerRef, status: 'successful' };
    const sig = MockProvider.sign(this.cfg.getOrThrow('MOCK_WEBHOOK_SECRET'), body);
    return this.handleWebhook({ 'x-mock-signature': sig }, body);
  }

  async refundOrder(orderId: string) {
    const payment = await this.payments.findOne({ where: { orderId, status: PaymentStatus.SUCCESS } });
    if (!payment) return;
    await this.provider.refund(payment);
    payment.status = PaymentStatus.REFUNDED;
    await this.payments.save(payment);
    await this.ordersSvc.setStatus(orderId, OrderStatus.REFUNDED);
  }
}
