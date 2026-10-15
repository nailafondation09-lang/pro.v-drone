import { type AuthUser } from '../common/decorators.js';
import { ZoneDto, ZonesService } from './zones.service.js';
declare const UpdateZoneDto_base: import("@nestjs/mapped-types").MappedType<Partial<ZoneDto>>;
declare class UpdateZoneDto extends UpdateZoneDto_base {
}
export declare class ZonesController {
    private zones;
    constructor(zones: ZonesService);
    active(): Promise<import("../entities/entities.js").Zone[]>;
    all(): Promise<import("../entities/entities.js").Zone[]>;
    create(dto: ZoneDto, u: AuthUser): Promise<import("../entities/entities.js").Zone>;
    update(id: string, dto: UpdateZoneDto): Promise<import("../entities/entities.js").Zone & Partial<ZoneDto>>;
    remove(id: string): Promise<void>;
}
export {};
