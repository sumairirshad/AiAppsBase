import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePrRequest, PrDetailDto, PrListItemDto, SubmitPrResult } from '../models/requisition.models';

@Injectable({ providedIn: 'root' })
export class RequisitionsService {
  private base = `${environment.apiBaseUrl}/requisitions`;

  constructor(private http: HttpClient) {}

  create(body: CreatePrRequest): Observable<number> {
    return this.http.post<number>(this.base, body);
  }

  submit(id: number): Observable<SubmitPrResult> {
    return this.http.post<SubmitPrResult>(`${this.base}/${id}/submit`, {});
  }

  mine(): Observable<PrListItemDto[]> {
    return this.http.get<PrListItemDto[]>(`${this.base}/mine`);
  }

  inbox(roleCode: string): Observable<PrListItemDto[]> {
    return this.http.get<PrListItemDto[]>(`${this.base}/inbox`, { params: { roleCode } });
  }

  detail(id: number): Observable<PrDetailDto> {
    return this.http.get<PrDetailDto>(`${this.base}/${id}`);
  }

  act(id: number, roleCode: string, actionCode: string, remarks?: string): Observable<SubmitPrResult> {
    return this.http.post<SubmitPrResult>(`${this.base}/${id}/act`, { roleCode, actionCode, remarks });
  }

  forceRevert(id: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/force-revert`, { reason });
  }

  voidPr(id: number, reason: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/void`, { reason });
  }
}
