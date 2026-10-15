// Test de bout en bout : node scripts/smoke.mjs  (API sur http://localhost:3000, simulateur actif)
const API = process.env.API ?? 'http://localhost:3000/api';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = Date.now();

async function call(method, path, token, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text}`);
  return json;
}
const ok = (label, cond, extra = '') => {
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label} ${extra}`);
  if (!cond) process.exitCode = 1;
};

const BASE = { lat: 6.1725, lng: 1.2314 }; // Lomé
const off = (dLat, dLng) => ({ lat: BASE.lat + dLat, lng: BASE.lng + dLng });

// --- comptes
const admin = await call('POST', '/auth/login', null, { email: process.env.ADMIN_EMAIL ?? 'admin@droneship.local', password: process.env.ADMIN_PASSWORD ?? 'DevAdmin-2026-Pass!' });
const cust = await call('POST', '/auth/register', null, { email: `c${stamp}@t.io`, password: 'Password123!', fullName: 'Client Test' });
const merch = await call('POST', '/auth/register', null, { email: `m${stamp}@t.io`, password: 'Password123!', fullName: 'Marchand Test', role: 'MERCHANT', businessName: 'Boutique Test', ...BASE });
ok('inscription client + marchand', !!cust.accessToken && !!merch.accessToken);

// --- sécurité des rôles
try { await call('GET', '/admin/users', cust.accessToken); ok('client bloqué sur /admin', false); } catch { ok('client bloqué sur /admin', true); }
try { await call('POST', '/merchant/drones', merch.accessToken, { name: 'D', serial: 'S' + stamp }); ok('marchand non approuvé bloqué', false); } catch { ok('marchand non approuvé bloqué', true); }
try { await call('POST', '/auth/register', null, { email: `x${stamp}@t.io`, password: 'Password123!', fullName: 'X', role: 'ADMIN' }); ok('auto-inscription ADMIN refusée', false); } catch { ok('auto-inscription ADMIN refusée', true); }

// --- admin approuve le marchand
const merchants = await call('GET', '/admin/merchants', admin.accessToken);
const myMerchant = merchants.find((m) => m.businessName === 'Boutique Test' && m.ownerId === merch.user.id);
await call('PATCH', `/admin/merchants/${myMerchant.id}/status`, admin.accessToken, { status: 'APPROVED' });

// --- catalogue + drones
const product = await call('POST', '/merchant/products', merch.accessToken, { name: 'Paracétamol', priceXof: 1500, weightG: 200 });
const drone = await call('POST', '/merchant/drones', merch.accessToken, { name: 'Alpha', serial: 'SN-' + stamp, maxRangeM: 20000 });
ok('drone enregistré', drone.status === 'IDLE');

// --- zone interdite entre la base et la destination -> la route doit contourner
const dest = off(0.0036, 0.0);
const zone = await call('POST', '/admin/zones', admin.accessToken, {
  name: 'Hôpital (test)', type: 'FORBIDDEN', minAltM: 0, maxAltM: 300,
  polygon: [[BASE.lat + 0.0015, BASE.lng - 0.0006], [BASE.lat + 0.0015, BASE.lng + 0.0006], [BASE.lat + 0.0021, BASE.lng + 0.0006], [BASE.lat + 0.0021, BASE.lng - 0.0006]],
});
// livraison DANS une zone interdite -> refusée
try { await call('POST', '/orders', cust.accessToken, { merchantId: myMerchant.id, items: [{ productId: product.id, quantity: 1 }], deliveryLat: BASE.lat + 0.0018, deliveryLng: BASE.lng }); ok('livraison en zone interdite refusée', false); } catch { ok('livraison en zone interdite refusée', true); }

// --- commande -> paiement -> acceptation
const order = await call('POST', '/orders', cust.accessToken, { merchantId: myMerchant.id, items: [{ productId: product.id, quantity: 2 }], deliveryLat: dest.lat, deliveryLng: dest.lng, deliveryAddress: 'Test' });
ok('total calculé côté serveur', order.totalXof === 3000, `(${order.totalXof})`);
const pay = await call('POST', `/payments/orders/${order.id}/initiate`, cust.accessToken);
const ref = new URL(pay.paymentUrl).searchParams.get('ref');
await call('POST', `/payments/mock/${ref}/confirm`, cust.accessToken);
await call('POST', `/payments/mock/${ref}/confirm`, cust.accessToken); // idempotent
let o = await call('GET', `/orders/${order.id}`, cust.accessToken);
ok('commande payée -> AWAITING_MERCHANT', o.status === 'AWAITING_MERCHANT', o.status);

