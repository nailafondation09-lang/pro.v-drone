import { Injectable } from '@nestjs/common';
import { ZonesService } from '../zones/zones.service.js';
import { LatLng, Waypoint, centroid, haversine, segmentCrossesPolygon } from '../common/geo.js';
import { ZoneType } from '../common/enums.js';

const CRUISE_ALT_M = 60;

/**
 * Planificateur simple : décollage → croisière → atterrissage, en contournant
 * les zones interdites par les sommets élargis de leur polygone (MVP).
 * À remplacer par un A* 3D / visibility graph pour la production.
 */
@Injectable()
export class RoutePlannerService {
  constructor(private zones: ZonesService) {}

  async plan(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<Waypoint[]> {
    const forbidden = (await this.zones.active()).filter((z) => z.type === ZoneType.FORBIDDEN && z.minAltM <= CRUISE_ALT_M);
    let path: LatLng[] = [[from.lat, from.lng], [to.lat, to.lng]];

    for (let guard = 0; guard < 5; guard++) {
      let changed = false;
      const next: LatLng[] = [path[0]];
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
      if (!changed) break;
    }

    const route: Waypoint[] = [{ lat: path[0][0], lng: path[0][1], alt: 0 }];
    path.forEach((p) => route.push({ lat: p[0], lng: p[1], alt: CRUISE_ALT_M }));
    const last = path[path.length - 1];
    route.push({ lat: last[0], lng: last[1], alt: 0 });
    return route;
  }

  static routeLength(route: Waypoint[]): number {
    let d = 0;
    for (let i = 0; i < route.length - 1; i++) d += haversine(route[i], route[i + 1]);
    return d;
  }

  private bestDetour(a: LatLng, b: LatLng, poly: LatLng[]): LatLng {
    const c = centroid(poly);
    // sommets repoussés de 20 % hors du polygone
    const candidates = poly.map((v): LatLng => [c[0] + (v[0] - c[0]) * 1.2, c[1] + (v[1] - c[1]) * 1.2]);
    const cost = (v: LatLng) =>
      haversine({ lat: a[0], lng: a[1] }, { lat: v[0], lng: v[1] }) +
      haversine({ lat: v[0], lng: v[1] }, { lat: b[0], lng: b[1] });
    return candidates.sort((x, y) => cost(x) - cost(y))[0];
  }
}
