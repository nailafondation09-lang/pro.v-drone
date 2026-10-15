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
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { AccessGuard } from '../auth/access.guard.js';
import { CurrentUser, Permissions, Roles } from '../common/decorators.js';
import { MerchantStatus, Permission, Role } from '../common/enums.js';
import { MerchantsService, ProductDto } from './merchants.service.js';
class UpdateProductDto extends PartialType(ProductDto) {
}
class StatusDto {
    status;
}
__decorate([
    IsEnum(MerchantStatus),
    __metadata("design:type", String)
], StatusDto.prototype, "status", void 0);
let MerchantsController = class MerchantsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list() {
        return this.svc.listPublic();
    }
    products(id) {
        return this.svc.productsOf(id);
    }
    async myProducts(u) {
        const m = await this.svc.forOwner(u.id, false);
        return this.svc.productsOf(m.id, false);
    }
    create(u, dto) {
        return this.svc.createProduct(u.id, dto);
    }
    update(u, id, dto) {
        return this.svc.updateProduct(u.id, id, dto);
    }
    all() {
        return this.svc.listAll();
    }
    setStatus(id, dto) {
        return this.svc.setStatus(id, dto.status);
    }
};
__decorate([
    Get('merchants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "list", null);
__decorate([
    Get('merchants/:id/products'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "products", null);
__decorate([
    Roles(Role.MERCHANT),
    Get('merchant/products'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MerchantsController.prototype, "myProducts", null);
__decorate([
    Roles(Role.MERCHANT),
    Post('merchant/products'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ProductDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "create", null);
__decorate([
    Roles(Role.MERCHANT),
    Patch('merchant/products/:id'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateProductDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "update", null);
__decorate([
    Roles(Role.ADMIN),
    Permissions(Permission.MERCHANTS_APPROVE),
    Get('admin/merchants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "all", null);
__decorate([
    Roles(Role.ADMIN),
    Permissions(Permission.MERCHANTS_APPROVE),
    Patch('admin/merchants/:id/status'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, StatusDto]),
    __metadata("design:returntype", void 0)
], MerchantsController.prototype, "setStatus", null);
MerchantsController = __decorate([
    UseGuards(AccessGuard),
    Controller(),
    __metadata("design:paramtypes", [MerchantsService])
], MerchantsController);
export { MerchantsController };
//# sourceMappingURL=merchants.controller.js.map