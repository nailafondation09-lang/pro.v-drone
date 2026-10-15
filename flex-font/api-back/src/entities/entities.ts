import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  DroneStatus,
  InterceptionAction,
  MerchantStatus,
  MissionStatus,
  OrderStatus,
  PaymentStatus,
  Role,
  ZoneType,
} from '../common/enums.js';
import type { LatLng, Waypoint } from '../common/geo.js';

@Entity('admin_groups')
export class AdminGroup {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) name: string;
  @Column('text', { array: true, default: [] }) permissions: string[];
  @OneToMany(() => User, (u) => u.adminGroup) members: User[];
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column() email: string;
  @Column({ select: false }) passwordHash: string;
  @Column() fullName: string;
  @Column({ nullable: true }) phone: string;
  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER }) role: Role;
  @ManyToOne(() => AdminGroup, (g) => g.members, { nullable: true, eager: true }) adminGroup: AdminGroup | null;
  @Column({ default: true }) isActive: boolean;
  @Column({ type: 'varchar', nullable: true, select: false }) refreshTokenHash: string | null;
  @CreateDateColumn() createdAt: Date;
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User, { eager: true }) owner: User;
  @Column() ownerId: string;
  @Column() businessName: string;
  @Column({ nullable: true }) address: string;
  @Column('double precision') lat: number;
  @Column('double precision') lng: number;
  @Column({ type: 'enum', enum: MerchantStatus, default: MerchantStatus.PENDING }) status: MerchantStatus;
  @CreateDateColumn() createdAt: Date;
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Merchant) merchant: Merchant;
  @Column() merchantId: string;
  @Column() name: string;
  @Column('int') priceXof: number;
  @Column('int', { default: 500 }) weightG: number;
  @Column({ default: true }) available: boolean;
}

@Entity('drones')
export class Drone {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Merchant) merchant: Merchant;
  @Index() @Column() merchantId: string;
  @Column() name: string;
  @Column({ unique: true }) serial: string;
  @Column({ nullable: true }) model: string;
  @Column('int', { default: 2000 }) maxPayloadG: number;
  @Column('int', { default: 10000 }) maxRangeM: number;
  @Column({ type: 'enum', enum: DroneStatus, default: DroneStatus.IDLE }) status: DroneStatus;
  @Column('double precision', { default: 100 }) batteryPct: number;
  @Column('double precision', { default: 0 }) lat: number;
  @Column('double precision', { default: 0 }) lng: number;
  @Column('double precision', { default: 0 }) altitudeM: number;
  @Column('double precision', { default: 0 }) speedMs: number;
  @Column('double precision', { default: 0 }) headingDeg: number;
  @Column({ type: 'timestamptz', nullable: true }) lastSeenAt: Date | null;
  @CreateDateColumn() createdAt: Date;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User) customer: User;
  @Index() @Column() customerId: string;
  @ManyToOne(() => Merchant) merchant: Merchant;
  @Index() @Column() merchantId: string;
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT }) status: OrderStatus;
  @Column('int') totalXof: number;
  @Column('int', { default: 0 }) totalWeightG: number;
  @Column('double precision') deliveryLat: number;
  @Column('double precision') deliveryLng: number;
  @Column({ nullable: true }) deliveryAddress: string;
  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true, eager: true }) items: OrderItem[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' }) order: Order;
  @Column() orderId: string;
  @ManyToOne(() => Product, { eager: true }) product: Product;
  @Column() productId: string;
  @Column('int') quantity: number;
  @Column('int') unitPriceXof: number;
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Order) order: Order;
  @Index() @Column() orderId: string;
  @Column() provider: string;
  @Index({ unique: true }) @Column() providerRef: string;
  @Column('int') amountXof: number;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING }) status: PaymentStatus;
  @Column({ type: 'jsonb', nullable: true }) rawPayload: unknown;
  @CreateDateColumn() createdAt: Date;
}

@Entity('missions')
export class Mission {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Order) order: Order;
  @Index() @Column() orderId: string;
  @ManyToOne(() => Drone) drone: Drone;
  @Index() @Column() droneId: string;
  @Column({ type: 'enum', enum: MissionStatus, default: MissionStatus.PLANNED }) status: MissionStatus;
  @Column({ type: 'jsonb' }) route: Waypoint[];
  @Column('double precision', { default: 0 }) distanceM: number;
  @Column({ type: 'timestamptz', nullable: true }) startedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) etaAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
}

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ type: 'enum', enum: ZoneType }) type: ZoneType;
  @Column({ type: 'jsonb' }) polygon: LatLng[];
  @Column('double precision', { default: 0 }) minAltM: number;
  @Column('double precision', { default: 500 }) maxAltM: number;
  @Column({ default: true }) active: boolean;
  @Column({ type: 'varchar', nullable: true }) createdById: string | null;
  @CreateDateColumn() createdAt: Date;
}

@Entity('telemetry_points')
@Index(['droneId', 'at'])
export class TelemetryPoint {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() droneId: string;
  @Column({ type: 'varchar', nullable: true }) missionId: string | null;
  @Column('double precision') lat: number;
  @Column('double precision') lng: number;
  @Column('double precision') altitudeM: number;
  @Column('double precision') speedMs: number;
  @Column('double precision') batteryPct: number;
  @CreateDateColumn({ type: 'timestamptz' }) at: Date;
}

@Entity('interceptions')
export class Interception {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() droneId: string;
  @Column({ type: 'varchar', nullable: true }) missionId: string | null;
  @Column() byUserId: string;
  @Column({ type: 'enum', enum: InterceptionAction }) action: InterceptionAction;
  @Column({ nullable: true }) reason: string;
  @CreateDateColumn() at: Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', nullable: true }) userId: string | null;
  @Column() action: string;
  @Column({ nullable: true }) entity: string;
  @Column({ nullable: true }) entityId: string;
  @Column({ type: 'jsonb', nullable: true }) meta: unknown;
  @CreateDateColumn() at: Date;
}

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
