var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PERMS_KEY, ROLES_KEY } from '../common/decorators.js';
let AccessGuard = class AccessGuard extends AuthGuard('jwt') {
    reflector;
    constructor(reflector) {
        super();
        this.reflector = reflector;
    }
    async canActivate(ctx) {
        const ok = (await super.canActivate(ctx));
        if (!ok)
            throw new UnauthorizedException();
        const user = ctx.switchToHttp().getRequest().user;
        const roles = this.reflector.getAllAndOverride(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
        if (roles?.length && !roles.includes(user.role))
            throw new ForbiddenException('Rôle insuffisant');
        const perms = this.reflector.getAllAndOverride(PERMS_KEY, [ctx.getHandler(), ctx.getClass()]);
        if (perms?.length) {
            const has = user.permissions.includes('*') || perms.every((p) => user.permissions.includes(p));
            if (!has)
                throw new ForbiddenException('Permission manquante');
        }
        return true;
    }
};
AccessGuard = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Reflector])
], AccessGuard);
export { AccessGuard };
//# sourceMappingURL=access.guard.js.map