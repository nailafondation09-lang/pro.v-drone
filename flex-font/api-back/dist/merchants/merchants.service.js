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
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Merchant, Product } from '../entities/entities.js';
import { MerchantStatus } from '../common/enums.js';
export class ProductDto {
    name;
    priceXof;
    weightG;
    available;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], ProductDto.prototype, "name", void 0);
__decorate([
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], ProductDto.prototype, "priceXof", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(1),
    __metadata("design:type", Number)
], ProductDto.prototype, "weightG", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ProductDto.prototype, "available", void 0);
let MerchantsService = class MerchantsService {
    merchants;
    products;
    constructor(merchants, products) {
        this.merchants = merchants;
        this.products = products;
    }
    async forOwner(userId, requireApproved = true) {
        const m = await this.merchants.findOne({ where: { ownerId: userId } });
        if (!m)
            throw new NotFoundException('Profil marchand introuvable');
        if (requireApproved && m.status !== MerchantStatus.APPROVED) {
            throw new ForbiddenException('Votre compte marchand n\'est pas encore approuvé');
        }
        return m;
    }
    listPublic() {
        return this.merchants.find({ where: { status: MerchantStatus.APPROVED }, select: { id: true, businessName: true, address: true, lat: true, lng: true } });
    }
    productsOf(merchantId, onlyAvailable = true) {
        return this.products.find({ where: { merchantId, ...(onlyAvailable ? { available: true } : {}) } });
    }
    async createProduct(userId, dto) {
        const m = await this.forOwner(userId);
        return this.products.save(this.products.create({ ...dto, merchantId: m.id }));
    }
    async updateProduct(userId, id, dto) {
        const m = await this.forOwner(userId);
        const p = await this.products.findOne({ where: { id, merchantId: m.id } });
        if (!p)
            throw new NotFoundException();
        return this.products.save(Object.assign(p, dto));
    }
    listAll() {
        return this.merchants.find({ order: { createdAt: 'DESC' } });
    }
    async setStatus(id, status) {
        const m = await this.merchants.findOne({ where: { id } });
        if (!m)
            throw new NotFoundException();
        m.status = status;
        return this.merchants.save(m);
    }
};
MerchantsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Merchant)),
    __param(1, InjectRepository(Product)),
    __metadata("design:paramtypes", [Repository,
        Repository])
], MerchantsService);
export { MerchantsService };
//# sourceMappingURL=merchants.service.js.map