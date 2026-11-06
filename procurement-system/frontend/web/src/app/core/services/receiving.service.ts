import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubmitPrResult } from '../models/requisition.models';

export interface GrnLineInput {
  poLineId: number;
  deliveredQty: number;
  acceptedQty: number;
  rejectedQty: number;
  rejectReason?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ReceivingService {
  private base = `${environment.apiBaseUrl}/receiving`;

  constructor(private http: HttpClient) {}

  recordGrn(poId: number, deliveryNoteNo: string, receivedOn: string, lines: GrnLineInput[]): Observable<SubmitPrResult | null> {
    return this.http.post<SubmitPrResult | null>(`${this.base}/orders/${poId}/grn`, { deliveryNoteNo, receivedOn, lines });
  }

  acknowledge(prId: number, accepted: boolean, qualityRating?: number, remarks?: string, disputeReason?: string): Observable<SubmitPrResult> {
    return this.http.post<SubmitPrResult>(`${this.base}/pr/${prId}/acknowledge`, { accepted, qualityRating, remarks, disputeReason });
  }
}
