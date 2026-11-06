import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PendingVendorRegistrationDto, VendorDto, VendorRegistrationData, VendorSuggestionDto } from '../models/vendor.models';

@Injectable({ providedIn: 'root' })
export class VendorsService {
  private base = `${environment.apiBaseUrl}/vendors`;

  constructor(private http: HttpClient) {}

  list(): Observable<VendorDto[]> {
    return this.http.get<VendorDto[]>(this.base);
  }

  suggest(categoryId: number): Observable<VendorSuggestionDto[]> {
    return this.http.get<VendorSuggestionDto[]>(`${this.base}/suggest`, { params: { categoryId } });
  }

  register(body: VendorRegistrationData): Observable<number> {
    return this.http.post<number>(`${this.base}/registrations`, body);
  }

  pendingRegistrations(statusCode: string): Observable<PendingVendorRegistrationDto[]> {
    return this.http.get<PendingVendorRegistrationDto[]>(`${this.base}/registrations`, { params: { statusCode } });
  }

  procurementDecision(id: number, approve: boolean, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.base}/registrations/${id}/procurement-decision`, { approve, reason });
  }

  procurementHodDecision(id: number, approve: boolean, reason?: string): Observable<number | null> {
    return this.http.post<number | null>(`${this.base}/registrations/${id}/procurement-hod-decision`, { approve, reason });
  }

  blacklist(id: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/blacklist`, { reason });
  }
}
