import { DroneStatus, InterceptionAction, MerchantStatus, MissionStatus, OrderStatus, PaymentStatus, Role, ZoneType } from '../common/enums.js';
import type { LatLng, Waypoint } from '../common/geo.js';
export declare class AdminGroup {
    id: string;
    name: string;
    permissions: string[];
    members: User[];
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    fullName: string;
    phone: string;
    role: Role;
    adminGroup: AdminGroup | null;
    isActive: boolean;
    refreshTokenHash: string | null;
    createdAt: Date;
}
export declare class Merchant {
    id: string;
    owner: User;
    ownerId: string;
    businessName: string;
    address: string;
    lat: number;
    lng: number;
    status: MerchantStatus;
    createdAt: Date;
}
export declare class Product {
    id: string;
    merchant: Merchant;
    merchantId: string;
    name: string;
    priceXof: number;
    weightG: number;
    available: boolean;
}
export declare class Drone {
    id: string;
    merchant: Merchant;
    merchantId: string;
    name: string;
    serial: string;
    model: string;
    maxPayloadG: number;
    maxRangeM: number;
    status: DroneStatus;
    batteryPct: number;
    lat: number;
    lng: number;
    altitudeM: number;
    speedMs: number;
    headingDeg: number;
    lastSeenAt: Date | null;
    createdAt: Date;
}
export declare class Order {
    id: string;
    customer: User;
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
}
export declare class OrderItem {
    id: string;
    order: Order;
    orderId: string;
    product: Product;
    productId: string;
    quantity: number;
    unitPriceXof: number;
}
export declare class Payment {
    id: string;
    order: Order;
    orderId: string;
    provider: string;
    providerRef: string;
    amountXof: number;
    status: PaymentStatus;
    rawPayload: unknown;
    createdAt: Date;
}
export declare class Mission {
    id: string;
    order: Order;
    orderId: string;
    drone: Drone;
    droneId: string;
    status: MissionStatus;
    route: Waypoint[];
    distanceM: number;
    startedAt: Date | null;
    etaAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
}
export declare class Zone {
    id: string;
    name: string;
    type: ZoneType;
    polygon: LatLng[];
    minAltM: number;
    maxAltM: number;
    active: boolean;
    createdById: string | null;
    createdAt: Date;
}
export declare class TelemetryPoint {
    id: string;
    droneId: string;
    missionId: string | null;
    lat: number;
    lng: number;
    altitudeM: number;
    speedMs: number;
    batteryPct: number;
    at: Date;
}
export declare class Interception {
    id: string;
    droneId: string;
    missionId: string | null;
    byUserId: string;
    action: InterceptionAction;
    reason: string;
    at: Date;
}
export declare class AuditLog {
    id: string;
    userId: string | null;
    action: string;
    entity: string;
    entityId: string;
    meta: unknown;
    at: Date;
}
export declare const ALL_ENTITIES: (typeof AdminGroup | typeof User | typeof Merchant | typeof Product | typeof Drone | typeof Order | typeof OrderItem | typeof Payment | typeof Mission | typeof Zone | typeof TelemetryPoint | typeof Interception | typeof AuditLog)[];
