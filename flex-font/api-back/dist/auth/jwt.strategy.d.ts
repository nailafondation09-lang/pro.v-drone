import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities/entities.js';
import { AuthUser } from '../common/decorators.js';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private users;
    constructor(cfg: ConfigService, users: Repository<User>);
    validate(payload: {
        sub: string;
    }): Promise<AuthUser>;
}
export {};
