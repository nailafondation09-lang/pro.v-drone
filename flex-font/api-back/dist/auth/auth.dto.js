var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsEnum, IsLatitude, IsLongitude, IsOptional, IsString, MinLength } from 'class-validator';
export class RegisterDto {
    email;
    password;
    fullName;
    phone;
    role;
    businessName;
    address;
    lat;
    lng;
}
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    IsString(),
    MinLength(8),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    IsString(),
    MinLength(2),
    __metadata("design:type", String)
], RegisterDto.prototype, "fullName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "phone", void 0);
__decorate([
    IsOptional(),
    IsEnum(['CUSTOMER', 'MERCHANT']),
    __metadata("design:type", String)
], RegisterDto.prototype, "role", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "businessName", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], RegisterDto.prototype, "address", void 0);
__decorate([
    IsOptional(),
    IsLatitude(),
    __metadata("design:type", Number)
], RegisterDto.prototype, "lat", void 0);
__decorate([
    IsOptional(),
    IsLongitude(),
    __metadata("design:type", Number)
], RegisterDto.prototype, "lng", void 0);
export class LoginDto {
    email;
    password;
}
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    IsString(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
export class RefreshDto {
    refreshToken;
}
__decorate([
    IsString(),
    __metadata("design:type", String)
], RefreshDto.prototype, "refreshToken", void 0);
//# sourceMappingURL=auth.dto.js.map