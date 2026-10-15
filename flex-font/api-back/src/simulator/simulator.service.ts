import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DroneStatus, InterceptionAction, MissionStatus, OrderStatus, ZoneType } from '../common/enums.js';
import { Waypoint, bearing, haversine } from '../common/geo.js';
import { Drone, Mission, Order, TelemetryPoint } from '../entities/entities.js';
import { FleetBus, InterceptCommand } from '../tracking/fleet-bus.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';
import { ZonesService } from '../zones/zones.service.js';

const TICK_MS = 1000;
const CRUISE_MS = 12; // vitesse horizontale m/s
const VERTICAL_MS = 4; // vitesse verticale m/s
const HOVER_DRAIN_PCT_S = 0.02;

type Mode = 'DELIVERY' | 'RETURN_AFTER_DELIVERY' | 'ABORT_RETURN' | 'LAND_NOW' | 'HOVER';

interface Sim {
  missionId: string;
  droneId: string;
  orderId: string;
  merchantId: string;
  maxRangeM: number;
  route: Waypoint[]; // route courante à parcourir
  originalRoute: Waypoint[];
  idx: number; // index du waypoint cible
  pos: Waypoint;
  mode: Mode;
  modeBeforeHover?: Mode;
  battery: number;
  heading: number;
  speed: number;
  elapsedS: number;
  ticks: number;
  inZones: Set<string>;
  alerted25: boolean;
  alerted15: boolean;
}

/**
 * Source de télémétrie simulée. Pour de vrais drones, remplacer par une passerelle
 * qui publie les mêmes TelemetryEvent (voir TrackingGateway.emitTelemetry).
 */
@Injectable()
export class SimulatorService implements OnModuleInit, OnModuleDestroy {
  private log = new Logger('Simulator');
  private sims = new Map<string, Sim>(); // clé = droneId
  private timer?: NodeJS.Timeout;
  private busy = false;

  constructor(
    @InjectRepository(Mission) private missions: Repository<Mission>,
    @InjectRepository(Drone) private drones: Repository<Drone>,
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(TelemetryPoint) private telemetry: Repository<TelemetryPoint>,
    private bus: FleetBus,
    private gateway: TrackingGateway,
    private zones: ZonesService,
    private cfg: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.cfg.get('SIMULATOR_ENABLED', 'true') !== 'true') return;
    this.bus.on('mission.started', (id: string) => void this.start(id));
    this.bus.on('intercept', (cmd: InterceptCommand) => this.onIntercept(cmd));
    await this.resumeOrphans();
    this.timer = setInterval(() => void this.tick(), TICK_MS);
    this.log.log('Simulateur de drones actif');
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ---------- démarrage / reprise ----------

  private async start(missionId: string) {
    const mission = await this.missions.findOne({ where: { id: missionId }, relations: { drone: true } });
    if (!mission) return;
    this.sims.set(mission.droneId, this.newSim(mission, mission.drone, mission.route, 'DELIVERY'));
  }

  private newSim(mission: Mission, drone: Drone, route: Waypoint[], mode: Mode): Sim {
    return {
      missionId: mission.id,
      droneId: drone.id,
      orderId: mission.orderId,
      merchantId: drone.merchantId,
      maxRangeM: drone.maxRangeM,
      route,
      originalRoute: mission.route,
      idx: 1,
      pos: { ...route[0] },
      mode,
      battery: drone.batteryPct,
      heading: 0,
      speed: 0,
      elapsedS: mission.startedAt ? Math.floor((Date.now() - mission.startedAt.getTime()) / 1000) : 0,
      ticks: 0,
      inZones: new Set(),
      alerted25: drone.batteryPct < 25,
      alerted15: drone.batteryPct < 15,
    };
  }

  private async resumeOrphans() {
    const orphans = await this.missions.find({ where: { status: MissionStatus.IN_FLIGHT }, relations: { drone: true } });
    for (const m of orphans) {
      const d = m.drone;
      const here: Waypoint = { lat: d.lat, lng: d.lng, alt: d.altitudeM };
      let nearest = 0;
      let best = Infinity;
      m.route.forEach((w, i) => {
        const dist = haversine(here, w);
        if (dist < best) {
          best = dist;
          nearest = i;
        }
      });
      const rest = m.route.slice(Math.min(nearest + 1, m.route.length - 1));
      this.sims.set(d.id, this.newSim(m, d, [here, ...rest], 'DELIVERY'));
    }
    if (orphans.length) this.log.log(`${orphans.length} mission(s) reprise(s)`);
  }

