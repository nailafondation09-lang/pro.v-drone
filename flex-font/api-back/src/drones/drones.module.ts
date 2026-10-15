import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Drone, Interception, Mission, Order, TelemetryPoint } from '../entities/entities.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { DronesController } from './drones.controller.js';
import { DronesService } from './drones.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Drone, Mission, Order, Interception, TelemetryPoint, AuditLog]), MerchantsModule],
  controllers: [DronesController],
  providers: [DronesService],
  exports: [DronesService],
})
export class DronesModule {}
