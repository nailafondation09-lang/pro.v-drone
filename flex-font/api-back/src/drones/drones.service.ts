import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { AuthUser } from '../common/decorators.js';
import {
  DroneStatus,
  InterceptionAction,
  MissionStatus,
  OrderStatus,
  Permission,
  Role,
} from '../common/enums.js';
import { AuditLog, Drone, Interception, Mission, Order, TelemetryPoint } from '../entities/entities.js';
import { MerchantsService } from '../merchants/merchants.service.js';
import { FleetBus } from '../tracking/fleet-bus.js';
import { TrackingGateway } from '../tracking/tracking.gateway.js';

export class CreateDroneDto {
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(3) serial: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsInt() @Min(100) maxPayloadG?: number;
  @IsOptional() @IsInt() @Min(500) maxRangeM?: number;
}

export class UpdateDroneDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsInt() maxPayloadG?: number;
  @IsOptional() @IsInt() maxRangeM?: number;
  @IsOptional() @IsEnum([DroneStatus.IDLE, DroneStatus.MAINTENANCE]) status?: DroneStatus;
}

export class InterceptDto {
  @IsEnum(InterceptionAction) action: InterceptionAction;
  @IsOptional() @IsString() reason?: string;
}

@Injectable()
export class DronesService {
  constructor(
    @InjectRepository(Drone) private drones: Repository<Drone>,
    @InjectRepository(Mission) private missions: Repository<Mission>,
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(Interception) private interceptions: Repository<Interception>,
    @InjectRepository(TelemetryPoint) private telemetry: Repository<TelemetryPoint>,
    @InjectRepository(AuditLog) private audit: Repository<AuditLog>,
    private merchants: MerchantsService,
    private bus: FleetBus,
    private gateway: TrackingGateway,
  ) {}

  async register(userId: string, dto: CreateDroneDto) {
    const m = await this.merchants.forOwner(userId);
    if (await this.drones.exists({ where: { serial: dto.serial } })) throw new ConflictException('Numéro de série déjà enregistré');
    // Le drone démarre à la position du marchand (base).
    return this.drones.save(this.drones.create({ ...dto, merchantId: m.id, lat: m.lat, lng: m.lng }));
  }

  async listMine(userId: string) {
    const m = await this.merchants.forOwner(userId, false);
    return this.drones.find({ where: { merchantId: m.id }, order: { createdAt: 'DESC' } });
  }

  listAll() {
    return this.drones.find({ order: { createdAt: 'DESC' } });
  }

  async update(userId: string, id: string, dto: UpdateDroneDto) {
    const drone = await this.ownedDrone(userId, id);
    if (dto.status && ![DroneStatus.IDLE, DroneStatus.MAINTENANCE].includes(drone.status)) {
      throw new ConflictException('Impossible de changer le statut pendant une mission');
    }
    return this.drones.save(Object.assign(drone, dto));
  }

  /** Fleet en vol (pour le tableau de bord marchand / admin). */
  async activeMissions(merchantId?: string) {
    const missions = await this.missions.find({
      where: { status: In([MissionStatus.IN_FLIGHT, MissionStatus.PLANNED]) },
      relations: { drone: true, order: true },
    });
    return merchantId ? missions.filter((m) => m.drone.merchantId === merchantId) : missions;
  }

  async history(user: AuthUser, droneId: string, limit = 500) {
    if (user.role === Role.MERCHANT) await this.ownedDrone(user.id, droneId);
    return this.telemetry.find({ where: { droneId }, order: { at: 'DESC' }, take: Math.min(limit, 2000) });
  }

  /** Interception d'urgence : retour base, atterrissage immédiat, ou vol stationnaire. */
  async intercept(user: AuthUser, droneId: string, dto: InterceptDto) {
    let drone: Drone;
    if (user.role === Role.ADMIN) {
      if (!user.permissions.includes('*') && !user.permissions.includes(Permission.DRONES_INTERCEPT)) {
        throw new ForbiddenException('Permission manquante');
      }
      const d = await this.drones.findOne({ where: { id: droneId } });
      if (!d) throw new NotFoundException();
      drone = d;
    } else {
      drone = await this.ownedDrone(user.id, droneId);
    }

    const mission = await this.missions.findOne({
      where: { droneId, status: MissionStatus.IN_FLIGHT },
      relations: { order: true },
    });
    if (!mission) throw new ConflictException('Ce drone n\'est pas en mission');

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

    const record = await this.interceptions.save(
      this.interceptions.create({ droneId, missionId: mission.id, byUserId: user.id, action: dto.action, reason: dto.reason }),
    );
    await this.audit.save(
      this.audit.create({ userId: user.id, action: 'drone.intercept', entity: 'drone', entityId: droneId, meta: dto }),
    );

    this.bus.intercept({ droneId, missionId: mission.id, action: dto.action });
    this.gateway.emitMerchant(drone.merchantId, 'interception.executed', { ...record, droneName: drone.name }, mission.orderId);
    return record;
  }

  private async ownedDrone(userId: string, id: string): Promise<Drone> {
    const m = await this.merchants.forOwner(userId);
    const drone = await this.drones.findOne({ where: { id, merchantId: m.id } });
    if (!drone) throw new NotFoundException('Drone introuvable');
    return drone;
  }
}
