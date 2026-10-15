import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, TelemetryPoint } from '../entities/entities.js';
import { TrackingGateway } from './tracking.gateway.js';
import { FleetBus } from './fleet-bus.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Order, TelemetryPoint])],
  providers: [TrackingGateway, FleetBus],
  exports: [TrackingGateway, FleetBus],
})
export class TrackingModule {}
