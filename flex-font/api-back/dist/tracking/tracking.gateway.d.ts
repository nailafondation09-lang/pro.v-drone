import { OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service.js';
import { Order } from '../entities/entities.js';
export interface TelemetryEvent {
    droneId: string;
    missionId: string | null;
    orderId: string | null;
    merchantId: string;
    lat: number;
    lng: number;
    altitudeM: number;
    speedMs: number;
    headingDeg: number;
    batteryPct: number;
    elapsedS: number;
    etaS: number;
    remainingM: number;
    zones: {
        id: string;
        name: string;
        type: string;
    }[];
}
export declare class TrackingGateway implements OnGatewayConnection {
    private auth;
    private orders;
    private logger;
    server: Server;
    constructor(auth: AuthService, orders: Repository<Order>);
    handleConnection(client: Socket): Promise<void>;
    subscribeOrder(client: Socket, orderId: string): Promise<{
        ok: boolean;
    }>;
    emitTelemetry(t: TelemetryEvent): void;
    emitMerchant(merchantId: string, event: string, payload: unknown, orderId?: string | null): void;
}
