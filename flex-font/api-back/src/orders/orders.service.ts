import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { MerchantStatus, OrderStatus } from '../common/enums.js';
import { Merchant, Order, OrderItem, Product } from '../entities/entities.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { MissionsService } from '../missions/missions.service.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';
import { ZonesService } from '../zones/zones.service.js';

class OrderItemDto {
  @IsUUID() productId: string;
  @IsInt() @Min(1) quantity: number;
}

export class CreateOrderDto {
  @IsUUID() merchantId: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OrderItemDto) items: OrderItemDto[];
  @IsLatitude() deliveryLat: number;
  @IsLongitude() deliveryLng: number;
  @IsOptional() @IsString() deliveryAddress?: string;
}

const MAX_PAYLOAD_G = 2000;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(Product) private products: Repository<Product>,
    @InjectRepository(Merchant) private merchants: Repository<Merchant>,
    private merchantsSvc: MerchantsService,
    private missions: MissionsService,
    private zones: ZonesService,
    private gateway: TrackingGateway,
  ) {}

  async create(customerId: string, dto: CreateOrderDto) {
    const merchant = await this.merchants.findOne({ where: { id: dto.merchantId } });
    if (!merchant || merchant.status !== MerchantStatus.APPROVED) throw new NotFoundException('Marchand introuvable');

    const products = await this.products.find({ where: { id: In(dto.items.map((i) => i.productId)), merchantId: merchant.id, available: true } });
    if (products.length !== new Set(dto.items.map((i) => i.productId)).size) {
      throw new BadRequestException('Produit invalide ou indisponible');
    }
    const byId = new Map(products.map((p) => [p.id, p]));
    const totalWeightG = dto.items.reduce((s, i) => s + byId.get(i.productId)!.weightG * i.quantity, 0);
    if (totalWeightG > MAX_PAYLOAD_G) throw new BadRequestException(`Poids maximum par livraison : ${MAX_PAYLOAD_G} g`);

    // Le point de livraison ne peut pas être dans une zone interdite.
    const blocked = (await this.zones.zonesAt({ lat: dto.deliveryLat, lng: dto.deliveryLng, alt: 0 })).find((z) => z.type === 'FORBIDDEN');
    if (blocked) throw new BadRequestException(`Livraison impossible : zone interdite (${blocked.name})`);

    const items = dto.items.map((i) => {
      const p = byId.get(i.productId)!;
      return Object.assign(new OrderItem(), { productId: p.id, quantity: i.quantity, unitPriceXof: p.priceXof });
    });
    const totalXof = items.reduce((s, i) => s + i.unitPriceXof * i.quantity, 0);
    return this.orders.save(
      this.orders.create({
        customerId,
        merchantId: merchant.id,
        totalXof,
        totalWeightG,
        deliveryLat: dto.deliveryLat,
        deliveryLng: dto.deliveryLng,
        deliveryAddress: dto.deliveryAddress,
        items,
      }),
    );
  }

  mine(customerId: string) {
    return this.orders.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  async getForCustomer(customerId: string, id: string) {
    const order = await this.orders.findOne({ where: { id, customerId } });
    if (!order) throw new NotFoundException();
    const mission = await this.missions.forOrder(id);
    return { ...order, mission };
  }

  async forMerchant(userId: string) {
    const m = await this.merchantsSvc.forOwner(userId, false);
    return this.orders.find({ where: { merchantId: m.id }, order: { createdAt: 'DESC' }, take: 200 });
  }

  /** Appelé par le module paiement une fois le paiement confirmé. */
  async markPaid(orderId: string) {
    const order = await this.orders.findOneOrFail({ where: { id: orderId } });
    if (order.status !== OrderStatus.PENDING_PAYMENT) return order; // idempotent
    order.status = OrderStatus.AWAITING_MERCHANT;
    await this.orders.save(order);
    this.gateway.emitMerchant(order.merchantId, 'order.new', { orderId: order.id, totalXof: order.totalXof }, order.id);
    return order;
  }

  /** Le marchand accepte : on réserve un drone, planifie la route et démarre la mission. */
  async accept(userId: string, orderId: string) {
    const merchant = await this.merchantsSvc.forOwner(userId);
    const order = await this.ownedOrder(merchant.id, orderId);
    if (order.status !== OrderStatus.AWAITING_MERCHANT) throw new ConflictException('Commande non acceptable dans cet état');
    const mission = await this.missions.createAndStart(order, merchant); // lève si aucun drone adapté
    order.status = OrderStatus.IN_FLIGHT;
    await this.orders.save(order);
    this.gateway.emitMerchant(merchant.id, 'order.updated', { orderId, status: order.status }, orderId);
    return { order, mission };
  }

  async reject(userId: string, orderId: string, onRefund: (orderId: string) => Promise<void>) {
    const merchant = await this.merchantsSvc.forOwner(userId);
    const order = await this.ownedOrder(merchant.id, orderId);
    if (order.status !== OrderStatus.AWAITING_MERCHANT) throw new ConflictException('Commande non refusable dans cet état');
    order.status = OrderStatus.REJECTED;
    await this.orders.save(order);
    await onRefund(orderId);
    this.gateway.emitMerchant(merchant.id, 'order.updated', { orderId, status: OrderStatus.REFUNDED }, orderId);
    return order;
  }

  async setStatus(orderId: string, status: OrderStatus) {
    await this.orders.update(orderId, { status });
  }

  private async ownedOrder(merchantId: string, id: string) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException();
    if (order.merchantId !== merchantId) throw new ForbiddenException();
    return order;
  }
}
