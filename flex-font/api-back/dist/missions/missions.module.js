var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone, Mission } from '../entities/entities.js';
import { ZonesModule } from '../zones/zones.module.js';
import { MissionsService } from './missions.service.js';
import { RoutePlannerService } from './route-planner.service.js';
let MissionsModule = class MissionsModule {
};
MissionsModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Mission, Drone]), ZonesModule],
        providers: [MissionsService, RoutePlannerService],
        exports: [MissionsService, RoutePlannerService],
    })
], MissionsModule);
export { MissionsModule };
//# sourceMappingURL=missions.module.js.map