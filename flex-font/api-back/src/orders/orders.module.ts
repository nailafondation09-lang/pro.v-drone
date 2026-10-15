import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant, Order, OrderItem, Product } from '../entities/entities.js';
import { MerchantsModule } from '../merchants/merchants.module.js';
import { MissionsModule } from '../missions/missions.module.js';
import { ZonesModule } from '../zones/zones.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, Merchant]), MerchantsModule, MissionsModule, ZonesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
