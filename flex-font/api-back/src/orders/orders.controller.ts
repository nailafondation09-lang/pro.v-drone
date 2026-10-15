import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { AccessGuard } from '../auth/access.guard.js';
import { type AuthUser, CurrentUser, Roles } from '../common/decorators.js';
import { Role } from '../common/enums.js';
import { CreateOrderDto, OrdersService } from './orders.service.js';

@UseGuards(AccessGuard)
@Controller()
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Roles(Role.CUSTOMER)
  @Post('orders')
  create(@CurrentUser() u: AuthUser, @Body() dto: CreateOrderDto) {
    return this.orders.create(u.id, dto);
  }

  @Roles(Role.CUSTOMER)
  @Get('orders/mine')
  mine(@CurrentUser() u: AuthUser) {
    return this.orders.mine(u.id);
  }

  @Roles(Role.CUSTOMER)
  @Get('orders/:id')
  one(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.getForCustomer(u.id, id);
  }

  @Roles(Role.MERCHANT)
  @Get('merchant/orders')
  merchantOrders(@CurrentUser() u: AuthUser) {
    return this.orders.forMerchant(u.id);
  }

  @Roles(Role.MERCHANT)
  @Post('merchant/orders/:id/accept')
  accept(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.accept(u.id, id);
  }
}
