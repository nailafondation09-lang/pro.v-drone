import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service.js';
import { Role } from '../common/enums.js';
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
  zones: { id: string; name: string; type: string }[];
}

@WebSocketGateway({ namespace: '/tracking', cors: { origin: true, credentials: true } })
export class TrackingGateway implements OnGatewayConnection {
  private logger = new Logger('Tracking');
  @WebSocketServer() server: Server;

  constructor(
    private auth: AuthService,
    @InjectRepository(Order) private orders: Repository<Order>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token as string) ?? '';
      const { user, merchantId } = await this.auth.verifyAccessToken(token);
      client.data.userId = user.id;
      client.data.role = user.role;
      client.data.merchantId = merchantId;
      if (user.role === Role.MERCHANT && merchantId) client.join(`merchant:${merchantId}`);
      if (user.role === Role.ADMIN) client.join('admin');
    } catch {
      client.disconnect(true);
    }
  }

  /** Un client s'abonne au suivi d'UNE de ses commandes. */
  @SubscribeMessage('subscribe.order')
  async subscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() orderId: string) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    const allowed =
      order &&
      (order.customerId === client.data.userId ||
        (client.data.role === Role.MERCHANT && order.merchantId === client.data.merchantId) ||
        client.data.role === Role.ADMIN);
    if (!allowed) return { ok: false };
    client.join(`order:${orderId}`);
    return { ok: true };
  }

  emitTelemetry(t: TelemetryEvent) {
    const rooms = [`merchant:${t.merchantId}`, 'admin'];
    if (t.orderId) rooms.push(`order:${t.orderId}`);
    this.server.to(rooms).emit('drone.telemetry', t);
  }

  emitMerchant(merchantId: string, event: string, payload: unknown, orderId?: string | null) {
    const rooms = [`merchant:${merchantId}`, 'admin'];
    if (orderId) rooms.push(`order:${orderId}`);
    this.server.to(rooms).emit(event, payload);
  }
}
