var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog, Drone, Interception, Mission, Order, TelemetryPoint } from '../entities/entities.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { DronesController } from './drones.controller.js';
import { DronesService } from './drones.service.js';
let DronesModule = class DronesModule {
};
DronesModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Drone, Mission, Order, Interception, TelemetryPoint, AuditLog]), MerchantsModule],
        controllers: [DronesController],
        providers: [DronesService],
        exports: [DronesService],
    })
], DronesModule);
export { DronesModule };
//# sourceMappingURL=drones.module.js.map