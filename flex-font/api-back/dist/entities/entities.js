var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn, } from 'typeorm';
import { DroneStatus, InterceptionAction, MerchantStatus, MissionStatus, OrderStatus, PaymentStatus, Role, ZoneType, } from '../common/enums.js';
let AdminGroup = class AdminGroup {
    id;
    name;
    permissions;
    members;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], AdminGroup.prototype, "id", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], AdminGroup.prototype, "name", void 0);
__decorate([
    Column('text', { array: true, default: [] }),
    __metadata("design:type", Array)
], AdminGroup.prototype, "permissions", void 0);
__decorate([
    OneToMany(() => User, (u) => u.adminGroup),
    __metadata("design:type", Array)
], AdminGroup.prototype, "members", void 0);
AdminGroup = __decorate([
    Entity('admin_groups')
], AdminGroup);
export { AdminGroup };
let User = class User {
    id;
    email;
    passwordHash;
    fullName;
    phone;
    role;
    adminGroup;
    isActive;
    refreshTokenHash;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column({ select: false }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    Column({ type: 'enum', enum: Role, default: Role.CUSTOMER }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    ManyToOne(() => AdminGroup, (g) => g.members, { nullable: true, eager: true }),
    __metadata("design:type", Object)
], User.prototype, "adminGroup", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true, select: false }),
    __metadata("design:type", Object)
], User.prototype, "refreshTokenHash", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
User = __decorate([
    Entity('users')
], User);
export { User };
let Merchant = class Merchant {
    id;
    owner;
    ownerId;
    businessName;
    address;
    lat;
    lng;
    status;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Merchant.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User, { eager: true }),
    __metadata("design:type", User)
], Merchant.prototype, "owner", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Merchant.prototype, "ownerId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Merchant.prototype, "businessName", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Merchant.prototype, "address", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], Merchant.prototype, "lat", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], Merchant.prototype, "lng", void 0);
__decorate([
    Column({ type: 'enum', enum: MerchantStatus, default: MerchantStatus.PENDING }),
    __metadata("design:type", String)
], Merchant.prototype, "status", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Merchant.prototype, "createdAt", void 0);
Merchant = __decorate([
    Entity('merchants')
], Merchant);
export { Merchant };
let Product = class Product {
    id;
    merchant;
    merchantId;
    name;
    priceXof;
    weightG;
    available;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Product.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Merchant),
    __metadata("design:type", Merchant)
], Product.prototype, "merchant", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Product.prototype, "merchantId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], Product.prototype, "priceXof", void 0);
__decorate([
    Column('int', { default: 500 }),
    __metadata("design:type", Number)
], Product.prototype, "weightG", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "available", void 0);
Product = __decorate([
    Entity('products')
], Product);
export { Product };
let Drone = class Drone {
    id;
    merchant;
    merchantId;
    name;
    serial;
    model;
    maxPayloadG;
    maxRangeM;
    status;
    batteryPct;
    lat;
    lng;
    altitudeM;
    speedMs;
    headingDeg;
    lastSeenAt;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Drone.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Merchant),
    __metadata("design:type", Merchant)
], Drone.prototype, "merchant", void 0);
__decorate([
    Index(),
    Column(),
    __metadata("design:type", String)
], Drone.prototype, "merchantId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Drone.prototype, "name", void 0);
__decorate([
    Column({ unique: true }),
    __metadata("design:type", String)
], Drone.prototype, "serial", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Drone.prototype, "model", void 0);
__decorate([
    Column('int', { default: 2000 }),
    __metadata("design:type", Number)
], Drone.prototype, "maxPayloadG", void 0);
__decorate([
    Column('int', { default: 10000 }),
    __metadata("design:type", Number)
], Drone.prototype, "maxRangeM", void 0);
__decorate([
    Column({ type: 'enum', enum: DroneStatus, default: DroneStatus.IDLE }),
    __metadata("design:type", String)
], Drone.prototype, "status", void 0);
__decorate([
    Column('double precision', { default: 100 }),
    __metadata("design:type", Number)
], Drone.prototype, "batteryPct", void 0);
__decorate([
    Column('double precision', { default: 0 }),
    __metadata("design:type", Number)
], Drone.prototype, "lat", void 0);
__decorate([
    Column('double precision', { default: 0 }),
    __metadata("design:type", Number)
], Drone.prototype, "lng", void 0);
__decorate([
    Column('double precision', { default: 0 }),
    __metadata("design:type", Number)
], Drone.prototype, "altitudeM", void 0);
__decorate([
    Column('double precision', { default: 0 }),
    __metadata("design:type", Number)
], Drone.prototype, "speedMs", void 0);
__decorate([
    Column('double precision', { default: 0 }),
    __metadata("design:type", Number)
], Drone.prototype, "headingDeg", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Drone.prototype, "lastSeenAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Drone.prototype, "createdAt", void 0);
Drone = __decorate([
    Entity('drones')
], Drone);
export { Drone };
let Order = class Order {
    id;
    customer;
    customerId;
    merchant;
    merchantId;
    status;
    totalXof;
    totalWeightG;
    deliveryLat;
    deliveryLng;
    deliveryAddress;
    items;
    createdAt;
    updatedAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Order.prototype, "id", void 0);
__decorate([
    ManyToOne(() => User),
    __metadata("design:type", User)
], Order.prototype, "customer", void 0);
__decorate([
    Index(),
    Column(),
    __metadata("design:type", String)
], Order.prototype, "customerId", void 0);
__decorate([
    ManyToOne(() => Merchant),
    __metadata("design:type", Merchant)
], Order.prototype, "merchant", void 0);
__decorate([
    Index(),
    Column(),
    __metadata("design:type", String)
], Order.prototype, "merchantId", void 0);
__decorate([
    Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT }),
    __metadata("design:type", String)
], Order.prototype, "status", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], Order.prototype, "totalXof", void 0);
__decorate([
    Column('int', { default: 0 }),
    __metadata("design:type", Number)
], Order.prototype, "totalWeightG", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], Order.prototype, "deliveryLat", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], Order.prototype, "deliveryLng", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Order.prototype, "deliveryAddress", void 0);
__decorate([
    OneToMany(() => OrderItem, (i) => i.order, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], Order.prototype, "items", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Order.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Order.prototype, "updatedAt", void 0);
Order = __decorate([
    Entity('orders')
], Order);
export { Order };
let OrderItem = class OrderItem {
    id;
    order;
    orderId;
    product;
    productId;
    quantity;
    unitPriceXof;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], OrderItem.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' }),
    __metadata("design:type", Order)
], OrderItem.prototype, "order", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], OrderItem.prototype, "orderId", void 0);
__decorate([
    ManyToOne(() => Product, { eager: true }),
    __metadata("design:type", Product)
], OrderItem.prototype, "product", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], OrderItem.prototype, "productId", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], OrderItem.prototype, "quantity", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], OrderItem.prototype, "unitPriceXof", void 0);
OrderItem = __decorate([
    Entity('order_items')
], OrderItem);
export { OrderItem };
let Payment = class Payment {
    id;
    order;
    orderId;
    provider;
    providerRef;
    amountXof;
    status;
    rawPayload;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Payment.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Order),
    __metadata("design:type", Order)
], Payment.prototype, "order", void 0);
__decorate([
    Index(),
    Column(),
    __metadata("design:type", String)
], Payment.prototype, "orderId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Payment.prototype, "provider", void 0);
__decorate([
    Index({ unique: true }),
    Column(),
    __metadata("design:type", String)
], Payment.prototype, "providerRef", void 0);
__decorate([
    Column('int'),
    __metadata("design:type", Number)
], Payment.prototype, "amountXof", void 0);
__decorate([
    Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "rawPayload", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Payment.prototype, "createdAt", void 0);
Payment = __decorate([
    Entity('payments')
], Payment);
export { Payment };
let Mission = class Mission {
    id;
    order;
    orderId;
    drone;
    droneId;
    status;
    route;
    distanceM;
    startedAt;
    etaAt;
    completedAt;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Mission.prototype, "id", void 0);
__decorate([
    ManyToOne(() => Order),
    __metadata("design:type", Order)
], Mission.prototype, "order", void 0);
__decorate([
    Index(),
    Column(),
    __metadata("design:type", String)
], Mission.prototype, "orderId", void 0);
__decorate([
    ManyToOne(() => Drone),
    __metadata("design:type", Drone)
], Mission.prototype, "drone", void 0);
__decorate([
    Index(),
    Column(),
    __metadata("design:type", String)
], Mission.prototype, "droneId", void 0);
__decorate([
    Column({ type: 'enum', enum: MissionStatus, default: MissionStatus.PLANNED }),
    __metadata("design:type", String)
], Mission.prototype, "status", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], Mission.prototype, "route", void 0);
__decorate([
    Column('double precision', { default: 0 }),
    __metadata("design:type", Number)
], Mission.prototype, "distanceM", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Mission.prototype, "startedAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Mission.prototype, "etaAt", void 0);
__decorate([
    Column({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], Mission.prototype, "completedAt", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Mission.prototype, "createdAt", void 0);
Mission = __decorate([
    Entity('missions')
], Mission);
export { Mission };
let Zone = class Zone {
    id;
    name;
    type;
    polygon;
    minAltM;
    maxAltM;
    active;
    createdById;
    createdAt;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Zone.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Zone.prototype, "name", void 0);
__decorate([
    Column({ type: 'enum', enum: ZoneType }),
    __metadata("design:type", String)
], Zone.prototype, "type", void 0);
__decorate([
    Column({ type: 'jsonb' }),
    __metadata("design:type", Array)
], Zone.prototype, "polygon", void 0);
__decorate([
    Column('double precision', { default: 0 }),
    __metadata("design:type", Number)
], Zone.prototype, "minAltM", void 0);
__decorate([
    Column('double precision', { default: 500 }),
    __metadata("design:type", Number)
], Zone.prototype, "maxAltM", void 0);
__decorate([
    Column({ default: true }),
    __metadata("design:type", Boolean)
], Zone.prototype, "active", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Zone.prototype, "createdById", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Zone.prototype, "createdAt", void 0);
Zone = __decorate([
    Entity('zones')
], Zone);
export { Zone };
let TelemetryPoint = class TelemetryPoint {
    id;
    droneId;
    missionId;
    lat;
    lng;
    altitudeM;
    speedMs;
    batteryPct;
    at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], TelemetryPoint.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], TelemetryPoint.prototype, "droneId", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], TelemetryPoint.prototype, "missionId", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], TelemetryPoint.prototype, "lat", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], TelemetryPoint.prototype, "lng", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], TelemetryPoint.prototype, "altitudeM", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], TelemetryPoint.prototype, "speedMs", void 0);
