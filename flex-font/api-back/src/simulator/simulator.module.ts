import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone, Mission, Order, TelemetryPoint } from '../entities/entities.js';
import { ZonesModule } from '../zones/zones.module.js';
import { SimulatorService } from './simulator.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Mission, Drone, Order, TelemetryPoint]), ZonesModule],
  providers: [SimulatorService],
})
export class SimulatorModule {}
