import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { PartialType } from '@nestjs/mapped-types';
import { AccessGuard } from '../auth/access.guard.js';
import { type AuthUser, CurrentUser, Permissions, Roles } from '../common/decorators.js';
import { Permission, Role } from '../common/enums.js';
import { ZoneDto, ZonesService } from './zones.service.js';

class UpdateZoneDto extends PartialType(ZoneDto) {}

@UseGuards(AccessGuard)
@Controller()
export class ZonesController {
  constructor(private zones: ZonesService) {}

  /** Tous les utilisateurs connectés voient les zones actives (carte client / marchand). */
  @Get('zones')
  async active() {
    return this.zones.active();
  }

  @Roles(Role.ADMIN)
  @Permissions(Permission.ZONES_WRITE)
  @Get('admin/zones')
  all() {
    return this.zones.list();
  }

  @Roles(Role.ADMIN)
  @Permissions(Permission.ZONES_WRITE)
  @Post('admin/zones')
  create(@Body() dto: ZoneDto, @CurrentUser() u: AuthUser) {
    return this.zones.create(dto, u.id);
  }

  @Roles(Role.ADMIN)
  @Permissions(Permission.ZONES_WRITE)
  @Patch('admin/zones/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateZoneDto) {
    return this.zones.update(id, dto);
  }

  @Roles(Role.ADMIN)
  @Permissions(Permission.ZONES_WRITE)
  @Delete('admin/zones/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.zones.remove(id);
  }
}
