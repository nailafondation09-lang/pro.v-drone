import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../auth/access.guard.js';
import { type AuthUser, CurrentUser, Permissions, Roles } from '../common/decorators.js';
import { Permission, Role } from '../common/enums.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { CreateDroneDto, DronesService, InterceptDto, UpdateDroneDto } from './drones.service.js';

@UseGuards(AccessGuard)
@Controller()
export class DronesController {
  constructor(
    private drones: DronesService,
    private merchants: MerchantsService,
  ) {}

  @Roles(Role.MERCHANT)
  @Post('merchant/drones')
  register(@CurrentUser() u: AuthUser, @Body() dto: CreateDroneDto) {
    return this.drones.register(u.id, dto);
  }

  @Roles(Role.MERCHANT)
  @Get('merchant/drones')
  mine(@CurrentUser() u: AuthUser) {
    return this.drones.listMine(u.id);
  }

  @Roles(Role.MERCHANT)
  @Patch('merchant/drones/:id')
  update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDroneDto) {
    return this.drones.update(u.id, id, dto);
  }

  /** Missions en cours de la flotte du marchand (point de départ du suivi temps réel). */
  @Roles(Role.MERCHANT)
  @Get('merchant/fleet/active')
  async activeMine(@CurrentUser() u: AuthUser) {
    const m = await this.merchants.forOwner(u.id, false);
    return this.drones.activeMissions(m.id);
  }

  @Roles(Role.ADMIN)
  @Permissions(Permission.FLEET_VIEW)
  @Get('admin/drones')
  all() {
    return this.drones.listAll();
  }

  @Roles(Role.ADMIN)
  @Permissions(Permission.FLEET_VIEW)
  @Get('admin/fleet/active')
  activeAll() {
    return this.drones.activeMissions();
  }

  @Roles(Role.MERCHANT, Role.ADMIN)
  @Get('drones/:id/telemetry')
  history(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query('limit') limit?: string) {
    return this.drones.history(u, id, limit ? Number(limit) : 500);
  }

  @Roles(Role.MERCHANT, Role.ADMIN)
  @Post('drones/:id/intercept')
  intercept(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: InterceptDto) {
    return this.drones.intercept(u, id, dto);
  }
}
