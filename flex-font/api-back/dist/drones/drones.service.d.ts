import { Repository } from 'typeorm';
import { AuthUser } from '../common/decorators.js';
import { DroneStatus, InterceptionAction } from '../common/enums.js';
import { AuditLog, Drone, Interception, Mission, Order, TelemetryPoint } from '../entities/entities.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { FleetBus } from '../tracking/fleet-bus.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';
export declare class CreateDroneDto {
    name: string;
    serial: string;
    model?: string;
    maxPayloadG?: number;
    maxRangeM?: number;
}
export declare class UpdateDroneDto {
    name?: string;
    model?: string;
    maxPayloadG?: number;
    maxRangeM?: number;
    status?: DroneStatus;
}
export declare class InterceptDto {
    action: InterceptionAction;
    reason?: string;
}
export declare class DronesService {
    private drones;
    private missions;
    private orders;
    private interceptions;
    private telemetry;
    private audit;
    private merchants;
    private bus;
    private gateway;
    constructor(drones: Repository<Drone>, missions: Repository<Mission>, orders: Repository<Order>, interceptions: Repository<Interception>, telemetry: Repository<TelemetryPoint>, audit: Repository<AuditLog>, merchants: MerchantsService, bus: FleetBus, gateway: TrackingGateway);
    register(userId: string, dto: CreateDroneDto): Promise<Drone>;
    listMine(userId: string): Promise<Drone[]>;
    listAll(): Promise<Drone[]>;
    update(userId: string, id: string, dto: UpdateDroneDto): Promise<Drone & UpdateDroneDto>;
    activeMissions(merchantId?: string): Promise<Mission[]>;
    history(user: AuthUser, droneId: string, limit?: number): Promise<TelemetryPoint[]>;
    intercept(user: AuthUser, droneId: string, dto: InterceptDto): Promise<Interception>;
    private ownedDrone;
}
