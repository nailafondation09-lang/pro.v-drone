export type Role = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export type LatLng = [number, number];
export interface Waypoint { lat: number; lng: number; alt: number }

export interface Merchant { id: string; businessName: string; address?: string; lat: number; lng: number; status?: string; ownerId?: string }
export interface Product { id: string; merchantId: string; name: string; priceXof: number; weightG: number; available: boolean }

export type DroneStatus = 'IDLE' | 'ASSIGNED' | 'IN_FLIGHT' | 'HOVERING' | 'RETURNING' | 'EMERGENCY_LANDED' | 'MAINTENANCE' | 'OFFLINE';
export interface Drone {
  id: string; merchantId: string; name: string; serial: string; model?: string;
  maxPayloadG: number; maxRangeM: number; status: DroneStatus; batteryPct: number;
  lat: number; lng: number; altitudeM: number; speedMs: number; headingDeg: number;
}

export type OrderStatus =
  | 'PENDING_PAYMENT' | 'PAID' | 'AWAITING_MERCHANT' | 'ACCEPTED' | 'DRONE_ASSIGNED' | 'IN_FLIGHT'
  | 'DELIVERED' | 'REJECTED' | 'CANCELLED' | 'INTERCEPTED' | 'FAILED' | 'REFUNDED';

export interface OrderItem { id: string; productId: string; quantity: number; unitPriceXof: number; product?: Product }
export interface Order {
  id: string; status: OrderStatus; totalXof: number; deliveryLat: number; deliveryLng: number;
  deliveryAddress?: string; createdAt: string; merchantId: string; items: OrderItem[]; mission?: Mission | null;
}

export interface Mission {
  id: string; orderId: string; droneId: string; status: string; route: Waypoint[];
  distanceM: number; startedAt: string | null; etaAt: string | null; drone?: Drone; order?: Order;
}

export interface Zone {
  id: string; name: string; type: 'FORBIDDEN' | 'DANGEROUS'; polygon: LatLng[];
  minAltM: number; maxAltM: number; active: boolean;
}

export interface Telemetry {
  droneId: string; missionId: string | null; orderId: string | null; merchantId: string;
  lat: number; lng: number; altitudeM: number; speedMs: number; headingDeg: number;
  batteryPct: number; elapsedS: number; etaS: number; remainingM: number;
  zones: { id: string; name: string; type: string }[];
}

export interface AlertItem {
  id: number; at: number; kind: 'zone' | 'battery' | 'interception';
  severity: 'WARNING' | 'CRITICAL' | 'INFO'; message: string; droneId?: string;
}

export interface AdminGroup { id: string; name: string; permissions: string[]; members?: { id: string; email: string; fullName: string }[] }
export interface AppUser { id: string; email: string; fullName: string; role: Role; isActive: boolean; createdAt: string; adminGroup?: AdminGroup | null }

export const ALL_PERMISSIONS: { key: string; label: string }[] = [
  { key: 'users.read', label: 'Voir les utilisateurs' },
  { key: 'users.ban', label: 'Suspendre / réactiver des utilisateurs' },
  { key: 'merchants.approve', label: 'Approuver les marchands' },
  { key: 'zones.write', label: 'Gérer les zones interdites/dangereuses' },
  { key: 'drones.intercept', label: 'Intercepter n\'importe quel drone' },
  { key: 'groups.manage', label: 'Gérer les groupes et administrateurs' },
  { key: 'fleet.view', label: 'Superviser toute la flotte' },
];
