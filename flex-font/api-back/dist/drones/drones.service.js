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
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { DroneStatus, InterceptionAction, MissionStatus, OrderStatus, Permission, Role, } from '../common/enums.js';
import { AuditLog, Drone, Interception, Mission, Order, TelemetryPoint } from '../entities/entities.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { FleetBus } from '../tracking/fleet-bus.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';
export class CreateDroneDto {
    name;
    serial;
    model;
    maxPayloadG;
    maxRangeM;
}
__decorate([
    IsString(),
    MinLength(2),
    __metadata("design:type", String)
], CreateDroneDto.prototype, "name", void 0);
__decorate([
    IsString(),
    MinLength(3),
    __metadata("design:type", String)
], CreateDroneDto.prototype, "serial", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateDroneDto.prototype, "model", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(100),
    __metadata("design:type", Number)
], CreateDroneDto.prototype, "maxPayloadG", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(500),
    __metadata("design:type", Number)
], CreateDroneDto.prototype, "maxRangeM", void 0);
export class UpdateDroneDto {
    name;
    model;
    maxPayloadG;
    maxRangeM;
    status;
}
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDroneDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], UpdateDroneDto.prototype, "model", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    __metadata("design:type", Number)
], UpdateDroneDto.prototype, "maxPayloadG", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    __metadata("design:type", Number)
], UpdateDroneDto.prototype, "maxRangeM", void 0);
__decorate([
    IsOptional(),
    IsEnum([DroneStatus.IDLE, DroneStatus.MAINTENANCE]),
    __metadata("design:type", String)
], UpdateDroneDto.prototype, "status", void 0);
export class InterceptDto {
    action;
    reason;
}
__decorate([
    IsEnum(InterceptionAction),
    __metadata("design:type", String)
], InterceptDto.prototype, "action", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], InterceptDto.prototype, "reason", void 0);
let DronesService = class DronesService {
    drones;
    missions;
    orders;
    interceptions;
    telemetry;
    audit;
    merchants;
    bus;
    gateway;
    constructor(drones, missions, orders, interceptions, telemetry, audit, merchants, bus, gateway) {
        this.drones = drones;
        this.missions = missions;
        this.orders = orders;
        this.interceptions = interceptions;
        this.telemetry = telemetry;
        this.audit = audit;
        this.merchants = merchants;
        this.bus = bus;
        this.gateway = gateway;
    }
    async register(userId, dto) {
        const m = await this.merchants.forOwner(userId);
        if (await this.drones.exists({ where: { serial: dto.serial } }))
            throw new ConflictException('Numéro de série déjà enregistré');
        return this.drones.save(this.drones.create({ ...dto, merchantId: m.id, lat: m.lat, lng: m.lng }));
    }
    async listMine(userId) {
        const m = await this.merchants.forOwner(userId, false);
        return this.drones.find({ where: { merchantId: m.id }, order: { createdAt: 'DESC' } });
    }
    listAll() {
        return this.drones.find({ order: { createdAt: 'DESC' } });
    }
    async update(userId, id, dto) {
        const drone = await this.ownedDrone(userId, id);
        if (dto.status && ![DroneStatus.IDLE, DroneStatus.MAINTENANCE].includes(drone.status)) {
            throw new ConflictException('Impossible de changer le statut pendant une mission');
        }
        return this.drones.save(Object.assign(drone, dto));
    }
    async activeMissions(merchantId) {
        const missions = await this.missions.find({
            where: { status: In([MissionStatus.IN_FLIGHT, MissionStatus.PLANNED]) },
            relations: { drone: true, order: true },
        });
        return merchantId ? missions.filter((m) => m.drone.merchantId === merchantId) : missions;
    }
    async history(user, droneId, limit = 500) {
        if (user.role === Role.MERCHANT)
            await this.ownedDrone(user.id, droneId);
        return this.telemetry.find({ where: { droneId }, order: { at: 'DESC' }, take: Math.min(limit, 2000) });
    }
    async intercept(user, droneId, dto) {
        let drone;
        if (user.role === Role.ADMIN) {
            if (!user.permissions.includes('*') && !user.permissions.includes(Permission.DRONES_INTERCEPT)) {
                throw new ForbiddenException('Permission manquante');
            }
            const d = await this.drones.findOne({ where: { id: droneId } });
            if (!d)
                throw new NotFoundException();
            drone = d;
        }
        else {
            drone = await this.ownedDrone(user.id, droneId);
        }
        const mission = await this.missions.findOne({
            where: { droneId, status: MissionStatus.IN_FLIGHT },
            relations: { order: true },
        });
        if (!mission)
            throw new ConflictException('Ce drone n\'est pas en mission');
        const nextStatus = {
            [InterceptionAction.RETURN_HOME]: DroneStatus.RETURNING,
            [InterceptionAction.LAND_NOW]: DroneStatus.EMERGENCY_LANDED,
            [InterceptionAction.HOVER]: DroneStatus.HOVERING,
        }[dto.action];
        drone.status = nextStatus;
        await this.drones.save(drone);
        if (dto.action !== InterceptionAction.HOVER) {
            mission.status = MissionStatus.INTERCEPTED;
            await this.missions.save(mission);
            await this.orders.update(mission.orderId, { status: OrderStatus.INTERCEPTED });
        }
        const record = await this.interceptions.save(this.interceptions.create({ droneId, missionId: mission.id, byUserId: user.id, action: dto.action, reason: dto.reason }));
        await this.audit.save(this.audit.create({ userId: user.id, action: 'drone.intercept', entity: 'drone', entityId: droneId, meta: dto }));
        this.bus.intercept({ droneId, missionId: mission.id, action: dto.action });
        this.gateway.emitMerchant(drone.merchantId, 'interception.executed', { ...record, droneName: drone.name }, mission.orderId);
        return record;
    }
    async ownedDrone(userId, id) {
        const m = await this.merchants.forOwner(userId);
        const drone = await this.drones.findOne({ where: { id, merchantId: m.id } });
        if (!drone)
            throw new NotFoundException('Drone introuvable');
        return drone;
    }
};
DronesService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Drone)),
    __param(1, InjectRepository(Mission)),
    __param(2, InjectRepository(Order)),
    __param(3, InjectRepository(Interception)),
    __param(4, InjectRepository(TelemetryPoint)),
    __param(5, InjectRepository(AuditLog)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        Repository,
        MerchantsService,
        FleetBus,
        TrackingGateway])
], DronesService);
export { DronesService };
//# sourceMappingURL=drones.service.js.map