import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DroneStatus, MissionStatus } from '../common/enums.js';
import { Drone, Merchant, Mission, Order } from '../entities/entities.js';
import { FleetBus } from '../tracking/fleet-bus.js';
import { RoutePlannerService } from './route-planner.service.js';

const CRUISE_SPEED_MS = 12;
const MIN_BATTERY_PCT = 30;

@Injectable()
export class MissionsService {
  constructor(
    @InjectRepository(Mission) private missions: Repository<Mission>,
    @InjectRepository(Drone) private drones: Repository<Drone>,
    private planner: RoutePlannerService,
    private bus: FleetBus,
  ) {}

  forOrder(orderId: string) {
    return this.missions.findOne({ where: { orderId }, order: { createdAt: 'DESC' } });
  }

  /** Choisit le meilleur drone libre (assez de batterie, de portée et de charge utile) puis lance la mission. */
  async createAndStart(order: Order, merchant: Merchant): Promise<Mission> {
    const candidates = await this.drones.find({ where: { merchantId: merchant.id, status: DroneStatus.IDLE } });
    const dest = { lat: order.deliveryLat, lng: order.deliveryLng };

    for (const drone of candidates.sort((a, b) => b.batteryPct - a.batteryPct)) {
      if (drone.batteryPct < MIN_BATTERY_PCT || drone.maxPayloadG < order.totalWeightG) continue;
      const route = await this.planner.plan({ lat: merchant.lat, lng: merchant.lng }, dest);
      const distanceM = RoutePlannerService.routeLength(route);
      if (distanceM * 2 > drone.maxRangeM) continue; // aller-retour
      // consommation estimée : 100 % pour maxRange mètres
      if ((distanceM * 2 * 100) / drone.maxRangeM > drone.batteryPct - 10) continue;

      const now = new Date();
      const mission = await this.missions.save(
        this.missions.create({
          orderId: order.id,
          droneId: drone.id,
          route,
          distanceM,
          status: MissionStatus.IN_FLIGHT,
          startedAt: now,
          etaAt: new Date(now.getTime() + (distanceM / CRUISE_SPEED_MS) * 1000 + 20_000),
        }),
      );
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
}
