import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './config';
import { AuthResponse, Role, SessionUser } from './models';

const KEY = 'droneship.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private state = signal<{ accessToken: string; refreshToken: string; user: SessionUser } | null>(this.load());
  readonly user = computed(() => this.state()?.user ?? null);
  readonly token = computed(() => this.state()?.accessToken ?? null);
  readonly isLoggedIn = computed(() => !!this.state());

  private refreshing: Promise<boolean> | null = null;

  hasRole(role: Role) {
    return this.user()?.role === role;
  }

  hasPermission(p: string) {
    const perms = this.user()?.permissions ?? [];
    return perms.includes('*') || perms.includes(p);
  }

  homeFor(role: Role | undefined) {
    return role === 'ADMIN' ? '/admin' : role === 'MERCHANT' ? '/merchant' : '/customer';
  }

  async login(email: string, password: string) {
    const res = await firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/auth/login`, { email, password }));
    this.setSession(res);
    return res.user;
  }

  async register(payload: Record<string, unknown>) {
    const res = await firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/auth/register`, payload));
    this.setSession(res);
    return res.user;
  }

  /** Rafraîchit le jeton (appels concurrents mutualisés). */
  refresh(): Promise<boolean> {
    if (this.refreshing) return this.refreshing;
    const current = this.state();
    if (!current) return Promise.resolve(false);
    this.refreshing = firstValueFrom(this.http.post<AuthResponse>(`${API_URL}/auth/refresh`, { refreshToken: current.refreshToken }))
      .then((res) => {
        this.setSession(res);
        return true;
      })
      .catch(() => {
        this.logout();
        return false;
      })
      .finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  logout() {
    this.state.set(null);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    void this.router.navigateByUrl('/login');
  }

  private setSession(res: AuthResponse) {
    this.state.set(res);
    try { localStorage.setItem(KEY, JSON.stringify(res)); } catch { /* ignore */ }
  }

  private load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }
}
