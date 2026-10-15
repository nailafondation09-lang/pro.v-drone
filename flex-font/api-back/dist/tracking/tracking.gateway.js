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
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service.js';
import { Role } from '../common/enums.js';
import { Order } from '../entities/entities.js';
let TrackingGateway = class TrackingGateway {
    auth;
    orders;
    logger = new Logger('Tracking');
    server;
    constructor(auth, orders) {
        this.auth = auth;
        this.orders = orders;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ?? '';
            const { user, merchantId } = await this.auth.verifyAccessToken(token);
            client.data.userId = user.id;
            client.data.role = user.role;
            client.data.merchantId = merchantId;
            if (user.role === Role.MERCHANT && merchantId)
                client.join(`merchant:${merchantId}`);
            if (user.role === Role.ADMIN)
                client.join('admin');
        }
        catch {
            client.disconnect(true);
        }
    }
    async subscribeOrder(client, orderId) {
        const order = await this.orders.findOne({ where: { id: orderId } });
        const allowed = order &&
            (order.customerId === client.data.userId ||
                (client.data.role === Role.MERCHANT && order.merchantId === client.data.merchantId) ||
                client.data.role === Role.ADMIN);
        if (!allowed)
            return { ok: false };
        client.join(`order:${orderId}`);
        return { ok: true };
    }
    emitTelemetry(t) {
        const rooms = [`merchant:${t.merchantId}`, 'admin'];
        if (t.orderId)
            rooms.push(`order:${t.orderId}`);
        this.server.to(rooms).emit('drone.telemetry', t);
    }
    emitMerchant(merchantId, event, payload, orderId) {
        const rooms = [`merchant:${merchantId}`, 'admin'];
        if (orderId)
            rooms.push(`order:${orderId}`);
        this.server.to(rooms).emit(event, payload);
    }
};
__decorate([
    WebSocketServer(),
    __metadata("design:type", Server)
], TrackingGateway.prototype, "server", void 0);
__decorate([
    SubscribeMessage('subscribe.order'),
    __param(0, ConnectedSocket()),
    __param(1, MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Socket, String]),
    __metadata("design:returntype", Promise)
], TrackingGateway.prototype, "subscribeOrder", null);
TrackingGateway = __decorate([
    WebSocketGateway({ namespace: '/tracking', cors: { origin: true, credentials: true } }),
    __param(1, InjectRepository(Order)),
    __metadata("design:paramtypes", [AuthService,
        Repository])
], TrackingGateway);
export { TrackingGateway };
//# sourceMappingURL=tracking.gateway.js.map