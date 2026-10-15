import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Order, Payment, User } from '../entities/entities.js';
import { OrdersService } from '../orders/orders.service.js';
export declare class PaymentsService {
    private payments;
    private orders;
    private users;
    private ordersSvc;
    private cfg;
    private provider;
    constructor(payments: Repository<Payment>, orders: Repository<Order>, users: Repository<User>, ordersSvc: OrdersService, cfg: ConfigService);
    get providerName(): string;
    initiate(customerId: string, orderId: string): Promise<{
        paymentId: string;
        paymentUrl: string;
    }>;
    handleWebhook(headers: Record<string, any>, body: any): Promise<{
        ok: boolean;
        duplicate: boolean;
    } | {
        ok: boolean;
        duplicate?: undefined;
    }>;
    confirmMock(customerId: string, providerRef: string): Promise<{
        ok: boolean;
        duplicate: boolean;
    } | {
        ok: boolean;
        duplicate?: undefined;
    }>;
    refundOrder(orderId: string): Promise<void>;
}
