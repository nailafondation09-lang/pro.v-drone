import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone, Mission } from '../entities/entities.js';
import { ZonesModule } from '../zones/zones.module.js';
import { MissionsService } from './missions.service.js';
import { RoutePlannerService } from './route-planner.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mission, Drone]), ZonesModule],
  providers: [MissionsService, RoutePlannerService],
  exports: [MissionsService, RoutePlannerService],
})
export class MissionsModule {}
