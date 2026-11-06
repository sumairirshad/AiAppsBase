import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentPolicyDto } from '../models/policy.models';

@Injectable({ providedIn: 'root' })
export class PolicyService {
  private base = `${environment.apiBaseUrl}/policy`;

  constructor(private http: HttpClient) {}

  current(): Observable<CurrentPolicyDto> {
    return this.http.get<CurrentPolicyDto>(`${this.base}/current`);
  }

  createVersion(changeReason: string, effectiveFrom: string): Observable<number> {
    return this.http.post<number>(`${this.base}/versions`, { changeReason, effectiveFrom });
  }

  updateSetting(key: string, value: string): Observable<void> {
    return this.http.put<void>(`${this.base}/settings/${key}`, { value });
  }

  createApprovalBand(minAmount: number, maxAmount: number | null, sequence: number, roleCode: string, spendSubHeadId: number | null): Observable<number> {
    return this.http.post<number>(`${this.base}/approval-bands`, { actorUserId: 0, minAmount, maxAmount, sequence, roleCode, spendSubHeadId });
  }

  createQuotationRule(
    spendSubHeadId: number | null,
    minAmount: number | null,
    maxAmount: number | null,
    starVendor: boolean | null,
    emergency: boolean | null,
    requiredQuotes: number,
    priority: number,
    description: string
  ): Observable<number> {
    return this.http.post<number>(`${this.base}/quotation-rules`, {
      actorUserId: 0,
      spendSubHeadId,
      minAmount,
      maxAmount,
      starVendor,
      emergency,
      requiredQuotes,
      priority,
      description,
    });
  }
}