__decorate([
    Column('double precision'),
    __metadata("design:type", Number)
], TelemetryPoint.prototype, "batteryPct", void 0);
__decorate([
    CreateDateColumn({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TelemetryPoint.prototype, "at", void 0);
TelemetryPoint = __decorate([
    Entity('telemetry_points'),
    Index(['droneId', 'at'])
], TelemetryPoint);
export { TelemetryPoint };
let Interception = class Interception {
    id;
    droneId;
    missionId;
    byUserId;
    action;
    reason;
    at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Interception.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Interception.prototype, "droneId", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Interception.prototype, "missionId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], Interception.prototype, "byUserId", void 0);
__decorate([
    Column({ type: 'enum', enum: InterceptionAction }),
    __metadata("design:type", String)
], Interception.prototype, "action", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], Interception.prototype, "reason", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Interception.prototype, "at", void 0);
Interception = __decorate([
    Entity('interceptions')
], Interception);
export { Interception };
let AuditLog = class AuditLog {
    id;
    userId;
    action;
    entity;
    entityId;
    meta;
    at;
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], AuditLog.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "userId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], AuditLog.prototype, "action", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entity", void 0);
__decorate([
    Column({ nullable: true }),
    __metadata("design:type", String)
], AuditLog.prototype, "entityId", void 0);
__decorate([
    Column({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], AuditLog.prototype, "meta", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], AuditLog.prototype, "at", void 0);
AuditLog = __decorate([
    Entity('audit_logs')
], AuditLog);
export { AuditLog };
export const ALL_ENTITIES = [
    AdminGroup,
    User,
    Merchant,
    Product,
    Drone,
    Order,
    OrderItem,
    Payment,
    Mission,
    Zone,
    TelemetryPoint,
    Interception,
    AuditLog,
];
//# sourceMappingURL=entities.js.map