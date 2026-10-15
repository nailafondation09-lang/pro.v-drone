import { Pipe, PipeTransform } from '@angular/core';

/** 125 -> "02:05" ; 3725 -> "1:02:05" */
export function formatChrono(totalSeconds: number | null | undefined): string {
  const s = Math.max(0, Math.floor(totalSeconds ?? 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

@Pipe({ name: 'chrono' })
export class ChronoPipe implements PipeTransform {
  transform(v: number | null | undefined) { return formatChrono(v); }
}

@Pipe({ name: 'xof' })
export class XofPipe implements PipeTransform {
  transform(v: number | null | undefined) { return `${new Intl.NumberFormat('fr-FR').format(v ?? 0)} FCFA`; }
}

const ORDER_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'En attente de paiement', PAID: 'Payée', AWAITING_MERCHANT: 'En attente du marchand',
  ACCEPTED: 'Acceptée', DRONE_ASSIGNED: 'Drone assigné', IN_FLIGHT: 'En vol', DELIVERED: 'Livrée',
  REJECTED: 'Refusée', CANCELLED: 'Annulée', INTERCEPTED: 'Interceptée', FAILED: 'Échec', REFUNDED: 'Remboursée',
};
const DRONE_LABELS: Record<string, string> = {
  IDLE: 'Disponible', ASSIGNED: 'Assigné', IN_FLIGHT: 'En vol', HOVERING: 'Stationnaire', RETURNING: 'Retour base',
  EMERGENCY_LANDED: 'Atterrissage d\'urgence', MAINTENANCE: 'Maintenance', OFFLINE: 'Hors ligne',
};

@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(v: string | null | undefined) { return (v && (ORDER_LABELS[v] ?? DRONE_LABELS[v])) || v || ''; }
}

export function statusClass(v: string): string {
  if (['DELIVERED', 'IDLE', 'IN_FLIGHT', 'APPROVED'].includes(v)) return 'ok';
  if (['REJECTED', 'FAILED', 'INTERCEPTED', 'EMERGENCY_LANDED', 'SUSPENDED', 'REFUNDED', 'CANCELLED'].includes(v)) return 'bad';
  return 'warn';
}
