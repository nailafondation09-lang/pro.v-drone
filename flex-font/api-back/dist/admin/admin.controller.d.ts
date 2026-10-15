import { type AuthUser } from '../common/decorators.js';
import { Role } from '../common/enums.js';
import { AdminService, CreateAdminDto, GroupDto, SetActiveDto, SetGroupDto } from './admin.service.js';
export declare class AdminController {
    private admin;
    constructor(admin: AdminService);
    users(role?: Role): Promise<import("../entities/entities.js").User[]>;
    setActive(u: AuthUser, id: string, dto: SetActiveDto): Promise<import("../entities/entities.js").User>;
    groups(): Promise<import("../entities/entities.js").AdminGroup[]>;
    createGroup(u: AuthUser, dto: GroupDto): Promise<import("../entities/entities.js").AdminGroup>;
    updateGroup(u: AuthUser, id: string, dto: GroupDto): Promise<import("../entities/entities.js").AdminGroup>;
    createAdmin(u: AuthUser, dto: CreateAdminDto): Promise<import("../entities/entities.js").User>;
    setGroup(u: AuthUser, id: string, dto: SetGroupDto): Promise<import("../entities/entities.js").User>;
    audit(limit?: string): Promise<import("../entities/entities.js").AuditLog[]>;
}
