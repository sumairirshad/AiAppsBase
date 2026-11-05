import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Quotation, QuotationLineInput, SourcingGroup } from '../models';

const base = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class SourcingService {
  constructor(private http: HttpClient) {}

  acceptForSourcing(prId: number): Observable<void> {
    return this.http.post<void>(`${base}/requisitions/${prId}/accept-for-sourcing`, {});
  }

  listGroups(prId: number): Observable<SourcingGroup[]> {
    return this.http.get<SourcingGroup[]>(`${base}/requisitions/${prId}/sourcing-groups`);
  }

  listQuotations(groupId: number): Observable<Quotation[]> {
    return this.http.get<Quotation[]>(`${base}/sourcing-groups/${groupId}/quotations`);
  }

  addQuotation(groupId: number, vendorId: number, quotationNo: string, quotationDate: string, documentId: number, lines: QuotationLineInput[]): Observable<number> {
    return this.http.post<number>(`${base}/sourcing-groups/${groupId}/quotations`, { vendorId, quotationNo, quotationDate, documentId, lines });
  }

  completeQuotations(prId: number): Observable<void> {
    return this.http.post<void>(`${base}/requisitions/${prId}/complete-quotations`, {});
  }

  selectQuotation(groupId: number, quotationId: number, justification: string | null): Observable<void> {
    return this.http.post<void>(`${base}/sourcing-groups/${groupId}/select-quotation`, { quotationId, justification });
  }

  completeQuoteReview(prId: number): Observable<void> {
    return this.http.post<void>(`${base}/requisitions/${prId}/complete-quote-review`, {});
  }

  opdQuoteException(prId: number, approve: boolean, reason: string): Observable<void> {
    return this.http.post<void>(`${base}/requisitions/${prId}/opd-quote-exception`, { approve, reason });
  }
}
