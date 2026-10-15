import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_URL } from './config';
import { AdminGroup, AppUser, Drone, Merchant, Mission, Order, Product, Zone } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private get<T>(path: string) { return firstValueFrom(this.http.get<T>(`${API_URL}${path}`)); }
  private post<T>(path: string, body: unknown = {}) { return firstValueFrom(this.http.post<T>(`${API_URL}${path}`, body)); }
  private patch<T>(path: string, body: unknown) { return firstValueFrom(this.http.patch<T>(`${API_URL}${path}`, body)); }
  private put<T>(path: string, body: unknown) { return firstValueFrom(this.http.put<T>(`${API_URL}${path}`, body)); }
  private del<T>(path: string) { return firstValueFrom(this.http.delete<T>(`${API_URL}${path}`)); }

  // --- client
  merchants() { return this.get<Merchant[]>('/merchants'); }
  productsOf(merchantId: string) { return this.get<Product[]>(`/merchants/${merchantId}/products`); }
  createOrder(body: unknown) { return this.post<Order>('/orders', body); }
  myOrders() { return this.get<Order[]>('/orders/mine'); }
  order(id: string) { return this.get<Order>(`/orders/${id}`); }
  initiatePayment(orderId: string) { return this.post<{ paymentId: string; paymentUrl: string }>(`/payments/orders/${orderId}/initiate`); }
  confirmMockPayment(ref: string) { return this.post(`/payments/mock/${ref}/confirm`); }

  // --- marchand
  myProducts() { return this.get<Product[]>('/merchant/products'); }
  createProduct(body: unknown) { return this.post<Product>('/merchant/products', body); }
  updateProduct(id: string, body: unknown) { return this.patch<Product>(`/merchant/products/${id}`, body); }
  myDrones() { return this.get<Drone[]>('/merchant/drones'); }
  registerDrone(body: unknown) { return this.post<Drone>('/merchant/drones', body); }
  updateDrone(id: string, body: unknown) { return this.patch<Drone>(`/merchant/drones/${id}`, body); }
  merchantOrders() { return this.get<Order[]>('/merchant/orders'); }
  acceptOrder(id: string) { return this.post<{ order: Order; mission: Mission }>(`/merchant/orders/${id}/accept`); }
  rejectOrder(id: string) { return this.post<Order>(`/merchant/orders/${id}/reject`); }
  activeFleet() { return this.get<Mission[]>('/merchant/fleet/active'); }
  intercept(droneId: string, action: 'RETURN_HOME' | 'LAND_NOW' | 'HOVER', reason?: string) {
    return this.post(`/drones/${droneId}/intercept`, { action, reason });
  }

  // --- zones
  zones() { return this.get<Zone[]>('/zones'); }

  // --- admin
  adminZones() { return this.get<Zone[]>('/admin/zones'); }
  createZone(body: unknown) { return this.post<Zone>('/admin/zones', body); }
  updateZone(id: string, body: unknown) { return this.patch<Zone>(`/admin/zones/${id}`, body); }
  deleteZone(id: string) { return this.del(`/admin/zones/${id}`); }
  adminUsers() { return this.get<AppUser[]>('/admin/users'); }
  setUserActive(id: string, isActive: boolean) { return this.patch(`/admin/users/${id}/active`, { isActive }); }
  adminMerchants() { return this.get<Merchant[]>('/admin/merchants'); }
  setMerchantStatus(id: string, status: string) { return this.patch(`/admin/merchants/${id}/status`, { status }); }
  adminDrones() { return this.get<Drone[]>('/admin/drones'); }
  adminFleet() { return this.get<Mission[]>('/admin/fleet/active'); }
  groups() { return this.get<AdminGroup[]>('/admin/groups'); }
  createGroup(body: unknown) { return this.post<AdminGroup>('/admin/groups', body); }
  updateGroup(id: string, body: unknown) { return this.put<AdminGroup>(`/admin/groups/${id}`, body); }
  createAdmin(body: unknown) { return this.post('/admin/admins', body); }
  setAdminGroup(id: string, groupId: string | null) { return this.patch(`/admin/admins/${id}/group`, { groupId }); }
  audit() { return this.get<{ id: string; userId: string | null; action: string; entity: string; entityId: string; at: string }[]>('/admin/audit'); }
}
