import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FinalCostResult {
  variancePct: number;
  outcome: 'ProcurementAdjusted' | 'PendingHodApproval' | 'ReturnedToRequestor' | string;
  finalPoId: number | null;
}

@Injectable({ providedIn: 'root' })
export class TentativeService {
  private base = `${environment.apiBaseUrl}/tentative`;

  constructor(private http: HttpClient) {}

  createManualPo(prId: number, vendorId: number, estimatedTotal: number, advanceTypeCode?: string, advanceAmount?: number): Observable<number> {
    return this.http.post<number>(`${this.base}/pr/${prId}/manual-po`, { vendorId, estimatedTotal, advanceTypeCode, advanceAmount });
  }

  enterFinalCost(prId: number, manualPoId: number, finalAmount: number): Observable<FinalCostResult> {
    return this.http.post<FinalCostResult>(`${this.base}/pr/${prId}/final-cost`, { manualPoId, finalAmount });
  }

  approveVariance(prId: number): Observable<number> {
    return this.http.post<number>(`${this.base}/pr/${prId}/approve-variance`, {});
  }
}
