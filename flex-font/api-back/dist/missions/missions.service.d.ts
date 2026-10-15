import { Repository } from 'typeorm';
import { Drone, Merchant, Mission, Order } from '../entities/entities.js';
import { FleetBus } from '../tracking/fleet-bus.js';
import { RoutePlannerService } from './route-planner.service.js';
export declare class MissionsService {
    private missions;
    private drones;
    private planner;
    private bus;
    constructor(missions: Repository<Mission>, drones: Repository<Drone>, planner: RoutePlannerService, bus: FleetBus);
    forOrder(orderId: string): Promise<Mission | null>;
    createAndStart(order: Order, merchant: Merchant): Promise<Mission>;
}
