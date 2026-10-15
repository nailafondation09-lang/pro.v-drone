import { ZonesService } from '../zones/zones.service.js';
import { Waypoint } from '../common/geo.js';
export declare class RoutePlannerService {
    private zones;
    constructor(zones: ZonesService);
    plan(from: {
        lat: number;
        lng: number;
    }, to: {
        lat: number;
        lng: number;
    }): Promise<Waypoint[]>;
    static routeLength(route: Waypoint[]): number;
    private bestDetour;
}
