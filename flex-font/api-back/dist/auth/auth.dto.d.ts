export declare class RegisterDto {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: 'CUSTOMER' | 'MERCHANT';
    businessName?: string;
    address?: string;
    lat?: number;
    lng?: number;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class RefreshDto {
    refreshToken: string;
}
