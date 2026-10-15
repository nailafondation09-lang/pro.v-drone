import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { ArrayUnique, IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Permission, Role } from '../common/enums.js';
import { AdminGroup, AuditLog, User } from '../entities/entities.js';

export class GroupDto {
  @IsString() @MinLength(2) name: string;
  @IsArray() @ArrayUnique() @IsEnum(Permission, { each: true }) permissions: Permission[];
}

export class CreateAdminDto {
  @IsEmail() email: string;
  @IsString() @MinLength(10) password: string;
  @IsString() fullName: string;
  @IsUUID() groupId: string;
}

export class SetGroupDto {
  @IsOptional() @IsUUID() groupId: string | null;
}

export class SetActiveDto {
  @IsBoolean() isActive: boolean;
}

@Injectable()
export class AdminService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(AdminGroup) private groups: Repository<AdminGroup>,
    @InjectRepository(AuditLog) private audit: Repository<AuditLog>,
    private cfg: ConfigService,
  ) {}

  /** Crée le groupe « Super Admin » et le premier administrateur depuis l'environnement. */
  async onModuleInit() {
    const email = this.cfg.get<string>('ADMIN_EMAIL');
    const password = this.cfg.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;
    let group = await this.groups.findOne({ where: { name: 'Super Admin' } });
    if (!group) group = await this.groups.save(this.groups.create({ name: 'Super Admin', permissions: ['*'] }));
    if (!(await this.users.exists({ where: { email: email.toLowerCase() } }))) {
      await this.users.save(
        this.users.create({
          email: email.toLowerCase(),
          fullName: 'Super Admin',
          role: Role.ADMIN,
          adminGroup: group,
          passwordHash: await bcrypt.hash(password, 12),
        }),
      );
    }
  }

  listUsers(role?: Role) {
    return this.users.find({ where: role ? { role } : {}, order: { createdAt: 'DESC' }, take: 500 });
  }

  async setActive(actorId: string, id: string, isActive: boolean) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    user.isActive = isActive;
    await this.users.save(user);
    await this.log(actorId, isActive ? 'user.activate' : 'user.ban', 'user', id);
    return user;
  }

  listGroups() {
    return this.groups.find({ relations: { members: true }, order: { name: 'ASC' } });
  }

  async createGroup(actorId: string, dto: GroupDto) {
    if (await this.groups.exists({ where: { name: dto.name } })) throw new ConflictException('Nom de groupe déjà utilisé');
    const g = await this.groups.save(this.groups.create(dto));
    await this.log(actorId, 'group.create', 'group', g.id, dto);
    return g;
  }

  async updateGroup(actorId: string, id: string, dto: GroupDto) {
    const g = await this.groups.findOne({ where: { id } });
    if (!g) throw new NotFoundException();
    if (g.permissions.includes('*')) throw new ConflictException('Le groupe Super Admin n\'est pas modifiable');
    Object.assign(g, dto);
    await this.log(actorId, 'group.update', 'group', id, dto);
    return this.groups.save(g);
  }

  async createAdmin(actorId: string, dto: CreateAdminDto) {
    if (await this.users.exists({ where: { email: dto.email.toLowerCase() } })) throw new ConflictException('Email déjà utilisé');
    const group = await this.groups.findOne({ where: { id: dto.groupId } });
    if (!group) throw new NotFoundException('Groupe introuvable');
    const u = await this.users.save(
      this.users.create({
        email: dto.email.toLowerCase(),
        fullName: dto.fullName,
        role: Role.ADMIN,
        adminGroup: group,
        passwordHash: await bcrypt.hash(dto.password, 12),
      }),
    );
    await this.log(actorId, 'admin.create', 'user', u.id, { group: group.name });
    return u;
  }

  async setUserGroup(actorId: string, userId: string, groupId: string | null) {
    const user = await this.users.findOne({ where: { id: userId, role: Role.ADMIN } });
    if (!user) throw new NotFoundException();
    user.adminGroup = groupId ? await this.groups.findOneOrFail({ where: { id: groupId } }) : null;
    await this.log(actorId, 'admin.set-group', 'user', userId, { groupId });
    return this.users.save(user);
  }

  auditLogs(limit = 200) {
    return this.audit.find({ order: { at: 'DESC' }, take: Math.min(limit, 1000) });
  }

  private log(userId: string, action: string, entity: string, entityId: string, meta?: unknown) {
    return this.audit.save(this.audit.create({ userId, action, entity, entityId, meta }));
  }
}
