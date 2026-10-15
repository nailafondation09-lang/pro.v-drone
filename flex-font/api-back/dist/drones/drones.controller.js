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
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../auth/access.guard.js';
import { CurrentUser, Permissions, Roles } from '../common/decorators.js';
import { Permission, Role } from '../common/enums.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { CreateDroneDto, DronesService, InterceptDto, UpdateDroneDto } from './drones.service.js';
let DronesController = class DronesController {
    drones;
    merchants;
    constructor(drones, merchants) {
        this.drones = drones;
        this.merchants = merchants;
    }
    register(u, dto) {
        return this.drones.register(u.id, dto);
    }
    mine(u) {
        return this.drones.listMine(u.id);
    }
    update(u, id, dto) {
        return this.drones.update(u.id, id, dto);
    }
    async activeMine(u) {
        const m = await this.merchants.forOwner(u.id, false);
        return this.drones.activeMissions(m.id);
    }
    all() {
        return this.drones.listAll();
    }
    activeAll() {
        return this.drones.activeMissions();
    }
    history(u, id, limit) {
        return this.drones.history(u, id, limit ? Number(limit) : 500);
    }
    intercept(u, id, dto) {
        return this.drones.intercept(u, id, dto);
    }
};
__decorate([
    Roles(Role.MERCHANT),
    Post('merchant/drones'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateDroneDto]),
    __metadata("design:returntype", void 0)
], DronesController.prototype, "register", null);
__decorate([
    Roles(Role.MERCHANT),
    Get('merchant/drones'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DronesController.prototype, "mine", null);
__decorate([
    Roles(Role.MERCHANT),
    Patch('merchant/drones/:id'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, UpdateDroneDto]),
    __metadata("design:returntype", void 0)
], DronesController.prototype, "update", null);
__decorate([
    Roles(Role.MERCHANT),
    Get('merchant/fleet/active'),
    __param(0, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DronesController.prototype, "activeMine", null);
__decorate([
    Roles(Role.ADMIN),
    Permissions(Permission.FLEET_VIEW),
    Get('admin/drones'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DronesController.prototype, "all", null);
__decorate([
    Roles(Role.ADMIN),
    Permissions(Permission.FLEET_VIEW),
    Get('admin/fleet/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DronesController.prototype, "activeAll", null);
__decorate([
    Roles(Role.MERCHANT, Role.ADMIN),
    Get('drones/:id/telemetry'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __param(2, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], DronesController.prototype, "history", null);
__decorate([
    Roles(Role.MERCHANT, Role.ADMIN),
    Post('drones/:id/intercept'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, InterceptDto]),
    __metadata("design:returntype", void 0)
], DronesController.prototype, "intercept", null);
DronesController = __decorate([
    UseGuards(AccessGuard),
    Controller(),
    __metadata("design:paramtypes", [DronesService,
        MerchantsService])
], DronesController);
export { DronesController };
//# sourceMappingURL=drones.controller.js.map