import { Repository } from 'typeorm';
import { Zone } from '../entities/entities.js';
import { ZoneType } from '../common/enums.js';
import { LatLng } from '../common/geo.js';
export declare class ZoneDto {
    name: string;
    type: ZoneType;
    polygon: LatLng[];
    minAltM?: number;
    maxAltM?: number;
    active?: boolean;
}
export declare class ZonesService {
    private zones;
    private cache;
    constructor(zones: Repository<Zone>);
    active(): Promise<Zone[]>;
    list(): Promise<Zone[]>;
    create(dto: ZoneDto, userId: string): Promise<Zone>;
    update(id: string, dto: Partial<ZoneDto>): Promise<Zone & Partial<ZoneDto>>;
    remove(id: string): Promise<void>;
    zonesAt(p: {
        lat: number;
        lng: number;
        alt: number;
    }): Promise<Zone[]>;
    private validatePolygon;
}
