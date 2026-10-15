import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { PERMS_KEY, ROLES_KEY, type AuthUser } from '../common/decorators.js';
import { Role } from '../common/enums.js';

/** Vérifie le JWT puis @Roles et @Permissions (les routes sans @Roles exigent seulement d'être connecté). */
@Injectable()
export class AccessGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const ok = (await super.canActivate(ctx)) as boolean;
    if (!ok) throw new UnauthorizedException();
    const user: AuthUser = ctx.switchToHttp().getRequest().user;
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (roles?.length && !roles.includes(user.role)) throw new ForbiddenException('Rôle insuffisant');
    const perms = this.reflector.getAllAndOverride<string[]>(PERMS_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (perms?.length) {
      // Un ADMIN sans groupe n'a aucune permission fine ; super-admin = permission '*'.
      const has = user.permissions.includes('*') || perms.every((p) => user.permissions.includes(p));
      if (!has) throw new ForbiddenException('Permission manquante');
    }
    return true;
  }
}
