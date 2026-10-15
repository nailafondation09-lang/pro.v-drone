import { type AuthUser } from '../common/decorators.js';
import { CreateOrderDto, OrdersService } from './orders.service.js';
export declare class OrdersController {
    private orders;
    constructor(orders: OrdersService);
    create(u: AuthUser, dto: CreateOrderDto): Promise<import("../entities/entities.js").Order>;
    mine(u: AuthUser): Promise<import("../entities/entities.js").Order[]>;
    one(u: AuthUser, id: string): Promise<{
        mission: import("../entities/entities.js").Mission | null;
        id: string;
        customer: import("../entities/entities.js").User;
        customerId: string;
        merchant: import("../entities/entities.js").Merchant;
        merchantId: string;
        status: import("../common/enums.js").OrderStatus;
        totalXof: number;
        totalWeightG: number;
        deliveryLat: number;
        deliveryLng: number;
        deliveryAddress: string;
        items: import("../entities/entities.js").OrderItem[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    merchantOrders(u: AuthUser): Promise<import("../entities/entities.js").Order[]>;
    accept(u: AuthUser, id: string): Promise<{
        order: import("../entities/entities.js").Order;
        mission: import("../entities/entities.js").Mission;
    }>;
}
