var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/entities.js';
let JwtStrategy = class JwtStrategy extends PassportStrategy(Strategy) {
    users;
    constructor(cfg, users) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: cfg.getOrThrow('JWT_SECRET'),
        });
        this.users = users;
    }
    async validate(payload) {
        const user = await this.users.findOne({ where: { id: payload.sub } });
        if (!user || !user.isActive)
            throw new UnauthorizedException();
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            permissions: user.adminGroup?.permissions ?? [],
        };
    }
};
JwtStrategy = __decorate([
    Injectable(),
    __param(1, InjectRepository(User)),
    __metadata("design:paramtypes", [ConfigService, Repository])
], JwtStrategy);
export { JwtStrategy };
//# sourceMappingURL=jwt.strategy.js.map