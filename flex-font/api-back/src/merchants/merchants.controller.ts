import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { AccessGuard } from '../auth/access.guard.js';
import { type AuthUser, CurrentUser, Permissions, Roles } from '../common/decorators.js';
import { MerchantStatus, Permission, Role } from '../common/enums.js';
import { MerchantsService, ProductDto } from './merchants.service.js';

class UpdateProductDto extends PartialType(ProductDto) {}
class StatusDto {
  @IsEnum(MerchantStatus) status: MerchantStatus;
}

@UseGuards(AccessGuard)
@Controller()
export class MerchantsController {
  constructor(private svc: MerchantsService) {}

  @Get('merchants')
  list() {
    return this.svc.listPublic();
  }

  @Get('merchants/:id/products')
  products(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.productsOf(id);
  }

  @Roles(Role.MERCHANT)
  @Get('merchant/products')
  async myProducts(@CurrentUser() u: AuthUser) {
    const m = await this.svc.forOwner(u.id, false);
    return this.svc.productsOf(m.id, false);
  }

  @Roles(Role.MERCHANT)
  @Post('merchant/products')
  create(@CurrentUser() u: AuthUser, @Body() dto: ProductDto) {
    return this.svc.createProduct(u.id, dto);
  }

  @Roles(Role.MERCHANT)
  @Patch('merchant/products/:id')
  update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.svc.updateProduct(u.id, id, dto);
  }

  @Roles(Role.ADMIN)
  @Permissions(Permission.MERCHANTS_APPROVE)
  @Get('admin/merchants')
  all() {
    return this.svc.listAll();
  }

  @Roles(Role.ADMIN)
  @Permissions(Permission.MERCHANTS_APPROVE)
  @Patch('admin/merchants/:id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StatusDto) {
    return this.svc.setStatus(id, dto.status);
  }
}
