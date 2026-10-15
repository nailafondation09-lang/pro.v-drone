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
    parseWebhook(headers: Record<string, string | string[] | undefined>, body: any, rawBody?: Buffer): Promise<WebhookResult>;
    refund(payment: Payment): Promise<void>;
}
export declare class MockProvider implements PaymentProvider {
    private cfg;
    readonly name = "mock";
    constructor(cfg: ConfigService);
    initiate(_o: Order, payment: Payment): Promise<InitiateResult>;
    static sign(secret: string, body: unknown): string;
    parseWebhook(headers: Record<string, any>, body: any): Promise<WebhookResult>;
    refund(): Promise<void>;
}
export declare class FlutterwaveProvider implements PaymentProvider {
    private cfg;
    readonly name = "flutterwave";
    private base;
    constructor(cfg: ConfigService);
    private get key();
    initiate(order: Order, payment: Payment, email: string): Promise<InitiateResult>;
    parseWebhook(headers: Record<string, any>, body: any): Promise<WebhookResult>;
    refund(payment: Payment): Promise<void>;
}
