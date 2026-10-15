# DroneShip — Architecture

Plateforme de livraison par drones : clients, marchands et administrateurs.
Stack : **Angular** (frontend) · **NestJS + TypeORM** (backend) · **PostgreSQL** (+ PostGIS optionnel) · **CesiumJS** (3D) · **Socket.IO** (temps réel) · **Flutterwave / CinetPay** (Mobile Money).

## 1. Rôles et permissions

| Rôle | Capacités |
|---|---|
| `CUSTOMER` | Parcourir les marchands/produits, passer une commande, payer, suivre son colis (carte + 3D + chrono) |
| `MERCHANT` | Enregistrer ses drones, voir la flotte en temps réel (position, chrono, batterie, zones), valider/refuser les commandes, **intercepter** un drone en urgence (retour base / atterrissage forcé) |
| `ADMIN` | Gérer les utilisateurs, marchands, groupes ; définir les zones interdites/dangereuses ; superviser toute la flotte ; intercepter n'importe quel drone ; audit |
| `ADMIN_GROUP` (groupe admin) | Les administrateurs sont organisés en groupes (ex. « Supervision », « Support », « Conformité ») portant des permissions fines |

Le contrôle d'accès combine :
- `@Roles(...)` pour le rôle de base,
- `@Permissions(...)` pour les permissions des groupes d'admin (ex. `zones.write`, `drones.intercept`, `users.ban`).

## 2. Modules backend (NestJS)

```
src/
  auth/            JWT (access + refresh), inscription, login, guards Roles/Permissions
  users/           Utilisateurs, profil
  merchants/       Profil marchand, validation par admin
  admin/           Groupes d'admins, permissions, audit
  orders/          Cycle de vie des commandes
  payments/        Initiation + webhook Mobile Money (Flutterwave/CinetPay), idempotence
  drones/          Enregistrement, état, batterie, commandes d'interception
  missions/        Mission = commande + drone + trajectoire planifiée + chrono
  zones/           Zones interdites / dangereuses (polygones + altitude min/max)
  tracking/        Gateway WebSocket, historique de télémétrie
  simulator/       Simulateur de drones (télémétrie réaliste)
  common/          Décorateurs, filtres, utilitaires géo
```

### Cycle de vie d'une commande
`PENDING_PAYMENT → PAID → AWAITING_MERCHANT → ACCEPTED → DRONE_ASSIGNED → IN_FLIGHT → DELIVERED`
Branches : `REJECTED`, `CANCELLED`, `INTERCEPTED`, `FAILED`, `REFUNDED`.

### Cycle de vie d'un drone
`IDLE → ASSIGNED → TAKING_OFF → IN_FLIGHT → LANDING → IDLE`, plus `RETURNING`, `EMERGENCY_LANDED`, `MAINTENANCE`, `OFFLINE`.

## 3. Modèle de données (TypeORM / PostgreSQL)

```
User(id, email, passwordHash, fullName, phone, role, adminGroupId?, isActive)
AdminGroup(id, name, permissions text[])
Merchant(id, ownerId→User, businessName, address, lat, lng, status[PENDING|APPROVED|SUSPENDED])
Product(id, merchantId, name, priceXof, weightG, available)
Drone(id, merchantId, name, serial, model, maxPayloadG, maxRangeM, status,
      batteryPct, lat, lng, altitudeM, speedMs, headingDeg, lastSeenAt)
Order(id, customerId, merchantId, status, totalXof, deliveryLat, deliveryLng, deliveryAddress, createdAt)
OrderItem(id, orderId, productId, quantity, unitPriceXof)
Payment(id, orderId, provider, providerRef, amountXof, status, rawPayload, createdAt)
Mission(id, orderId, droneId, status, route jsonb[lat,lng,alt], startedAt, etaAt, completedAt, distanceM)
Zone(id, name, type[FORBIDDEN|DANGEROUS], polygon jsonb[[lat,lng]], minAltM, maxAltM, active, createdById)
TelemetryPoint(id, droneId, missionId?, lat, lng, altitudeM, speedMs, batteryPct, at)   -- index (droneId, at)
Interception(id, droneId, missionId, byUserId, action[RETURN_HOME|LAND_NOW|HOVER], reason, at)
AuditLog(id, userId, action, entity, entityId, meta jsonb, at)
```

> Évolution possible : PostGIS (`geography(Polygon)`) pour les requêtes spatiales à grande échelle. Le squelette utilise jsonb + calcul point-dans-polygone côté serveur pour rester simple.

## 4. API REST (extraits)