const accepted = await call('POST', `/merchant/orders/${order.id}/accept`, merch.accessToken);
const straight = 400; // ~ distance directe (m)
ok('route contourne la zone interdite', accepted.mission.route.length > 4 && accepted.mission.distanceM > straight, `(${Math.round(accepted.mission.distanceM)} m, ${accepted.mission.route.length} points)`);

// --- interception : stationnaire puis retour base
await sleep(5000);
const missions = await call('GET', '/merchant/fleet/active', merch.accessToken);
ok('mission visible dans la flotte active', missions.length === 1);
await call('POST', `/drones/${drone.id}/intercept`, merch.accessToken, { action: 'HOVER', reason: 'test' });
await sleep(2500);
let d = (await call('GET', '/merchant/drones', merch.accessToken))[0];
ok('drone en vol stationnaire', d.status === 'HOVERING', d.status);
await call('POST', `/drones/${drone.id}/intercept`, merch.accessToken, { action: 'RETURN_HOME', reason: 'test' });
o = await call('GET', `/orders/${order.id}`, cust.accessToken);
ok('commande INTERCEPTED', o.status === 'INTERCEPTED', o.status);

for (let i = 0; i < 40; i++) {
  await sleep(2000);
  d = (await call('GET', '/merchant/drones', merch.accessToken))[0];
  if (d.status === 'IDLE') break;
}
ok('drone revenu à la base (IDLE)', d.status === 'IDLE', `${d.status} batterie=${Math.round(d.batteryPct)}%`);
ok('batterie consommée', d.batteryPct < 100);
const hist = await call('GET', `/drones/${drone.id}/telemetry?limit=50`, merch.accessToken);
ok('télémétrie historisée', hist.length > 3, `(${hist.length} points)`);
const audit = await call('GET', '/admin/audit', admin.accessToken);
ok('interceptions journalisées', audit.filter((a) => a.action === 'drone.intercept').length >= 2);

// --- livraison complète
await call('DELETE', `/admin/zones/${zone.id}`, admin.accessToken);
const order2 = await call('POST', '/orders', cust.accessToken, { merchantId: myMerchant.id, items: [{ productId: product.id, quantity: 1 }], deliveryLat: BASE.lat + 0.0013, deliveryLng: BASE.lng });
const pay2 = await call('POST', `/payments/orders/${order2.id}/initiate`, cust.accessToken);
await call('POST', `/payments/mock/${new URL(pay2.paymentUrl).searchParams.get('ref')}/confirm`, cust.accessToken);
await call('POST', `/merchant/orders/${order2.id}/accept`, merch.accessToken);
let status = '';
for (let i = 0; i < 40 && status !== 'DELIVERED'; i++) {
  await sleep(2000);
  status = (await call('GET', `/orders/${order2.id}`, cust.accessToken)).status;
}
ok('colis livré (DELIVERED)', status === 'DELIVERED', status);

// --- refus + remboursement
for (let i = 0; i < 40; i++) {
  d = (await call('GET', '/merchant/drones', merch.accessToken))[0];
  if (d.status === 'IDLE') break;
  await sleep(2000);
}
const order3 = await call('POST', '/orders', cust.accessToken, { merchantId: myMerchant.id, items: [{ productId: product.id, quantity: 1 }], deliveryLat: BASE.lat + 0.001, deliveryLng: BASE.lng });
const pay3 = await call('POST', `/payments/orders/${order3.id}/initiate`, cust.accessToken);
await call('POST', `/payments/mock/${new URL(pay3.paymentUrl).searchParams.get('ref')}/confirm`, cust.accessToken);
await call('POST', `/merchant/orders/${order3.id}/reject`, merch.accessToken);
ok('refus -> REFUNDED', (await call('GET', `/orders/${order3.id}`, cust.accessToken)).status === 'REFUNDED');

console.log(process.exitCode ? '\nÉCHEC' : '\nTOUS LES TESTS PASSENT');
