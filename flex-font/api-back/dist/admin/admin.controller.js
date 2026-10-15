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
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../auth/access.guard.js';
import { CurrentUser, Permissions, Roles } from '../common/decorators.js';
import { Permission, Role } from '../common/enums.js';
import { AdminService, CreateAdminDto, GroupDto, SetActiveDto, SetGroupDto } from './admin.service.js';
let AdminController = class AdminController {
    admin;
    constructor(admin) {
        this.admin = admin;
    }
    users(role) {
        return this.admin.listUsers(role);
    }
    setActive(u, id, dto) {
        return this.admin.setActive(u.id, id, dto.isActive);
    }
    groups() {
        return this.admin.listGroups();
    }
    createGroup(u, dto) {
        return this.admin.createGroup(u.id, dto);
    }
    updateGroup(u, id, dto) {
        return this.admin.updateGroup(u.id, id, dto);
    }
    createAdmin(u, dto) {
        return this.admin.createAdmin(u.id, dto);
    }
    setGroup(u, id, dto) {
        return this.admin.setUserGroup(u.id, id, dto.groupId ?? null);
    }
    audit(limit) {
        return this.admin.auditLogs(limit ? Number(limit) : 200);
    }
};
__decorate([
    Permissions(Permission.USERS_READ),
    Get('users'),
    __param(0, Query('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "users", null);
__decorate([
    Permissions(Permission.USERS_BAN),
    Patch('users/:id/active'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, SetActiveDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setActive", null);
__decorate([
    Permissions(Permission.GROUPS_MANAGE),
    Get('groups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "groups", null);
__decorate([
    Permissions(Permission.GROUPS_MANAGE),
    Post('groups'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, GroupDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createGroup", null);
__decorate([
    Permissions(Permission.GROUPS_MANAGE),
    Put('groups/:id'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, GroupDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "updateGroup", null);
__decorate([
    Permissions(Permission.GROUPS_MANAGE),
    Post('admins'),
    __param(0, CurrentUser()),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, CreateAdminDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "createAdmin", null);
__decorate([
    Permissions(Permission.GROUPS_MANAGE),
    Patch('admins/:id/group'),
    __param(0, CurrentUser()),
    __param(1, Param('id', ParseUUIDPipe)),
    __param(2, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, SetGroupDto]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "setGroup", null);
__decorate([
    Permissions(Permission.GROUPS_MANAGE),
    Get('audit'),
    __param(0, Query('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminController.prototype, "audit", null);
AdminController = __decorate([
    UseGuards(AccessGuard),
    Roles(Role.ADMIN),
    Controller('admin'),
    __metadata("design:paramtypes", [AdminService])
], AdminController);
export { AdminController };
//# sourceMappingURL=admin.controller.js.map