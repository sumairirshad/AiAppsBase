import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SupplierInvoice } from '../models';

const base = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class BillsService {
  constructor(private http: HttpClient) {}

  upload(prId: number, poId: number | null, vendorId: number, vendorInvoiceRef: string, invoiceDate: string, total: number, documentId: number): Observable<number> {
    return this.http.post<number>(`${base}/requisitions/${prId}/bills`, { poId, vendorId, vendorInvoiceRef, invoiceDate, total, documentId });
  }

  listForPr(prId: number): Observable<SupplierInvoice[]> {
    return this.http.get<SupplierInvoice[]>(`${base}/requisitions/${prId}/bills`);
  }

  forward(invoiceId: number): Observable<void> {
    return this.http.post<void>(`${base}/bills/${invoiceId}/forward`, {});
  }

  completeBillUpload(prId: number): Observable<void> {
    return this.http.post<void>(`${base}/requisitions/${prId}/complete-bill-upload`, {});
  }

  simulateFinancePortalPayment(prId: number): Observable<void> {
    return this.http.post<void>(`${base}/requisitions/${prId}/simulate-finance-portal-payment`, {});
  }
}
