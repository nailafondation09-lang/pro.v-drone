import { IsEmail, IsEnum, IsLatitude, IsLongitude, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() @MinLength(2) fullName: string;
  @IsOptional() @IsString() phone?: string;
  /** Les inscriptions publiques sont limitées à CUSTOMER ou MERCHANT. */
  @IsOptional() @IsEnum(['CUSTOMER', 'MERCHANT']) role?: 'CUSTOMER' | 'MERCHANT';
  // Champs marchand
  @IsOptional() @IsString() businessName?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsLatitude() lat?: number;
  @IsOptional() @IsLongitude() lng?: number;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

export class RefreshDto {
  @IsString() refreshToken: string;
}