```
POST /auth/register          POST /auth/login          POST /auth/refresh      GET /auth/me
GET  /merchants              GET  /merchants/:id/products
POST /orders                 GET  /orders/mine         GET  /orders/:id
POST /payments/orders/:id/initiate      POST /payments/webhook/:provider
GET  /merchant/orders        POST /merchant/orders/:id/accept | /reject
POST /merchant/drones        GET  /merchant/drones     PATCH /merchant/drones/:id
POST /merchant/drones/:id/intercept     { action, reason }
GET  /zones                  POST /admin/zones         PATCH/DELETE /admin/zones/:id
GET  /admin/users            PATCH /admin/users/:id/status
POST /admin/groups           PATCH /admin/groups/:id
```

## 5. Temps réel (Socket.IO, namespace `/tracking`)

- Authentification JWT au handshake.
- Salles : `order:{id}` (client), `merchant:{id}` (marchand), `admin` (supervision).
- Événements serveur → client : `drone.telemetry`, `mission.updated`, `zone.alert`, `battery.alert`, `interception.executed`.
- Chaque `drone.telemetry` : `{droneId, missionId, lat, lng, altitudeM, speedMs, batteryPct, elapsedS, etaS, inZone?}`.

## 6. Alertes zones et batterie

À chaque point de télémétrie, le serveur :
1. teste la position (et l'altitude) contre toutes les zones actives → `zone.alert` (`DANGEROUS` = avertissement, `FORBIDDEN` = alerte critique + suggestion d'interception) ;
2. compare la batterie à la distance restante → `battery.alert` (< 25 % avertissement, < 15 % critique, ou autonomie insuffisante pour rentrer).

La **planification de trajectoire** contourne les zones interdites (voir `missions/route-planner.service.ts` : détour simple par sommets de polygone ; à remplacer par A* 3D en production).

## 7. Simulateur

`SimulatorService` fait avancer chaque drone `IN_FLIGHT` le long de sa route (tick 1 s), décharge la batterie en fonction de la distance, enregistre la télémétrie et émet les événements. Activé par `SIMULATOR_ENABLED=true`. Les drones réels remplaceront cette source par une passerelle MAVLink publiant la même forme de message.

## 8. Paiement (Mobile Money)

1. `POST /payments/orders/:id/initiate` crée un `Payment` `PENDING` et renvoie l'URL de paiement hébergée du fournisseur.
2. Le fournisseur appelle `POST /payments/webhook/:provider` ; on **vérifie la signature**, on revérifie la transaction côté API fournisseur, puis on passe `Payment → SUCCESS` et `Order → PAID → AWAITING_MERCHANT` (idempotent via `providerRef` unique).
3. Si le marchand refuse : remboursement (`REFUNDED`).

Le squelette fournit une interface `PaymentProvider` avec une implémentation `MockProvider` (par défaut) et un emplacement `FlutterwaveProvider` à compléter avec vos clés.

## 9. Frontend (Angular)

```
app/
  core/        AuthService, JWT interceptor, guards par rôle, SocketService
  shared/      composants UI, pipes (chrono, batterie)
  features/
    auth/      login, register
    customer/  catalogue, panier/commande, paiement, suivi (carte + chrono)
    merchant/  dashboard flotte, drones (CRUD), commandes, supervision 3D, interception
    admin/     utilisateurs, groupes & permissions, zones (éditeur), supervision globale
  features/shared-3d/  CesiumViewerComponent (drones, trajectoires, zones en volume)
```

Routes protégées par `roleGuard` ; lazy loading par rôle. La vue 3D (CesiumJS) affiche : le globe, la trajectoire planifiée et parcourue, le drone orienté, les zones (rouge = interdites, orange = dangereuses) extrudées entre `minAltM` et `maxAltM`.

## 10. Sécurité

- Mots de passe : argon2/bcrypt ; JWT court (15 min) + refresh token rotatif.
- `class-validator` sur tous les DTO, `helmet`, CORS restreint, rate limiting (`@nestjs/throttler`).
- Vérification d'appartenance : un marchand n'accède qu'à ses drones/commandes ; un client qu'à ses commandes.
- Interception : double confirmation côté UI, journalisée dans `Interception` + `AuditLog`.
- Webhooks : signature + idempotence. Aucune clé en dur (`.env`).
- Migrations TypeORM en production (`synchronize: false`).

## 11. Feuille de route suggérée

1. Auth + rôles + groupes admin  
2. Marchands, produits, drones (CRUD)  
3. Commandes + paiement  
4. Missions + simulateur + tracking temps réel  
5. Zones + alertes + planification de route  
6. Vue 3D + interception  
7. Intégration drones réels (MAVLink), PostGIS, A* 3D, notifications SMS/push
