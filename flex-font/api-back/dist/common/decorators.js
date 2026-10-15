import { SetMetadata, createParamDecorator } from '@nestjs/common';
export const ROLES_KEY = 'roles';
export const PERMS_KEY = 'perms';
export const Roles = (...roles) => SetMetadata(ROLES_KEY, roles);
export const Permissions = (...perms) => SetMetadata(PERMS_KEY, perms);
export const CurrentUser = createParamDecorator((_d, ctx) => {
    return ctx.switchToHttp().getRequest().user;
});
//# sourceMappingURL=decorators.js.map