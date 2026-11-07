import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubmitPrResult } from '../models/requisition.models';
import { PurchaseOrderDto } from '../models/purchasing.models';

@Injectable({ providedIn: 'root' })
export class PurchasingService {
  private base = `${environment.apiBaseUrl}/purchasing`;

  constructor(private http: HttpClient) {}

  createOrders(prId: number, advanceTypeCode: string, deliveryDate: string, paymentTerms?: string, advancePct?: number, advanceAmount?: number): Observable<number[]> {
    const idempotencyKey = crypto.randomUUID();
    return this.http.post<number[]>(`${this.base}/pr/${prId}/orders`, { idempotencyKey, advanceTypeCode, advancePct, advanceAmount, deliveryDate, paymentTerms });
  }

  /** The durable source of truth for a PR's purchase orders, their lines (with the PoLineId +
   * OutstandingQty a GRN needs) and their contract - survives refresh and works for contract
   * activation, PO amendment, and GRN entry regardless of who created the PO. */
  ordersForPr(prId: number): Observable<PurchaseOrderDto[]> {
    return this.http.get<PurchaseOrderDto[]>(`${this.base}/pr/${prId}/orders`);
  }

  generateContract(poId: number, templateId: number, startDate?: string, endDate?: string, countryOfOrigin?: string, incoterms?: string): Observable<number> {
    return this.http.post<number>(`${this.base}/orders/${poId}/contract`, { templateId, startDate, endDate, countryOfOrigin, incoterms });
  }

  activate(poId: number, signedDocumentId: number, chequeNo: string, chequeBank: string, chequeAmount: number, chequeDocumentId: number): Observable<SubmitPrResult | null> {
    return this.http.post<SubmitPrResult | null>(`${this.base}/orders/${poId}/activate`, { signedDocumentId, chequeNo, chequeBank, chequeAmount, chequeDocumentId });
  }

  amend(poId: number, amendmentTypeCode: string, oldValue: string, newValue: string, isEscalation: boolean, reason: string): Observable<number> {
    return this.http.post<number>(`${this.base}/orders/${poId}/amend`, { amendmentTypeCode, oldValue, newValue, isEscalation, reason });
  }
}
