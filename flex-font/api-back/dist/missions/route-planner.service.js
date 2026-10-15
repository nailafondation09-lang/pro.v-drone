var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { ZonesService } from '../zones/zones.service.js';
import { centroid, haversine, segmentCrossesPolygon } from '../common/geo.js';
import { ZoneType } from '../common/enums.js';
const CRUISE_ALT_M = 60;
let RoutePlannerService = class RoutePlannerService {
    zones;
    constructor(zones) {
        this.zones = zones;
    }
    async plan(from, to) {
        const forbidden = (await this.zones.active()).filter((z) => z.type === ZoneType.FORBIDDEN && z.minAltM <= CRUISE_ALT_M);
        let path = [[from.lat, from.lng], [to.lat, to.lng]];
        for (let guard = 0; guard < 5; guard++) {
            let changed = false;
            const next = [path[0]];
            for (let i = 0; i < path.length - 1; i++) {
                const a = path[i];
                const b = path[i + 1];
                const blocking = forbidden.find((z) => segmentCrossesPolygon(a, b, z.polygon));
                if (blocking) {
                    next.push(this.bestDetour(a, b, blocking.polygon));
                    changed = true;
                }
                next.push(b);
            }
            path = next;
            if (!changed)
                break;
        }
        const route = [{ lat: path[0][0], lng: path[0][1], alt: 0 }];
        path.forEach((p) => route.push({ lat: p[0], lng: p[1], alt: CRUISE_ALT_M }));
        const last = path[path.length - 1];
        route.push({ lat: last[0], lng: last[1], alt: 0 });
        return route;
    }
    static routeLength(route) {
        let d = 0;
        for (let i = 0; i < route.length - 1; i++)
            d += haversine(route[i], route[i + 1]);
        return d;
    }
    bestDetour(a, b, poly) {
        const c = centroid(poly);
        const candidates = poly.map((v) => [c[0] + (v[0] - c[0]) * 1.2, c[1] + (v[1] - c[1]) * 1.2]);
        const cost = (v) => haversine({ lat: a[0], lng: a[1] }, { lat: v[0], lng: v[1] }) +
            haversine({ lat: v[0], lng: v[1] }, { lat: b[0], lng: b[1] });
        return candidates.sort((x, y) => cost(x) - cost(y))[0];
    }
};
RoutePlannerService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ZonesService])
], RoutePlannerService);
export { RoutePlannerService };
//# sourceMappingURL=route-planner.service.js.map