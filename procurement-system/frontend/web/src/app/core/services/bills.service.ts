import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubmitPrResult } from '../models/requisition.models';

@Injectable({ providedIn: 'root' })
export class BillsService {
  private base = `${environment.apiBaseUrl}/bills`;

  constructor(private http: HttpClient) {}

  upload(prId: number, poId: number | null, vendorId: number, vendorInvoiceRef: string, invoiceDate: string, total: number, documentId: number): Observable<number> {
    return this.http.post<number>(this.base, { prId, poId, vendorId, vendorInvoiceRef, invoiceDate, total, documentId });
  }

  forward(id: number): Observable<SubmitPrResult | null> {
    return this.http.post<SubmitPrResult | null>(`${this.base}/${id}/forward`, {});
  }
}
