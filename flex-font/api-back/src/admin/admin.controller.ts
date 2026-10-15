import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../auth/access.guard.js';
import { type AuthUser, CurrentUser, Permissions, Roles } from '../common/decorators.js';
import { Permission, Role } from '../common/enums.js';
import { AdminService, CreateAdminDto, GroupDto, SetActiveDto, SetGroupDto } from './admin.service.js';

@UseGuards(AccessGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Permissions(Permission.USERS_READ)
  @Get('users')
  users(@Query('role') role?: Role) {
    return this.admin.listUsers(role);
  }

  @Permissions(Permission.USERS_BAN)
  @Patch('users/:id/active')
  setActive(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SetActiveDto) {
    return this.admin.setActive(u.id, id, dto.isActive);
  }

  @Permissions(Permission.GROUPS_MANAGE)
  @Get('groups')
  groups() {
    return this.admin.listGroups();
  }

  @Permissions(Permission.GROUPS_MANAGE)
  @Post('groups')
  createGroup(@CurrentUser() u: AuthUser, @Body() dto: GroupDto) {
    return this.admin.createGroup(u.id, dto);
  }

  @Permissions(Permission.GROUPS_MANAGE)
  @Put('groups/:id')
  updateGroup(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: GroupDto) {
    return this.admin.updateGroup(u.id, id, dto);
  }

  @Permissions(Permission.GROUPS_MANAGE)
  @Post('admins')
  createAdmin(@CurrentUser() u: AuthUser, @Body() dto: CreateAdminDto) {
    return this.admin.createAdmin(u.id, dto);
  }

  @Permissions(Permission.GROUPS_MANAGE)
  @Patch('admins/:id/group')
  setGroup(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SetGroupDto) {
    return this.admin.setUserGroup(u.id, id, dto.groupId ?? null);
  }

  @Permissions(Permission.GROUPS_MANAGE)
  @Get('audit')
  audit(@Query('limit') limit?: string) {
    return this.admin.auditLogs(limit ? Number(limit) : 200);
  }
}
