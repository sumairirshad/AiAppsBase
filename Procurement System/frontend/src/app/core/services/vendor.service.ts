import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RegisterVendorRequest, Vendor, VendorRegistrationRequest } from '../models';

const base = `${environment.apiUrl}/vendors`;

@Injectable({ providedIn: 'root' })
export class VendorService {
  constructor(private http: HttpClient) {}

  list(categoryId?: number, approvedOnly = true): Observable<Vendor[]> {
    let url = `${base}?approvedOnly=${approvedOnly}`;
    if (categoryId) url += `&categoryId=${categoryId}`;
    return this.http.get<Vendor[]>(url);
  }

  blacklist(vendorId: number, reason: string): Observable<void> {
    return this.http.post<void>(`${base}/${vendorId}/blacklist`, { reason });
  }

  register(request: RegisterVendorRequest): Observable<number> {
    return this.http.post<number>(`${base}/registrations`, request);
  }

  listRegistrations(status?: string): Observable<VendorRegistrationRequest[]> {
    const url = status ? `${base}/registrations?status=${status}` : `${base}/registrations`;
    return this.http.get<VendorRegistrationRequest[]>(url);
  }

  procurementDecision(requestId: number, approve: boolean, reason: string): Observable<void> {
    return this.http.post<void>(`${base}/registrations/${requestId}/procurement-decision`, { approve, reason });
  }

  procurementHodDecision(requestId: number, approve: boolean, reason: string): Observable<void> {
    return this.http.post<void>(`${base}/registrations/${requestId}/procurement-hod-decision`, { approve, reason });
  }
}
