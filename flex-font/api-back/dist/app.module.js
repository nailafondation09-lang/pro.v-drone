var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
            TypeOrmModule.forRootAsync({
                inject: [ConfigService],
                useFactory: (cfg) => ({
                    type: 'postgres',
                    host: cfg.get('DB_HOST', 'localhost'),
                    port: Number(cfg.get('DB_PORT', 5432)),
                    username: cfg.get('DB_USER', 'droneship'),
                    password: cfg.getOrThrow('DB_PASSWORD'),
                    database: cfg.get('DB_NAME', 'droneship'),
                    entities: ALL_ENTITIES,
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
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map