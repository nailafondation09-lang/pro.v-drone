import { Repository } from 'typeorm';
import { OrderStatus } from '../common/enums.js';
import { Merchant, Order, OrderItem, Product } from '../entities/entities.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { MissionsService } from '../missions/missions.service.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';
import { ZonesService } from '../zones/zones.service.js';
declare class OrderItemDto {
    productId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    merchantId: string;
    items: OrderItemDto[];
    deliveryLat: number;
    deliveryLng: number;
    deliveryAddress?: string;
}
export declare class OrdersService {
    private orders;
    private products;
    private merchants;
    private merchantsSvc;
    private missions;
    private zones;
    private gateway;
    constructor(orders: Repository<Order>, products: Repository<Product>, merchants: Repository<Merchant>, merchantsSvc: MerchantsService, missions: MissionsService, zones: ZonesService, gateway: TrackingGateway);
    create(customerId: string, dto: CreateOrderDto): Promise<Order>;
    mine(customerId: string): Promise<Order[]>;
    getForCustomer(customerId: string, id: string): Promise<{
        mission: import("../entities/entities.js").Mission | null;
        id: string;
        customer: import("../entities/entities.js").User;
        customerId: string;
        merchant: Merchant;
        merchantId: string;
        status: OrderStatus;
        totalXof: number;
        totalWeightG: number;
        deliveryLat: number;
        deliveryLng: number;
        deliveryAddress: string;
        items: OrderItem[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    forMerchant(userId: string): Promise<Order[]>;
    markPaid(orderId: string): Promise<Order>;
    accept(userId: string, orderId: string): Promise<{
        order: Order;
        mission: import("../entities/entities.js").Mission;
    }>;
    reject(userId: string, orderId: string, onRefund: (orderId: string) => Promise<void>): Promise<Order>;
    setStatus(orderId: string, status: OrderStatus): Promise<void>;
    private ownedOrder;
}
export {};
