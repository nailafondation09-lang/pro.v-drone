import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DronesModule } from './drones/drones.module.js';
import { ALL_ENTITIES } from './entities/entities.js';
import { MerchantsModule } from './merchants/merchants.module.js';
import { MissionsModule } from './missions/missions.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { SimulatorModule } from './simulator/simulator.module.js';
import { TrackingModule } from './tracking/tracking.module.js';
import { ZonesModule } from './zones/zones.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: Number(cfg.get('DB_PORT', 5432)),
        username: cfg.get('DB_USER', 'droneship'),
        password: cfg.getOrThrow('DB_PASSWORD'),
        database: cfg.get('DB_NAME', 'droneship'),
        entities: ALL_ENTITIES,
        // En production : false + migrations TypeORM.
        synchronize: cfg.get('DB_SYNCHRONIZE', 'false') === 'true',
      }),
    }),
    AuthModule,
    TrackingModule,
    ZonesModule,
    MerchantsModule,
    MissionsModule,
    OrdersModule,
    PaymentsModule,
    DronesModule,
    SimulatorModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
