export declare enum Role {
    CUSTOMER = "CUSTOMER",
    MERCHANT = "MERCHANT",
    ADMIN = "ADMIN"
}
export declare enum Permission {
    USERS_READ = "users.read",
    USERS_BAN = "users.ban",
    MERCHANTS_APPROVE = "merchants.approve",
    ZONES_WRITE = "zones.write",
    DRONES_INTERCEPT = "drones.intercept",
    GROUPS_MANAGE = "groups.manage",
    FLEET_VIEW = "fleet.view"
}
export declare enum MerchantStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    SUSPENDED = "SUSPENDED"
}
export declare enum OrderStatus {
    PENDING_PAYMENT = "PENDING_PAYMENT",
    PAID = "PAID",
    AWAITING_MERCHANT = "AWAITING_MERCHANT",
    ACCEPTED = "ACCEPTED",
    DRONE_ASSIGNED = "DRONE_ASSIGNED",
    IN_FLIGHT = "IN_FLIGHT",
    DELIVERED = "DELIVERED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED",
    INTERCEPTED = "INTERCEPTED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
export declare enum DroneStatus {
    IDLE = "IDLE",
    ASSIGNED = "ASSIGNED",
    IN_FLIGHT = "IN_FLIGHT",
    HOVERING = "HOVERING",
    RETURNING = "RETURNING",
    EMERGENCY_LANDED = "EMERGENCY_LANDED",
    MAINTENANCE = "MAINTENANCE",
    OFFLINE = "OFFLINE"
}
export declare enum MissionStatus {
    PLANNED = "PLANNED",
    IN_FLIGHT = "IN_FLIGHT",
    COMPLETED = "COMPLETED",
    INTERCEPTED = "INTERCEPTED",
    FAILED = "FAILED"
}
export declare enum ZoneType {
    FORBIDDEN = "FORBIDDEN",
    DANGEROUS = "DANGEROUS"
}
export declare enum InterceptionAction {
    RETURN_HOME = "RETURN_HOME",
    LAND_NOW = "LAND_NOW",
    HOVER = "HOVER"
}
