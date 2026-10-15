import { Permission, Role } from './enums.js';
export declare const ROLES_KEY = "roles";
export declare const PERMS_KEY = "perms";
export declare const Roles: (...roles: Role[]) => import("@nestjs/common").CustomDecorator<string>;
export declare const Permissions: (...perms: Permission[]) => import("@nestjs/common").CustomDecorator<string>;
export interface AuthUser {
    id: string;
    email: string;
    role: Role;
    permissions: string[];
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
