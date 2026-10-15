import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Permission, Role } from './enums.js';

export const ROLES_KEY = 'roles';
export const PERMS_KEY = 'perms';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...perms: Permission[]) => SetMetadata(PERMS_KEY, perms);

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  permissions: string[];
}

export const CurrentUser = createParamDecorator((_d: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
