import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Merchant, User } from '../entities/entities.js';
import { Role } from '../common/enums.js';
import { LoginDto, RegisterDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Merchant) private merchants: Repository<Merchant>,
    private jwt: JwtService,
    private cfg: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    if (await this.users.exists({ where: { email } })) throw new ConflictException('Email déjà utilisé');
    const role = dto.role === 'MERCHANT' ? Role.MERCHANT : Role.CUSTOMER;
    if (role === Role.MERCHANT && (!dto.businessName || dto.lat == null || dto.lng == null)) {
      throw new BadRequestException('businessName, lat et lng sont requis pour un marchand');
    }
    const user = await this.users.save(
      this.users.create({
        email,
        fullName: dto.fullName,
        phone: dto.phone,
        role,
        passwordHash: await bcrypt.hash(dto.password, 12),
      }),
    );
    if (role === Role.MERCHANT) {
      await this.merchants.save(
        this.merchants.create({
          ownerId: user.id,
          businessName: dto.businessName!,
          address: dto.address,
          lat: dto.lat!,
          lng: dto.lng!,
        }),
      );
    }
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
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

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, { secret: this.cfg.getOrThrow('JWT_REFRESH_SECRET') });
    } catch {
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
    return this.issueTokens(user); // rotation : l'ancien refresh token devient invalide
  }

  async me(userId: string) {
    const user = await this.users.findOneOrFail({ where: { id: userId } });
    const merchant = user.role === Role.MERCHANT ? await this.merchants.findOne({ where: { ownerId: user.id } }) : null;
    return { ...this.publicUser(user), merchant };
  }

  /** Vérifie un access token (utilisé par la gateway WebSocket). */
  async verifyAccessToken(token: string) {
    const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException();
    const merchant = user.role === Role.MERCHANT ? await this.merchants.findOne({ where: { ownerId: user.id } }) : null;
    return { user, merchantId: merchant?.id ?? null };
  }

  private publicUser(u: User) {
    return {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role,
      permissions: u.adminGroup?.permissions ?? [],
    };
  }

  private async issueTokens(user: User) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id },
      { secret: this.cfg.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );
    await this.users.update(user.id, { refreshTokenHash: await bcrypt.hash(refreshToken, 10) });
    return { accessToken, refreshToken, user: this.publicUser(user) };
  }
}
