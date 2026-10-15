import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminGroup, AuditLog, User } from '../entities/entities.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, AdminGroup, AuditLog])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
