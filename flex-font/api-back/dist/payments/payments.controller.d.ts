import { type AuthUser } from '../common/decorators.js';
import { OrdersService } from '../orders/orders.service.js';
import { PaymentsService } from './payments.service.js';
export declare class PaymentsController {
    private payments;
    private orders;
    constructor(payments: PaymentsService, orders: OrdersService);
    initiate(u: AuthUser, id: string): Promise<{
        paymentId: string;
        paymentUrl: string;
    }>;
    webhook(headers: Record<string, string>, body: unknown): Promise<{
        ok: boolean;
        duplicate: boolean;
    } | {
        ok: boolean;
        duplicate?: undefined;
    }>;
    confirmMock(u: AuthUser, ref: string): Promise<{
        ok: boolean;
        duplicate: boolean;
    } | {
        ok: boolean;
        duplicate?: undefined;
    }>;
    reject(u: AuthUser, id: string): Promise<import("../entities/entities.js").Order>;
}
