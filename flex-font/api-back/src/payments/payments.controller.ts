import { Body, Controller, Headers, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AccessGuard } from '../auth/access.guard.js';
import { type AuthUser, CurrentUser, Roles } from '../common/decorators.js';
import { Role } from '../common/enums.js';
import { OrdersService } from '../orders/orders.service.js';
import { PaymentsService } from './payments.service.js';

@Controller()
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private orders: OrdersService,
  ) {}

  @UseGuards(AccessGuard)
  @Roles(Role.CUSTOMER)
  @Post('payments/orders/:id/initiate')
  initiate(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.payments.initiate(u.id, id);
  }

  /** Appelé par le fournisseur (pas de JWT) : authentifié par signature. */
  @SkipThrottle()
  @HttpCode(200)
  @Post('payments/webhook')
  webhook(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    return this.payments.handleWebhook(headers, body);
  }

  @UseGuards(AccessGuard)
  @Roles(Role.CUSTOMER)
  @Post('payments/mock/:ref/confirm')
  confirmMock(@CurrentUser() u: AuthUser, @Param('ref') ref: string) {
    return this.payments.confirmMock(u.id, ref);
  }

  // Le refus d'une commande déclenche le remboursement : la route vit ici pour éviter une dépendance circulaire.
  @UseGuards(AccessGuard)
  @Roles(Role.MERCHANT)
  @Post('merchant/orders/:id/reject')
  reject(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.orders.reject(u.id, id, (orderId) => this.payments.refundOrder(orderId));
  }
}
