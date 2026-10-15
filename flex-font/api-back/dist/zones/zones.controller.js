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
import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { AccessGuard } from '../auth/access.guard.js';
import { CurrentUser, Permissions, Roles } from '../common/decorators.js';
import { Permission, Role } from '../common/enums.js';
import { ZoneDto, ZonesService } from './zones.service.js';
class UpdateZoneDto extends PartialType(ZoneDto) {
}
let ZonesController = class ZonesController {
    zones;
    constructor(zones) {
        this.zones = zones;
    }
    async active() {
        return this.zones.active();
    }
    all() {
        return this.zones.list();
    }
    create(dto, u) {
        return this.zones.create(dto, u.id);
    }
    update(id, dto) {
        return this.zones.update(id, dto);
    }
    remove(id) {
        return this.zones.remove(id);
    }
};
__decorate([
    Get('zones'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ZonesController.prototype, "active", null);
__decorate([
    Roles(Role.ADMIN),
    Permissions(Permission.ZONES_WRITE),
    Get('admin/zones'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ZonesController.prototype, "all", null);
__decorate([
    Roles(Role.ADMIN),
    Permissions(Permission.ZONES_WRITE),
    Post('admin/zones'),
    __param(0, Body()),
    __param(1, CurrentUser()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ZoneDto, Object]),
    __metadata("design:returntype", void 0)
], ZonesController.prototype, "create", null);
__decorate([
    Roles(Role.ADMIN),
    Permissions(Permission.ZONES_WRITE),
    Patch('admin/zones/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateZoneDto]),
    __metadata("design:returntype", void 0)
], ZonesController.prototype, "update", null);
__decorate([
    Roles(Role.ADMIN),
    Permissions(Permission.ZONES_WRITE),
    Delete('admin/zones/:id'),
    __param(0, Param('id', ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ZonesController.prototype, "remove", null);
ZonesController = __decorate([
    UseGuards(AccessGuard),
    Controller(),
    __metadata("design:paramtypes", [ZonesService])
], ZonesController);
export { ZonesController };
//# sourceMappingURL=zones.controller.js.map