  // ---------- interception ----------

  private onIntercept(cmd: InterceptCommand) {
    const sim = this.sims.get(cmd.droneId);
    if (!sim) return;
    switch (cmd.action) {
      case InterceptionAction.HOVER:
        if (sim.mode !== 'HOVER') {
          sim.modeBeforeHover = sim.mode;
          sim.mode = 'HOVER';
        }
        break;
      case InterceptionAction.LAND_NOW:
        sim.mode = 'LAND_NOW';
        break;
      case InterceptionAction.RETURN_HOME: {
        const back = sim.route.slice(0, sim.idx).reverse(); // chemin déjà parcouru, à l'envers
        sim.route = [{ ...sim.pos }, ...back];
        sim.idx = 1;
        sim.mode = 'ABORT_RETURN';
        break;
      }
    }
  }

  // ---------- boucle ----------

  private async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      for (const sim of [...this.sims.values()]) await this.step(sim);
    } catch (e) {
      this.log.error(e);
    } finally {
      this.busy = false;
    }
  }

  private async step(sim: Sim) {
    sim.ticks++;
    sim.elapsedS++;
    const dt = TICK_MS / 1000;
    let moved = 0;

    if (sim.mode === 'HOVER') {
      sim.speed = 0;
      sim.battery = Math.max(0, sim.battery - HOVER_DRAIN_PCT_S * dt);
    } else if (sim.mode === 'LAND_NOW') {
      const d = Math.min(sim.pos.alt, VERTICAL_MS * dt);
      sim.pos.alt -= d;
      moved = d;
      sim.speed = d / dt;
    } else {
      moved = this.advance(sim, dt);
    }
    if (moved > 0) sim.battery = Math.max(0, sim.battery - (moved * 100) / sim.maxRangeM);

    const zones = await this.zones.zonesAt(sim.pos);
    const remainingM = this.remaining(sim);
    this.gateway.emitTelemetry({
      droneId: sim.droneId,
      missionId: sim.missionId,
      orderId: sim.orderId,
      merchantId: sim.merchantId,
      lat: sim.pos.lat,
      lng: sim.pos.lng,
      altitudeM: Math.round(sim.pos.alt * 10) / 10,
      speedMs: Math.round(sim.speed * 10) / 10,
      headingDeg: Math.round(sim.heading),
      batteryPct: Math.round(sim.battery * 10) / 10,
      elapsedS: sim.elapsedS,
      remainingM: Math.round(remainingM),
      etaS: Math.round(remainingM / CRUISE_MS),
      zones: zones.map((z) => ({ id: z.id, name: z.name, type: z.type })),
    });

    this.emitAlerts(sim, zones);

    if (sim.ticks % 3 === 0) {
      await this.telemetry.save(
        this.telemetry.create({
          droneId: sim.droneId,
          missionId: sim.missionId,
          lat: sim.pos.lat,
          lng: sim.pos.lng,
          altitudeM: sim.pos.alt,
          speedMs: sim.speed,
          batteryPct: sim.battery,
        }),
      );
    }
    if (sim.ticks % 5 === 0) await this.persistDrone(sim);

    await this.checkTransitions(sim);
  }

  /** Avance le long de la route ; retourne la distance 3D parcourue. */
  private advance(sim: Sim, dt: number): number {
    let budget = CRUISE_MS * dt;
    let travelled = 0;
    while (budget > 0 && sim.idx < sim.route.length) {
      const target = sim.route[sim.idx];
      const horiz = haversine(sim.pos, target);
      const vert = Math.abs(target.alt - sim.pos.alt);
      const dist = Math.hypot(horiz, vert);
      if (dist < 0.01) {
        sim.idx++;
        continue;
      }
      // une montée/descente pure est plus lente
      const slow = horiz < 1 ? CRUISE_MS / VERTICAL_MS : 1;
      const effective = budget / slow;
      const frac = Math.min(1, effective / dist);
      if (horiz > 1) sim.heading = bearing(sim.pos, target);
      sim.pos = {
        lat: sim.pos.lat + (target.lat - sim.pos.lat) * frac,
        lng: sim.pos.lng + (target.lng - sim.pos.lng) * frac,
        alt: sim.pos.alt + (target.alt - sim.pos.alt) * frac,
      };
      const used = dist * frac;
      travelled += used;
      budget -= used * slow;
      if (frac >= 1) sim.idx++;
    }
    sim.speed = travelled / dt;
    return travelled;
  }

  private remaining(sim: Sim): number {
    if (sim.idx >= sim.route.length) return 0;
    let d = Math.hypot(haversine(sim.pos, sim.route[sim.idx]), sim.route[sim.idx].alt - sim.pos.alt);
    for (let i = sim.idx; i < sim.route.length - 1; i++) {
      d += Math.hypot(haversine(sim.route[i], sim.route[i + 1]), sim.route[i + 1].alt - sim.route[i].alt);
    }
    return d;
  }

  private emitAlerts(sim: Sim, zones: { id: string; name: string; type: ZoneType }[]) {
    const ids = new Set(zones.map((z) => z.id));
    for (const z of zones) {
      if (!sim.inZones.has(z.id)) {
        this.gateway.emitMerchant(
          sim.merchantId,
          'zone.alert',
          { droneId: sim.droneId, missionId: sim.missionId, zone: z, severity: z.type === ZoneType.FORBIDDEN ? 'CRITICAL' : 'WARNING' },
          sim.orderId,
        );
      }
    }
    sim.inZones = ids;

    if (!sim.alerted15 && sim.battery < 15) {
      sim.alerted15 = sim.alerted25 = true;
      this.gateway.emitMerchant(sim.merchantId, 'battery.alert', { droneId: sim.droneId, batteryPct: sim.battery, severity: 'CRITICAL' }, sim.orderId);
    } else if (!sim.alerted25 && sim.battery < 25) {
      sim.alerted25 = true;
      this.gateway.emitMerchant(sim.merchantId, 'battery.alert', { droneId: sim.droneId, batteryPct: sim.battery, severity: 'WARNING' }, sim.orderId);
    }
  }

  private async checkTransitions(sim: Sim) {
    const arrived = sim.idx >= sim.route.length;

    if (sim.mode === 'DELIVERY' && arrived) {
      // Livraison effectuée → on notifie, puis retour à la base par le même chemin.
      const now = new Date();
      await this.missions.update(sim.missionId, { status: MissionStatus.COMPLETED, completedAt: now });
      await this.orders.update(sim.orderId, { status: OrderStatus.DELIVERED });
      await this.drones.update(sim.droneId, { status: DroneStatus.RETURNING });
      this.gateway.emitMerchant(sim.merchantId, 'mission.updated', { missionId: sim.missionId, status: MissionStatus.COMPLETED, orderId: sim.orderId }, sim.orderId);
      sim.route = [...sim.originalRoute].reverse();
      sim.idx = 1;
      sim.mode = 'RETURN_AFTER_DELIVERY';
      return;
    }

    if ((sim.mode === 'RETURN_AFTER_DELIVERY' || sim.mode === 'ABORT_RETURN') && arrived) {
      await this.persistDrone(sim, DroneStatus.IDLE);
      this.sims.delete(sim.droneId);
      return;
    }

    if (sim.mode === 'LAND_NOW' && sim.pos.alt <= 0.01) {
      await this.persistDrone(sim, DroneStatus.EMERGENCY_LANDED);
      this.sims.delete(sim.droneId);
      return;
    }

    if (sim.battery <= 0 && sim.mode !== 'LAND_NOW') sim.mode = 'LAND_NOW'; // batterie vide : atterrissage forcé
  }

  private async persistDrone(sim: Sim, status?: DroneStatus) {
    const patch: Partial<Drone> = {
      lat: sim.pos.lat,
      lng: sim.pos.lng,
      altitudeM: sim.pos.alt,
      speedMs: sim.speed,
      headingDeg: sim.heading,
      batteryPct: sim.battery,
      lastSeenAt: new Date(),
    };
    if (status) patch.status = status;
    await this.drones.update(sim.droneId, patch);
  }
}
