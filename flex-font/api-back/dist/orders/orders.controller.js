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
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../auth/access.guard.js';
import { CurrentUser, Roles } from '../common/decorators.js';
import { Role } from '../common/enums.js';
import { CreateOrderDto, OrdersService } from './orders.service.js';
let OrdersController = class OrdersController {
    orders;
    constructor(orders) {
        this.orders = orders;
    }
    create(u, dto) {
        return this.orders.create(u.id, dto);
    }
    mine(u) {
        return this.orders.mine(u.id);
    }
    one(u, id) {
        return this.orders.getForCustomer(u.id, id);
    }
    merchantOrders(u) {
        return this.orders.forMerchant(u.id);
    }
    accept(u, id) {
        return this.orders.accept(u.id, id);
    }
};
__decorate([
    Roles(Role.CUSTOMER),
    Post('orders'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    Roles(Role.CUSTOMER),
    Get('orders/mine'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "mine", null);
__decorate([
    Roles(Role.CUSTOMER),
    Get('orders/:id'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "one", null);
__decorate([
    Roles(Role.MERCHANT),
    Get('merchant/orders'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "merchantOrders", null);
__decorate([
    Roles(Role.MERCHANT),
    Post('merchant/orders/:id/accept'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "accept", null);
OrdersController = __decorate([
    UseGuards(AccessGuard),
    Controller(),
    __metadata("design:paramtypes", [OrdersService])
], OrdersController);
export { OrdersController };
//# sourceMappingURL=orders.controller.js.map