import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { Socket, io } from 'socket.io-client';
import { AuthService } from './auth.service';
import { WS_URL } from './config';
import { AlertItem, Telemetry } from './models';

/** Flux temps réel : télémétrie par drone, alertes et événements de commandes. */
@Injectable({ providedIn: 'root' })
export class TrackingService implements OnDestroy {
  private auth = inject(AuthService);
  private socket: Socket | null = null;
  private alertId = 0;

  readonly telemetry = signal<Record<string, Telemetry>>({});
  readonly alerts = signal<AlertItem[]>([]);
  readonly connected = signal(false);
  /** Incrémenté à chaque événement de commande / mission (pour recharger les listes). */
  readonly orderEvents = signal(0);

  connect() {
    if (this.socket || !this.auth.token()) return;
    const s = io(WS_URL, { auth: (cb) => cb({ token: this.auth.token() }), transports: ['websocket'] });
    this.socket = s;
    s.on('connect', () => this.connected.set(true));
    s.on('disconnect', () => this.connected.set(false));

    s.on('drone.telemetry', (t: Telemetry) => this.telemetry.update((m) => ({ ...m, [t.droneId]: t })));
    s.on('zone.alert', (e: { droneId: string; zone: { name: string; type: string }; severity: 'WARNING' | 'CRITICAL' }) =>
      this.pushAlert('zone', e.severity, `Zone ${e.zone.type === 'FORBIDDEN' ? 'INTERDITE' : 'dangereuse'} : ${e.zone.name}`, e.droneId));
    s.on('battery.alert', (e: { droneId: string; batteryPct: number; severity: 'WARNING' | 'CRITICAL' }) =>
      this.pushAlert('battery', e.severity, `Batterie faible : ${Math.round(e.batteryPct)} %`, e.droneId));
    s.on('interception.executed', (e: { droneId: string; droneName: string; action: string }) =>
      this.pushAlert('interception', 'INFO', `Interception ${e.action} sur ${e.droneName}`, e.droneId));
    for (const ev of ['order.new', 'order.updated', 'mission.updated']) s.on(ev, () => this.orderEvents.update((n) => n + 1));
  }

  /** Abonnement au suivi d'une commande précise (client). */
  subscribeOrder(orderId: string) {
    this.connect();
    const send = () => this.socket?.emit('subscribe.order', orderId);
    if (this.socket?.connected) send();
    else this.socket?.once('connect', send);
  }

  clearAlerts() {
    this.alerts.set([]);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
    this.telemetry.set({});
  }

  ngOnDestroy() {
    this.disconnect();
  }

  private pushAlert(kind: AlertItem['kind'], severity: AlertItem['severity'], message: string, droneId?: string) {
    this.alerts.update((a) => [{ id: ++this.alertId, at: Date.now(), kind, severity, message, droneId }, ...a].slice(0, 50));
  }
}
