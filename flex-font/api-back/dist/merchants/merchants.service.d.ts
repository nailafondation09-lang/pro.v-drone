import { Repository } from 'typeorm';
import { Merchant, Product } from '../entities/entities.js';
import { MerchantStatus } from '../common/enums.js';
export declare class ProductDto {
    name: string;
    priceXof: number;
    weightG?: number;
    available?: boolean;
}
export declare class MerchantsService {
    private merchants;
    private products;
    constructor(merchants: Repository<Merchant>, products: Repository<Product>);
    forOwner(userId: string, requireApproved?: boolean): Promise<Merchant>;
    listPublic(): Promise<Merchant[]>;
    productsOf(merchantId: string, onlyAvailable?: boolean): Promise<Product[]>;
    createProduct(userId: string, dto: ProductDto): Promise<Product>;
    updateProduct(userId: string, id: string, dto: Partial<ProductDto>): Promise<Product & Partial<ProductDto>>;
    listAll(): Promise<Merchant[]>;
    setStatus(id: string, status: MerchantStatus): Promise<Merchant>;
}
