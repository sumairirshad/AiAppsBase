import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddQuotationRequest, SelectQuoteRequest } from '../models/sourcing.models';

@Injectable({ providedIn: 'root' })
export class SourcingService {
  private base = `${environment.apiBaseUrl}/sourcing`;

  constructor(private http: HttpClient) {}

  acceptAndGroup(prId: number): Observable<number[]> {
    return this.http.post<number[]>(`${this.base}/pr/${prId}/accept`, {});
  }

  addQuotation(groupId: number, body: AddQuotationRequest): Observable<number> {
    return this.http.post<number>(`${this.base}/groups/${groupId}/quotations`, body);
  }

  selectQuote(groupId: number, body: SelectQuoteRequest): Observable<unknown> {
    return this.http.post(`${this.base}/groups/${groupId}/select`, body);
  }

  overrideVendor(prLineId: number, newVendorId: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/lines/${prLineId}/override-vendor`, { newVendorId, reason });
  }
}
