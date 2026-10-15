import { Routes } from '@angular/router';
import { authGuard, permissionGuard, roleGuard } from './core/guards';
import { Shell } from './shared/shell';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login').then((m) => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./features/auth/register').then((m) => m.RegisterPage) },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'pay/mock', loadComponent: () => import('./features/customer/mock-pay').then((m) => m.MockPayPage) },
      {
        path: 'customer',
        canActivate: [roleGuard('CUSTOMER')],
        children: [
          { path: '', loadComponent: () => import('./features/customer/shop').then((m) => m.ShopPage) },
          { path: 'orders', loadComponent: () => import('./features/customer/orders').then((m) => m.OrdersPage) },
          { path: 'orders/:id', loadComponent: () => import('./features/customer/order-tracking').then((m) => m.OrderTrackingPage) },
        ],
      },
      {
        path: 'merchant',
        canActivate: [roleGuard('MERCHANT')],
        children: [
          { path: '', loadComponent: () => import('./features/merchant/fleet').then((m) => m.FleetPage) },
          { path: 'orders', loadComponent: () => import('./features/merchant/orders').then((m) => m.MerchantOrdersPage) },
          { path: 'drones', loadComponent: () => import('./features/merchant/drones').then((m) => m.DronesPage) },
          { path: 'products', loadComponent: () => import('./features/merchant/products').then((m) => m.ProductsPage) },
        ],
      },
      {
        path: 'admin',
        canActivate: [roleGuard('ADMIN')],
        children: [
          { path: '', canActivate: [permissionGuard('fleet.view')], loadComponent: () => import('./features/admin/supervision').then((m) => m.SupervisionPage) },
          { path: 'users', canActivate: [permissionGuard('users.read')], loadComponent: () => import('./features/admin/users').then((m) => m.UsersPage) },
          { path: 'merchants', canActivate: [permissionGuard('merchants.approve')], loadComponent: () => import('./features/admin/merchants').then((m) => m.AdminMerchantsPage) },
          { path: 'zones', canActivate: [permissionGuard('zones.write')], loadComponent: () => import('./features/admin/zones').then((m) => m.ZonesPage) },
          { path: 'groups', canActivate: [permissionGuard('groups.manage')], loadComponent: () => import('./features/admin/groups').then((m) => m.GroupsPage) },
          { path: 'audit', canActivate: [permissionGuard('groups.manage')], loadComponent: () => import('./features/admin/audit').then((m) => m.AuditPage) },
        ],
      },
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/auth/redirect').then((m) => m.RedirectPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
