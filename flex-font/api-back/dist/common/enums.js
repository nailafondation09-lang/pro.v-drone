export var Role;
(function (Role) {
    Role["CUSTOMER"] = "CUSTOMER";
    Role["MERCHANT"] = "MERCHANT";
    Role["ADMIN"] = "ADMIN";
})(Role || (Role = {}));
export var Permission;
(function (Permission) {
    Permission["USERS_READ"] = "users.read";
    Permission["USERS_BAN"] = "users.ban";
    Permission["MERCHANTS_APPROVE"] = "merchants.approve";
    Permission["ZONES_WRITE"] = "zones.write";
    Permission["DRONES_INTERCEPT"] = "drones.intercept";
    Permission["GROUPS_MANAGE"] = "groups.manage";
    Permission["FLEET_VIEW"] = "fleet.view";
})(Permission || (Permission = {}));
export var MerchantStatus;
(function (MerchantStatus) {
    MerchantStatus["PENDING"] = "PENDING";
    MerchantStatus["APPROVED"] = "APPROVED";
    MerchantStatus["SUSPENDED"] = "SUSPENDED";
})(MerchantStatus || (MerchantStatus = {}));
export var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING_PAYMENT"] = "PENDING_PAYMENT";
    OrderStatus["PAID"] = "PAID";
    OrderStatus["AWAITING_MERCHANT"] = "AWAITING_MERCHANT";
    OrderStatus["ACCEPTED"] = "ACCEPTED";
    OrderStatus["DRONE_ASSIGNED"] = "DRONE_ASSIGNED";
    OrderStatus["IN_FLIGHT"] = "IN_FLIGHT";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["REJECTED"] = "REJECTED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["INTERCEPTED"] = "INTERCEPTED";
    OrderStatus["FAILED"] = "FAILED";
    OrderStatus["REFUNDED"] = "REFUNDED";
})(OrderStatus || (OrderStatus = {}));
export var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["SUCCESS"] = "SUCCESS";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (PaymentStatus = {}));
export var DroneStatus;
(function (DroneStatus) {
    DroneStatus["IDLE"] = "IDLE";
    DroneStatus["ASSIGNED"] = "ASSIGNED";
    DroneStatus["IN_FLIGHT"] = "IN_FLIGHT";
    DroneStatus["HOVERING"] = "HOVERING";
    DroneStatus["RETURNING"] = "RETURNING";
    DroneStatus["EMERGENCY_LANDED"] = "EMERGENCY_LANDED";
    DroneStatus["MAINTENANCE"] = "MAINTENANCE";
    DroneStatus["OFFLINE"] = "OFFLINE";
})(DroneStatus || (DroneStatus = {}));
export var MissionStatus;
(function (MissionStatus) {
    MissionStatus["PLANNED"] = "PLANNED";
    MissionStatus["IN_FLIGHT"] = "IN_FLIGHT";
    MissionStatus["COMPLETED"] = "COMPLETED";
    MissionStatus["INTERCEPTED"] = "INTERCEPTED";
    MissionStatus["FAILED"] = "FAILED";
})(MissionStatus || (MissionStatus = {}));
export var ZoneType;
(function (ZoneType) {
    ZoneType["FORBIDDEN"] = "FORBIDDEN";
    ZoneType["DANGEROUS"] = "DANGEROUS";
})(ZoneType || (ZoneType = {}));
export var InterceptionAction;
(function (InterceptionAction) {
    InterceptionAction["RETURN_HOME"] = "RETURN_HOME";
    InterceptionAction["LAND_NOW"] = "LAND_NOW";
    InterceptionAction["HOVER"] = "HOVER";
})(InterceptionAction || (InterceptionAction = {}));
//# sourceMappingURL=enums.js.map