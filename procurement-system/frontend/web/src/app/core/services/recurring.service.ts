import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubmitPrResult } from '../models/requisition.models';

export interface RecurringPlanLineInput {
  itemId: number;
  qty: number;
  unitId: number;
  agreedPrice?: number | null;
}

export interface CreateRecurringPlanRequest {
  planTypeCode: string;
  spendSubHeadCode: string;
  departmentId: number;
  locationId: number;
  ownerUserId: number;
  frequencyCode: string;
  generationDay: number;
  startDate: string;
  endDate?: string | null;
  vendorId?: number | null;
  fixedAmount?: number | null;
  lines: RecurringPlanLineInput[];
}

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private base = `${environment.apiBaseUrl}/recurring`;

  constructor(private http: HttpClient) {}

  createPlan(body: CreateRecurringPlanRequest): Observable<number> {
    return this.http.post<number>(`${this.base}/plans`, { actorUserId: 0, ...body });
  }

  approvePlan(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/plans/${id}/approve`, {});
  }

  generateNow(id: number, periodStart: string): Observable<number | null> {
    return this.http.post<number | null>(`${this.base}/plans/${id}/generate`, {}, { params: { periodStart } });
  }

  /** The Cyclic Fixed items-plan's single verification quotation (BR-046). */
  verifyQuote(prId: number, verifiedUnitPrice: number): Observable<SubmitPrResult> {
    return this.http.post<SubmitPrResult>(`${this.base}/pr/${prId}/verify-quote`, { verifiedUnitPrice });
  }
}
