import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Merchant, Product } from '../entities/entities.js';
import { MerchantStatus } from '../common/enums.js';

export class ProductDto {
  @IsString() name: string;
  @IsInt() @Min(0) priceXof: number;
  @IsOptional() @IsInt() @Min(1) weightG?: number;
  @IsOptional() @IsBoolean() available?: boolean;
}

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant) private merchants: Repository<Merchant>,
    @InjectRepository(Product) private products: Repository<Product>,
  ) {}

  /** Le marchand lié à un utilisateur (doit être approuvé pour opérer). */
  async forOwner(userId: string, requireApproved = true): Promise<Merchant> {
    const m = await this.merchants.findOne({ where: { ownerId: userId } });
    if (!m) throw new NotFoundException('Profil marchand introuvable');
    if (requireApproved && m.status !== MerchantStatus.APPROVED) {
      throw new ForbiddenException('Votre compte marchand n\'est pas encore approuvé');
    }
    return m;
  }

  listPublic() {
    return this.merchants.find({ where: { status: MerchantStatus.APPROVED }, select: { id: true, businessName: true, address: true, lat: true, lng: true } });
  }

  productsOf(merchantId: string, onlyAvailable = true) {
    return this.products.find({ where: { merchantId, ...(onlyAvailable ? { available: true } : {}) } });
  }

  async createProduct(userId: string, dto: ProductDto) {
    const m = await this.forOwner(userId);
    return this.products.save(this.products.create({ ...dto, merchantId: m.id }));
  }

  async updateProduct(userId: string, id: string, dto: Partial<ProductDto>) {
    const m = await this.forOwner(userId);
    const p = await this.products.findOne({ where: { id, merchantId: m.id } });
    if (!p) throw new NotFoundException();
    return this.products.save(Object.assign(p, dto));
  }

  // --- administration ---
  listAll() {
    return this.merchants.find({ order: { createdAt: 'DESC' } });
  }

  async setStatus(id: string, status: MerchantStatus) {
    const m = await this.merchants.findOne({ where: { id } });
    if (!m) throw new NotFoundException();
    m.status = status;
    return this.merchants.save(m);
  }
}
