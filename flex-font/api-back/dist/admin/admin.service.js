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
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Permission, Role } from '../common/enums.js';
import { AdminGroup, AuditLog, User } from '../entities/entities.js';
export class GroupDto {
    name;
    permissions;
}
__decorate([
    IsString(),
    MinLength(2),
    __metadata("design:type", String)
], GroupDto.prototype, "name", void 0);
__decorate([
    IsArray(),
    ArrayUnique(),
    IsEnum(Permission, { each: true }),
    __metadata("design:type", Array)
], GroupDto.prototype, "permissions", void 0);
export class CreateAdminDto {
    email;
    password;
    fullName;
    groupId;
}
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], CreateAdminDto.prototype, "email", void 0);
__decorate([
    IsString(),
    MinLength(10),
    __metadata("design:type", String)
], CreateAdminDto.prototype, "password", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], CreateAdminDto.prototype, "fullName", void 0);
__decorate([
    IsUUID(),
    __metadata("design:type", String)
], CreateAdminDto.prototype, "groupId", void 0);
export class SetGroupDto {
    groupId;
}
__decorate([
    IsOptional(),
    IsUUID(),
    __metadata("design:type", Object)
], SetGroupDto.prototype, "groupId", void 0);
export class SetActiveDto {
    isActive;
}
__decorate([
    IsBoolean(),
    __metadata("design:type", Boolean)
], SetActiveDto.prototype, "isActive", void 0);
let AdminService = class AdminService {
    users;
    groups;
    audit;
    cfg;
    constructor(users, groups, audit, cfg) {
        this.users = users;
        this.groups = groups;
        this.audit = audit;
        this.cfg = cfg;
    }
    async onModuleInit() {
        const email = this.cfg.get('ADMIN_EMAIL');
        const password = this.cfg.get('ADMIN_PASSWORD');
        if (!email || !password)
            return;
        let group = await this.groups.findOne({ where: { name: 'Super Admin' } });
        if (!group)
            group = await this.groups.save(this.groups.create({ name: 'Super Admin', permissions: ['*'] }));
        if (!(await this.users.exists({ where: { email: email.toLowerCase() } }))) {
            await this.users.save(this.users.create({
                email: email.toLowerCase(),
                fullName: 'Super Admin',
                role: Role.ADMIN,
                adminGroup: group,
                passwordHash: await bcrypt.hash(password, 12),
            }));
        }
    }
    listUsers(role) {
        return this.users.find({ where: role ? { role } : {}, order: { createdAt: 'DESC' }, take: 500 });
    }
    async setActive(actorId, id, isActive) {
        const user = await this.users.findOne({ where: { id } });
        if (!user)
            throw new NotFoundException();
        user.isActive = isActive;
        await this.users.save(user);
        await this.log(actorId, isActive ? 'user.activate' : 'user.ban', 'user', id);
        return user;
    }
    listGroups() {
        return this.groups.find({ relations: { members: true }, order: { name: 'ASC' } });
    }
    async createGroup(actorId, dto) {
        if (await this.groups.exists({ where: { name: dto.name } }))
            throw new ConflictException('Nom de groupe déjà utilisé');
        const g = await this.groups.save(this.groups.create(dto));
        await this.log(actorId, 'group.create', 'group', g.id, dto);
        return g;
    }
    async updateGroup(actorId, id, dto) {
        const g = await this.groups.findOne({ where: { id } });
        if (!g)
            throw new NotFoundException();
        if (g.permissions.includes('*'))
            throw new ConflictException('Le groupe Super Admin n\'est pas modifiable');
        Object.assign(g, dto);
        await this.log(actorId, 'group.update', 'group', id, dto);
        return this.groups.save(g);
    }
    async createAdmin(actorId, dto) {
        if (await this.users.exists({ where: { email: dto.email.toLowerCase() } }))
            throw new ConflictException('Email déjà utilisé');
        const group = await this.groups.findOne({ where: { id: dto.groupId } });
        if (!group)
            throw new NotFoundException('Groupe introuvable');
        const u = await this.users.save(this.users.create({
            email: dto.email.toLowerCase(),
            fullName: dto.fullName,
            role: Role.ADMIN,
            adminGroup: group,
            passwordHash: await bcrypt.hash(dto.password, 12),
        }));
        await this.log(actorId, 'admin.create', 'user', u.id, { group: group.name });
        return u;
    }
    async setUserGroup(actorId, userId, groupId) {
        const user = await this.users.findOne({ where: { id: userId, role: Role.ADMIN } });
        if (!user)
            throw new NotFoundException();
        user.adminGroup = groupId ? await this.groups.findOneOrFail({ where: { id: groupId } }) : null;
        await this.log(actorId, 'admin.set-group', 'user', userId, { groupId });
        return this.users.save(user);
    }
    auditLogs(limit = 200) {
        return this.audit.find({ order: { at: 'DESC' }, take: Math.min(limit, 1000) });
    }
    log(userId, action, entity, entityId, meta) {
        return this.audit.save(this.audit.create({ userId, action, entity, entityId, meta }));
    }
};
AdminService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __param(1, InjectRepository(AdminGroup)),
    __param(2, InjectRepository(AuditLog)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        ConfigService])
], AdminService);
export { AdminService };
//# sourceMappingURL=admin.service.js.map