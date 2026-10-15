import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Merchant, User } from '../entities/entities.js';
import { Role } from '../common/enums.js';
import { LoginDto, RegisterDto } from './auth.dto.js';
export declare class AuthService {
    private users;
    private merchants;
    private jwt;
    private cfg;
    constructor(users: Repository<User>, merchants: Repository<Merchant>, jwt: JwtService, cfg: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: Role;
            permissions: string[];
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: Role;
            permissions: string[];
        };
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: Role;
            permissions: string[];
        };
    }>;
    me(userId: string): Promise<{
        merchant: Merchant | null;
        id: string;
        email: string;
        fullName: string;
        role: Role;
        permissions: string[];
    }>;
    verifyAccessToken(token: string): Promise<{
        user: User;
        merchantId: string | null;
    }>;
    private publicUser;
    private issueTokens;
}
