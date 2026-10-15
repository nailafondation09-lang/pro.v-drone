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
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Merchant, User } from '../entities/entities.js';
import { Role } from '../common/enums.js';
let AuthService = class AuthService {
    users;
    merchants;
    jwt;
    cfg;
    constructor(users, merchants, jwt, cfg) {
        this.users = users;
        this.merchants = merchants;
        this.jwt = jwt;
        this.cfg = cfg;
    }
    async register(dto) {
        const email = dto.email.toLowerCase();
        if (await this.users.exists({ where: { email } }))
            throw new ConflictException('Email déjà utilisé');
        const role = dto.role === 'MERCHANT' ? Role.MERCHANT : Role.CUSTOMER;
        if (role === Role.MERCHANT && (!dto.businessName || dto.lat == null || dto.lng == null)) {
            throw new BadRequestException('businessName, lat et lng sont requis pour un marchand');
        }
        const user = await this.users.save(this.users.create({
            email,
            fullName: dto.fullName,
            phone: dto.phone,
            role,
            passwordHash: await bcrypt.hash(dto.password, 12),
        }));
        if (role === Role.MERCHANT) {
            await this.merchants.save(this.merchants.create({
                ownerId: user.id,
                businessName: dto.businessName,
                address: dto.address,
                lat: dto.lat,
                lng: dto.lng,
            }));
        }
        return this.issueTokens(user);
    }
    async login(dto) {
        const user = await this.users
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.adminGroup', 'g')
            .addSelect('u.passwordHash')
            .where('u.email = :email', { email: dto.email.toLowerCase() })
            .getOne();
        if (!user || !user.isActive || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new UnauthorizedException('Identifiants invalides');
        }
        return this.issueTokens(user);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwt.verifyAsync(refreshToken, { secret: this.cfg.getOrThrow('JWT_REFRESH_SECRET') });
        }
        catch {
            throw new UnauthorizedException();
        }
        const user = await this.users
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.adminGroup', 'g')
            .addSelect('u.refreshTokenHash')
            .where('u.id = :id', { id: payload.sub })
            .getOne();
        if (!user?.refreshTokenHash || !user.isActive || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
            throw new UnauthorizedException();
        }
        return this.issueTokens(user);
    }
    async me(userId) {
        const user = await this.users.findOneOrFail({ where: { id: userId } });
        const merchant = user.role === Role.MERCHANT ? await this.merchants.findOne({ where: { ownerId: user.id } }) : null;
        return { ...this.publicUser(user), merchant };
    }
    async verifyAccessToken(token) {
        const payload = await this.jwt.verifyAsync(token);
        const user = await this.users.findOne({ where: { id: payload.sub } });
        if (!user || !user.isActive)
            throw new UnauthorizedException();
        const merchant = user.role === Role.MERCHANT ? await this.merchants.findOne({ where: { ownerId: user.id } }) : null;
        return { user, merchantId: merchant?.id ?? null };
    }
    publicUser(u) {
        return {
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            role: u.role,
            permissions: u.adminGroup?.permissions ?? [],
        };
    }
    async issueTokens(user) {
        const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
        const refreshToken = await this.jwt.signAsync({ sub: user.id }, { secret: this.cfg.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: '7d' });
        await this.users.update(user.id, { refreshTokenHash: await bcrypt.hash(refreshToken, 10) });
        return { accessToken, refreshToken, user: this.publicUser(user) };
    }
};
AuthService = __decorate([
    Injectable(),
    __param(0, InjectRepository(User)),
    __param(1, InjectRepository(Merchant)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        JwtService,
        ConfigService])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map