var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Zone } from '../entities/entities.js';
import { ZonesController } from './zones.controller.js';
import { ZonesService } from './zones.service.js';
let ZonesModule = class ZonesModule {
};
ZonesModule = __decorate([
    Module({
        imports: [TypeOrmModule.forFeature([Zone])],
        controllers: [ZonesController],
        providers: [ZonesService],
        exports: [ZonesService],
    })
], ZonesModule);
export { ZonesModule };
//# sourceMappingURL=zones.module.js.map