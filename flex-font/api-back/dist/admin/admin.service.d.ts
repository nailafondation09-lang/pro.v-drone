import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Permission, Role } from '../common/enums.js';
import { AdminGroup, AuditLog, User } from '../entities/entities.js';
export declare class GroupDto {
    name: string;
    permissions: Permission[];
}
export declare class CreateAdminDto {
    email: string;
    password: string;
    fullName: string;
    groupId: string;
}
export declare class SetGroupDto {
    groupId: string | null;
}
export declare class SetActiveDto {
    isActive: boolean;
}
export declare class AdminService implements OnModuleInit {
    private users;
    private groups;
    private audit;
    private cfg;
    constructor(users: Repository<User>, groups: Repository<AdminGroup>, audit: Repository<AuditLog>, cfg: ConfigService);
    onModuleInit(): Promise<void>;
    listUsers(role?: Role): Promise<User[]>;
    setActive(actorId: string, id: string, isActive: boolean): Promise<User>;
    listGroups(): Promise<AdminGroup[]>;
    createGroup(actorId: string, dto: GroupDto): Promise<AdminGroup>;
    updateGroup(actorId: string, id: string, dto: GroupDto): Promise<AdminGroup>;
    createAdmin(actorId: string, dto: CreateAdminDto): Promise<User>;
    setUserGroup(actorId: string, userId: string, groupId: string | null): Promise<User>;
    auditLogs(limit?: number): Promise<AuditLog[]>;
    private log;
}
