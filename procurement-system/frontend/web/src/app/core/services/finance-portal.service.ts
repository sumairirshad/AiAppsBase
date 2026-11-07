import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinancePortalService {
  private base = `${environment.apiBaseUrl}/finance-portal`;

  constructor(private http: HttpClient) {}

  /** Dev-only convenience standing in for the real, external Finance Portal. */
  simulatePayment(invoiceId: number, partialAmount?: number): Observable<unknown> {
    const params: Record<string, number> = {};
    if (partialAmount) params['partialAmount'] = partialAmount;
    return this.http.post(`${this.base}/simulate/${invoiceId}`, {}, { params });
  }
}
