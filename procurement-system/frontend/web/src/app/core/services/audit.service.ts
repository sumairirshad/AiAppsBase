import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubmitPrResult } from '../models/requisition.models';

export interface BillHistoryDto {
  currentAmount: number;
  lastYearAmounts: number[];
  average: number | null;
  looksUnusual: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private base = `${environment.apiBaseUrl}/audit`;

  constructor(private http: HttpClient) {}

  stamp(prId: number, remarks?: string): Observable<SubmitPrResult> {
    return this.http.post<SubmitPrResult>(`${this.base}/pr/${prId}/stamp`, { remarks });
  }

  raiseQuery(prId: number, queryText: string, assignedRoleCode: string): Observable<number> {
    return this.http.post<number>(`${this.base}/pr/${prId}/queries`, { queryText, assignedRoleCode });
  }

  respondQuery(queryId: number, responseText: string): Observable<SubmitPrResult> {
    return this.http.post<SubmitPrResult>(`${this.base}/queries/${queryId}/respond`, { responseText });
  }

  billHistory(prId: number): Observable<BillHistoryDto> {
    return this.http.get<BillHistoryDto>(`${this.base}/pr/${prId}/bill-history`);
  }

  startMonthEnd(period: string): Observable<number> {
    return this.http.post<number>(`${this.base}/month-end`, { period });
  }

  completeMonthEnd(id: number, summary?: string): Observable<void> {
    return this.http.post<void>(`${this.base}/month-end/${id}/complete`, { summary });
  }
}
