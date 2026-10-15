import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Zone } from '../entities/entities.js';
import { ZoneType } from '../common/enums.js';
import { LatLng, pointInPolygon } from '../common/geo.js';

export class ZoneDto {
  @IsString() name: string;
  @IsEnum(ZoneType) type: ZoneType;
  /** [[lat,lng], ...] — au moins 3 sommets */
  @IsArray() polygon: LatLng[];
  @IsOptional() @IsNumber() minAltM?: number;
  @IsOptional() @IsNumber() maxAltM?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}

@Injectable()
export class ZonesService {
  private cache: Zone[] | null = null;

  constructor(@InjectRepository(Zone) private zones: Repository<Zone>) {}

  async active(): Promise<Zone[]> {
    if (!this.cache) this.cache = await this.zones.find({ where: { active: true } });
    return this.cache;
  }

  list() {
    return this.zones.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: ZoneDto, userId: string) {
    this.validatePolygon(dto.polygon);
    this.cache = null;
    return this.zones.save(this.zones.create({ ...dto, createdById: userId }));
  }

  async update(id: string, dto: Partial<ZoneDto>) {
    const zone = await this.zones.findOne({ where: { id } });
    if (!zone) throw new NotFoundException();
    if (dto.polygon) this.validatePolygon(dto.polygon);
    this.cache = null;
    return this.zones.save(Object.assign(zone, dto));
  }

  async remove(id: string) {
    this.cache = null;
    await this.zones.delete(id);
  }

  /** Zones dans lesquelles se trouve un point (altitude comprise). */
  async zonesAt(p: { lat: number; lng: number; alt: number }): Promise<Zone[]> {
    const zones = await this.active();
    return zones.filter((z) => p.alt >= z.minAltM && p.alt <= z.maxAltM && pointInPolygon(p, z.polygon));
  }

  private validatePolygon(poly: LatLng[]) {
    const ok =
      Array.isArray(poly) &&
      poly.length >= 3 &&
      poly.every((p) => Array.isArray(p) && p.length === 2 && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180);
    if (!ok) throw new NotFoundException('Polygone invalide (≥ 3 sommets [lat,lng])');
  }
}
