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
import { Body, Controller, Headers, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AccessGuard } from '../auth/access.guard.js';
import { CurrentUser, Roles } from '../common/decorators.js';
import { Role } from '../common/enums.js';
import { OrdersService } from '../orders/orders.service.js';
import { PaymentsService } from './payments.service.js';
let PaymentsController = class PaymentsController {
    payments;
    orders;
    constructor(payments, orders) {
        this.payments = payments;
        this.orders = orders;
    }
    initiate(u, id) {
        return this.payments.initiate(u.id, id);
    }
    webhook(headers, body) {
        return this.payments.handleWebhook(headers, body);
    }
    confirmMock(u, ref) {
        return this.payments.confirmMock(u.id, ref);
    }
    reject(u, id) {
        return this.orders.reject(u.id, id, (orderId) => this.payments.refundOrder(orderId));
    }
};
__decorate([
    UseGuards(AccessGuard),
    Roles(Role.CUSTOMER),
    Post('payments/orders/:id/initiate'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "initiate", null);
__decorate([
    SkipThrottle(),
    HttpCode(200),
    Post('payments/webhook'),
    __param(0, Headers()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "webhook", null);
__decorate([
    UseGuards(AccessGuard),
    Roles(Role.CUSTOMER),
    Post('payments/mock/:ref/confirm'),
    __param(0, CurrentUser()),
    __param(1, Param('ref')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "confirmMock", null);
__decorate([
    UseGuards(AccessGuard),
    Roles(Role.MERCHANT),
    Post('merchant/orders/:id/reject'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "reject", null);
PaymentsController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [PaymentsService,
        OrdersService])
], PaymentsController);
export { PaymentsController };
//# sourceMappingURL=payments.controller.js.map