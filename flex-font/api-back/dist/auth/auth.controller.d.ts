import { AuthService } from './auth.service.js';
import { LoginDto, RefreshDto, RegisterDto } from './auth.dto.js';
import { type AuthUser } from '../common/decorators.js';
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../common/enums.js").Role;
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
            role: import("../common/enums.js").Role;
            permissions: string[];
        };
    }>;
    refresh(dto: RefreshDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import("../common/enums.js").Role;
            permissions: string[];
        };
    }>;
    me(user: AuthUser): Promise<{
        merchant: import("../entities/entities.js").Merchant | null;
        id: string;
        email: string;
        fullName: string;
        role: import("../common/enums.js").Role;
        permissions: string[];
    }>;
}
