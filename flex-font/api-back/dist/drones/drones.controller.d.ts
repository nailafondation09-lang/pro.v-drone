import { type AuthUser } from '../common/decorators.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { CreateDroneDto, DronesService, InterceptDto, UpdateDroneDto } from './drones.service.js';
export declare class DronesController {
    private drones;
    private merchants;
    constructor(drones: DronesService, merchants: MerchantsService);
    register(u: AuthUser, dto: CreateDroneDto): Promise<import("../entities/entities.js").Drone>;
    mine(u: AuthUser): Promise<import("../entities/entities.js").Drone[]>;
    update(u: AuthUser, id: string, dto: UpdateDroneDto): Promise<import("../entities/entities.js").Drone & UpdateDroneDto>;
    activeMine(u: AuthUser): Promise<import("../entities/entities.js").Mission[]>;
    all(): Promise<import("../entities/entities.js").Drone[]>;
    activeAll(): Promise<import("../entities/entities.js").Mission[]>;
    history(u: AuthUser, id: string, limit?: string): Promise<import("../entities/entities.js").TelemetryPoint[]>;
    intercept(u: AuthUser, id: string, dto: InterceptDto): Promise<import("../entities/entities.js").Interception>;
}
