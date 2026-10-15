# DroneShip

Livraison par drones : **clients** (commande, paiement, suivi), **marchands** (flotte, 3D, zones, batterie, validation, interception) et **administrateurs** organisés en groupes avec permissions.

Stack : Angular 21 · NestJS 12 + TypeORM · PostgreSQL · CesiumJS · Socket.IO.
Conception détaillée : [ARCHITECTURE.md](./ARCHITECTURE.md).

## Démarrage

```bash
# 1. Base de données
docker compose up -d db

# 2. Backend (http://localhost:3000/api)
cd backend
cp .env.example .env      # puis changez les secrets et ADMIN_PASSWORD
npm install
npm run start:dev

# 3. Frontend (http://localhost:4200)
cd ../frontend
npm install
npm start
```

Au premier lancement, un administrateur est créé avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` (voir `backend/.env`).
Le simulateur de drones est actif par défaut (`SIMULATOR_ENABLED=true`) : aucun drone réel n'est nécessaire pour tester.

## Test de bout en bout

API démarrée :

```bash
cd backend
ADMIN_PASSWORD='<votre mot de passe admin>' node scripts/smoke.mjs
```

Couvre : rôles, zones interdites, commande, paiement, acceptation, vol avec contournement de zone, interception, retour base, batterie, télémétrie, remboursement.

## Parcours par rôle

| Rôle | Pages |
|---|---|
| Client | `/customer` catalogue et commande · `/customer/orders` suivi (carte, chrono) · paiement simulé `/pay/mock` |
| Marchand | `/merchant` flotte en 3D, chrono, batterie, alertes de zones, interception · `/merchant/orders` validation · `/merchant/drones` · `/merchant/products` |
| Admin | `/admin` supervision globale · `/admin/users` · `/admin/merchants` (approbation) · `/admin/zones` · `/admin/groups` · `/admin/audit` |

Un marchand doit être **approuvé par un admin** avant de pouvoir enregistrer des drones.

## À faire avant la production

- Remplacer `MockProvider` par un vrai fournisseur de paiement (`backend/src/payments/providers.ts`).
- Désactiver `DB_SYNCHRONIZE` et utiliser des migrations TypeORM.
- Remplacer les secrets JWT et le mot de passe admin ; restreindre `FRONTEND_URL` (CORS).
- Les URLs de l'API sont codées dans `frontend/src/app/core/config.ts` : à externaliser par environnement.
- Remplacer le simulateur par une passerelle de vrais drones (MAVLink) publiant la même forme de télémétrie.
- Le planificateur de trajectoire fait un détour simple autour des zones ; prévoir un A\* 3D pour des cas complexes.
