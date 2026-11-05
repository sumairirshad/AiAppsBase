import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePoInput, PurchaseOrder } from '../models';

const base = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class PurchasingService {
  constructor(private http: HttpClient) {}

  createPurchaseOrders(prId: number, purchaseOrders: CreatePoInput[]): Observable<number[]> {
    return this.http.post<number[]>(`${base}/requisitions/${prId}/purchase-orders`, { purchaseOrders, idempotencyKey: crypto.randomUUID() });
  }

  listForPr(prId: number): Observable<PurchaseOrder[]> {
    return this.http.get<PurchaseOrder[]>(`${base}/requisitions/${prId}/purchase-orders`);
  }

  issueContract(poId: number, signedDocumentId: number, chequeNo: string, chequeBank: string, chequeAmount: number, chequeDocumentId: number): Observable<void> {
    return this.http.post<void>(`${base}/purchase-orders/${poId}/contract`, { poId, signedDocumentId, chequeNo, chequeBank, chequeAmount, chequeDocumentId });
  }

  completeContractIssuance(prId: number): Observable<void> {
    return this.http.post<void>(`${base}/requisitions/${prId}/complete-contract-issuance`, {});
  }
}
