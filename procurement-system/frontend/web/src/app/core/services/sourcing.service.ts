import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AddQuotationRequest, SelectQuoteRequest, SourcingGroupDto } from '../models/sourcing.models';

@Injectable({ providedIn: 'root' })
export class SourcingService {
  private base = `${environment.apiBaseUrl}/sourcing`;

  constructor(private http: HttpClient) {}

  acceptAndGroup(prId: number): Observable<number[]> {
    return this.http.post<number[]>(`${this.base}/pr/${prId}/accept`, {});
  }

  /** The durable source of truth for a PR's sourcing groups and their quotations - survives
   * refresh and works for any user who opens the PR, not just the one who ran the create/add
   * commands. */
  groupsForPr(prId: number): Observable<SourcingGroupDto[]> {
    return this.http.get<SourcingGroupDto[]>(`${this.base}/pr/${prId}/groups`);
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
