import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Grn, GrnLineInput } from '../models';

const base = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ReceivingService {
  constructor(private http: HttpClient) {}

  recordGrn(poId: number, receivedOn: string, deliveryNoteNo: string, deliveryNoteDocumentId: number | null, lines: GrnLineInput[]): Observable<number> {
    return this.http.post<number>(`${base}/purchase-orders/${poId}/goods-receipts`, { receivedOn, deliveryNoteNo, deliveryNoteDocumentId, lines });
  }

  listForPr(prId: number): Observable<Grn[]> {
    return this.http.get<Grn[]>(`${base}/requisitions/${prId}/goods-receipts`);
  }

  acknowledge(grnId: number, accept: boolean, qualityRating: number | null, remarks: string | null, disputeReason: string | null): Observable<void> {
    return this.http.post<void>(`${base}/goods-receipts/${grnId}/acknowledge`, { accept, qualityRating, remarks, disputeReason });
  }
}
