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
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsLatitude, IsLongitude, IsOptional, IsString, IsUUID, Min, ValidateNested, } from 'class-validator';
import { MerchantStatus, OrderStatus } from '../common/enums.js';
import { Merchant, Order, OrderItem, Product } from '../entities/entities.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { MissionsService } from '../missions/missions.service.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';
import { ZonesService } from '../zones/zones.service.js';
class OrderItemDto {
    productId;
    quantity;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], OrderItemDto.prototype, "productId", void 0);
__decorate([
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], OrderItemDto.prototype, "quantity", void 0);
export class CreateOrderDto {
    merchantId;
    items;
    deliveryLat;
    deliveryLng;
    deliveryAddress;
}
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "merchantId", void 0);
__decorate([
    IsArray(),
    ArrayMinSize(1),
    ValidateNested({ each: true }),
    Type(() => OrderItemDto),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
__decorate([
    IsLatitude(),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "deliveryLat", void 0);
__decorate([
    IsLongitude(),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "deliveryLng", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "deliveryAddress", void 0);
const MAX_PAYLOAD_G = 2000;
let OrdersService = class OrdersService {
    orders;
    products;
    merchants;
    merchantsSvc;
    missions;
    zones;
    gateway;
    constructor(orders, products, merchants, merchantsSvc, missions, zones, gateway) {
        this.orders = orders;
        this.products = products;
        this.merchants = merchants;
        this.merchantsSvc = merchantsSvc;
        this.missions = missions;
        this.zones = zones;
        this.gateway = gateway;
    }
    async create(customerId, dto) {
        const merchant = await this.merchants.findOne({ where: { id: dto.merchantId } });
        if (!merchant || merchant.status !== MerchantStatus.APPROVED)
            throw new NotFoundException('Marchand introuvable');
        const products = await this.products.find({ where: { id: In(dto.items.map((i) => i.productId)), merchantId: merchant.id, available: true } });
        if (products.length !== new Set(dto.items.map((i) => i.productId)).size) {
            throw new BadRequestException('Produit invalide ou indisponible');
        }
        const byId = new Map(products.map((p) => [p.id, p]));
        const totalWeightG = dto.items.reduce((s, i) => s + byId.get(i.productId).weightG * i.quantity, 0);
        if (totalWeightG > MAX_PAYLOAD_G)
            throw new BadRequestException(`Poids maximum par livraison : ${MAX_PAYLOAD_G} g`);
        const blocked = (await this.zones.zonesAt({ lat: dto.deliveryLat, lng: dto.deliveryLng, alt: 0 })).find((z) => z.type === 'FORBIDDEN');
        if (blocked)
            throw new BadRequestException(`Livraison impossible : zone interdite (${blocked.name})`);
        const items = dto.items.map((i) => {
            const p = byId.get(i.productId);
            return Object.assign(new OrderItem(), { productId: p.id, quantity: i.quantity, unitPriceXof: p.priceXof });
        });
        const totalXof = items.reduce((s, i) => s + i.unitPriceXof * i.quantity, 0);
        return this.orders.save(this.orders.create({
            customerId,
            merchantId: merchant.id,
            totalXof,
            totalWeightG,
            deliveryLat: dto.deliveryLat,
            deliveryLng: dto.deliveryLng,
            deliveryAddress: dto.deliveryAddress,
            items,
        }));
    }
    mine(customerId) {
        return this.orders.find({ where: { customerId }, order: { createdAt: 'DESC' } });
    }
    async getForCustomer(customerId, id) {
        const order = await this.orders.findOne({ where: { id, customerId } });
        if (!order)
            throw new NotFoundException();
        const mission = await this.missions.forOrder(id);
        return { ...order, mission };
    }
    async forMerchant(userId) {
        const m = await this.merchantsSvc.forOwner(userId, false);
        return this.orders.find({ where: { merchantId: m.id }, order: { createdAt: 'DESC' }, take: 200 });
    }
    async markPaid(orderId) {
        const order = await this.orders.findOneOrFail({ where: { id: orderId } });
        if (order.status !== OrderStatus.PENDING_PAYMENT)
            return order;
        order.status = OrderStatus.AWAITING_MERCHANT;
        await this.orders.save(order);
        this.gateway.emitMerchant(order.merchantId, 'order.new', { orderId: order.id, totalXof: order.totalXof }, order.id);
        return order;
    }
    async accept(userId, orderId) {
        const merchant = await this.merchantsSvc.forOwner(userId);
        const order = await this.ownedOrder(merchant.id, orderId);
        if (order.status !== OrderStatus.AWAITING_MERCHANT)
            throw new ConflictException('Commande non acceptable dans cet état');
        const mission = await this.missions.createAndStart(order, merchant);
        order.status = OrderStatus.IN_FLIGHT;
        await this.orders.save(order);
        this.gateway.emitMerchant(merchant.id, 'order.updated', { orderId, status: order.status }, orderId);
        return { order, mission };
    }
    async reject(userId, orderId, onRefund) {
        const merchant = await this.merchantsSvc.forOwner(userId);
        const order = await this.ownedOrder(merchant.id, orderId);
        if (order.status !== OrderStatus.AWAITING_MERCHANT)
            throw new ConflictException('Commande non refusable dans cet état');
        order.status = OrderStatus.REJECTED;
        await this.orders.save(order);
        await onRefund(orderId);
        this.gateway.emitMerchant(merchant.id, 'order.updated', { orderId, status: OrderStatus.REFUNDED }, orderId);
        return order;
    }
    async setStatus(orderId, status) {
        await this.orders.update(orderId, { status });
    }
    async ownedOrder(merchantId, id) {
        const order = await this.orders.findOne({ where: { id } });
        if (!order)
            throw new NotFoundException();
        if (order.merchantId !== merchantId)
            throw new ForbiddenException();
        return order;
    }
};
OrdersService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Order)),
    __param(1, InjectRepository(Product)),
    __param(2, InjectRepository(Merchant)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        MerchantsService,
        MissionsService,
        ZonesService,
        TrackingGateway])
], OrdersService);
export { OrdersService };
//# sourceMappingURL=orders.service.js.map