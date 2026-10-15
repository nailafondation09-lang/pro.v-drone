import { type AuthUser } from '../common/decorators.js';
import { MerchantStatus } from '../common/enums.js';
import { MerchantsService, ProductDto } from './merchants.service.js';
declare const UpdateProductDto_base: import("@nestjs/mapped-types").MappedType<Partial<ProductDto>>;
declare class UpdateProductDto extends UpdateProductDto_base {
}
declare class StatusDto {
    status: MerchantStatus;
}
export declare class MerchantsController {
    private svc;
    constructor(svc: MerchantsService);
    list(): Promise<import("../entities/entities.js").Merchant[]>;
    products(id: string): Promise<import("../entities/entities.js").Product[]>;
    myProducts(u: AuthUser): Promise<import("../entities/entities.js").Product[]>;
    create(u: AuthUser, dto: ProductDto): Promise<import("../entities/entities.js").Product>;
    update(u: AuthUser, id: string, dto: UpdateProductDto): Promise<import("../entities/entities.js").Product & Partial<ProductDto>>;
    all(): Promise<import("../entities/entities.js").Merchant[]>;
    setStatus(id: string, dto: StatusDto): Promise<import("../entities/entities.js").Merchant>;
}
export {};
