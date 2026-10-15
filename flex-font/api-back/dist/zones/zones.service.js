var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Zone } from '../entities/entities.js';
import { ZoneType } from '../common/enums.js';
import { pointInPolygon } from '../common/geo.js';
export class ZoneDto {
    name;
    type;
    polygon;
    minAltM;
    maxAltM;
    active;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], ZoneDto.prototype, "name", void 0);
__decorate([
    IsEnum(ZoneType),
    __metadata("design:type", String)
], ZoneDto.prototype, "type", void 0);
__decorate([
    IsArray(),
    __metadata("design:type", Array)
], ZoneDto.prototype, "polygon", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], ZoneDto.prototype, "minAltM", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], ZoneDto.prototype, "maxAltM", void 0);
__decorate([
    IsOptional(),
    IsBoolean(),
    __metadata("design:type", Boolean)
], ZoneDto.prototype, "active", void 0);
let ZonesService = class ZonesService {
    zones;
    cache = null;
    constructor(zones) {
        this.zones = zones;
    }
    async active() {
        if (!this.cache)
            this.cache = await this.zones.find({ where: { active: true } });
        return this.cache;
    }
    list() {
        return this.zones.find({ order: { createdAt: 'DESC' } });
    }
    async create(dto, userId) {
        this.validatePolygon(dto.polygon);
        this.cache = null;
        return this.zones.save(this.zones.create({ ...dto, createdById: userId }));
    }
    async update(id, dto) {
        const zone = await this.zones.findOne({ where: { id } });
        if (!zone)
            throw new NotFoundException();
        if (dto.polygon)
            this.validatePolygon(dto.polygon);
        this.cache = null;
        return this.zones.save(Object.assign(zone, dto));
    }
    async remove(id) {
        this.cache = null;
        await this.zones.delete(id);
    }
    async zonesAt(p) {
        const zones = await this.active();
        return zones.filter((z) => p.alt >= z.minAltM && p.alt <= z.maxAltM && pointInPolygon(p, z.polygon));
    }
    validatePolygon(poly) {
        const ok = Array.isArray(poly) &&
            poly.length >= 3 &&
            poly.every((p) => Array.isArray(p) && p.length === 2 && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180);
        if (!ok)
            throw new NotFoundException('Polygone invalide (≥ 3 sommets [lat,lng])');
    }
};
ZonesService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Zone)),
    __metadata("design:paramtypes", [Repository])
], ZonesService);
export { ZonesService };
//# sourceMappingURL=zones.service.js.map