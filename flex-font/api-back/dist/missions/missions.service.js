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
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DroneStatus, MissionStatus } from '../common/enums.js';
import { Drone, Mission } from '../entities/entities.js';
import { FleetBus } from '../tracking/fleet-bus.js';
import { RoutePlannerService } from './route-planner.service.js';
const CRUISE_SPEED_MS = 12;
const MIN_BATTERY_PCT = 30;
let MissionsService = class MissionsService {
    missions;
    drones;
    planner;
    bus;
    constructor(missions, drones, planner, bus) {
        this.missions = missions;
        this.drones = drones;
        this.planner = planner;
        this.bus = bus;
    }
    forOrder(orderId) {
        return this.missions.findOne({ where: { orderId }, order: { createdAt: 'DESC' } });
    }
    async createAndStart(order, merchant) {
        const candidates = await this.drones.find({ where: { merchantId: merchant.id, status: DroneStatus.IDLE } });
        const dest = { lat: order.deliveryLat, lng: order.deliveryLng };
        for (const drone of candidates.sort((a, b) => b.batteryPct - a.batteryPct)) {
            if (drone.batteryPct < MIN_BATTERY_PCT || drone.maxPayloadG < order.totalWeightG)
                continue;
            const route = await this.planner.plan({ lat: merchant.lat, lng: merchant.lng }, dest);
            const distanceM = RoutePlannerService.routeLength(route);
            if (distanceM * 2 > drone.maxRangeM)
                continue;
            if ((distanceM * 2 * 100) / drone.maxRangeM > drone.batteryPct - 10)
                continue;
            const now = new Date();
            const mission = await this.missions.save(this.missions.create({
                orderId: order.id,
                droneId: drone.id,
                route,
                distanceM,
                status: MissionStatus.IN_FLIGHT,
                startedAt: now,
                etaAt: new Date(now.getTime() + (distanceM / CRUISE_SPEED_MS) * 1000 + 20_000),
            }));
            drone.status = DroneStatus.IN_FLIGHT;
            drone.lat = merchant.lat;
            drone.lng = merchant.lng;
            drone.altitudeM = 0;
            await this.drones.save(drone);
            this.bus.missionStarted(mission.id);
            return mission;
        }
        throw new ConflictException('Aucun drone disponible (batterie, charge utile ou portée insuffisantes)');
    }
};
MissionsService = __decorate([
    Injectable(),
    __param(0, InjectRepository(Mission)),
    __param(1, InjectRepository(Drone)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        RoutePlannerService,
        FleetBus])
], MissionsService);
export { MissionsService };
//# sourceMappingURL=missions.service.js.map