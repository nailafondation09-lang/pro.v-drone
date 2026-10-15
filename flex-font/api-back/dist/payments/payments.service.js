var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { OrderStatus, PaymentStatus } from '../common/enums.js';
import { Order, Payment, User } from '../entities/entities.js';
import { OrdersService } from '../orders/orders.service.js';
import { FlutterwaveProvider, MockProvider } from './providers.js';
let PaymentsService = class PaymentsService {
    payments;
    orders;
    users;
    ordersSvc;
    cfg;
    provider;
    constructor(payments, orders, users, ordersSvc, cfg) {
        this.payments = payments;
        this.orders = orders;
        this.users = users;
        this.ordersSvc = ordersSvc;
        this.cfg = cfg;
        this.provider = cfg.get('PAYMENT_PROVIDER', 'mock') === 'flutterwave' ? new FlutterwaveProvider(cfg) : new MockProvider(cfg);
    }
    get providerName() {
        return this.provider.name;
    }
    async initiate(customerId, orderId) {
        const order = await this.orders.findOne({ where: { id: orderId, customerId } });
        if (!order)
            throw new NotFoundException();
        if (order.status !== OrderStatus.PENDING_PAYMENT)
            throw new ConflictException('Commande déjà payée ou clôturée');
        const user = await this.users.findOneOrFail({ where: { id: customerId } });
        const payment = await this.payments.save(this.payments.create({
            orderId,
            provider: this.provider.name,
            providerRef: `ds_${randomUUID()}`,
            amountXof: order.totalXof,
        }));
        const { paymentUrl } = await this.provider.initiate(order, payment, user.email);
        return { paymentId: payment.id, paymentUrl };
    }
    async handleWebhook(headers, body) {
        let result;
        try {
            result = await this.provider.parseWebhook(headers, body);
        }
        catch {
            throw new BadRequestException('Webhook invalide');
        }
        const payment = await this.payments.findOne({ where: { providerRef: result.providerRef } });
        if (!payment)
            throw new NotFoundException();
        if (payment.status !== PaymentStatus.PENDING)
            return { ok: true, duplicate: true };
        payment.status = result.success ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
        payment.rawPayload = result.raw;
        await this.payments.save(payment);
        if (result.success)
            await this.ordersSvc.markPaid(payment.orderId);
        return { ok: true };
    }
    async confirmMock(customerId, providerRef) {
        if (this.provider.name !== 'mock')
            throw new BadRequestException();
        const payment = await this.payments.findOne({ where: { providerRef } });
        if (!payment)
            throw new NotFoundException();
        const order = await this.orders.findOne({ where: { id: payment.orderId, customerId } });
        if (!order)
            throw new NotFoundException();
        const body = { ref: providerRef, status: 'successful' };
        const sig = MockProvider.sign(this.cfg.getOrThrow('MOCK_WEBHOOK_SECRET'), body);
        return this.handleWebhook({ 'x-mock-signature': sig }, body);
    }
    async refundOrder(orderId) {
        const payment = await this.payments.findOne({ where: { orderId, status: PaymentStatus.SUCCESS } });
        if (!payment)
            return;
        await this.provider.refund(payment);
        payment.status = PaymentStatus.REFUNDED;
        await this.payments.save(payment);
        await this.ordersSvc.setStatus(orderId, OrderStatus.REFUNDED);
    }
};
PaymentsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Payment)),
    __param(1, InjectRepository(Order)),
    __param(2, InjectRepository(User)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        OrdersService,
        ConfigService])
], PaymentsService);
export { PaymentsService };
//# sourceMappingURL=payments.service.js.map