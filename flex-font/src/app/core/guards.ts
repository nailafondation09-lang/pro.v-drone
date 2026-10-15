import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).parseUrl('/login');
};

/** Autorise uniquement le rôle demandé ; sinon redirige vers l'espace de l'utilisateur. */
export const roleGuard = (role: Role): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return router.parseUrl('/login');
  return auth.hasRole(role) ? true : router.parseUrl(auth.homeFor(auth.user()?.role));
};

export const permissionGuard = (perm: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  return auth.hasPermission(perm) ? true : inject(Router).parseUrl('/admin');
};
