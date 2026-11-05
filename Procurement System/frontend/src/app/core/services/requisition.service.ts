import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreatePrRequest, Pr, PrListItem, PrTimelineEntry } from '../models';

const base = `${environment.apiUrl}/requisitions`;

@Injectable({ providedIn: 'root' })
export class RequisitionService {
  constructor(private http: HttpClient) {}

  create(request: CreatePrRequest): Observable<number> {
    return this.http.post<number>(base, request);
  }

  submit(id: number): Observable<void> {
    return this.http.post<void>(`${base}/${id}/submit`, {});
  }

  mine(): Observable<PrListItem[]> {
    return this.http.get<PrListItem[]>(`${base}/mine`);
  }

  inbox(): Observable<PrListItem[]> {
    return this.http.get<PrListItem[]>(`${base}/inbox`);
  }

  get(id: number): Observable<Pr> {
    return this.http.get<Pr>(`${base}/${id}`);
  }

  timeline(id: number): Observable<PrTimelineEntry[]> {
    return this.http.get<PrTimelineEntry[]>(`${base}/${id}/timeline`);
  }

  approve(id: number, remarks: string | null): Observable<void> {
    return this.http.post<void>(`${base}/${id}/approve`, { remarks });
  }

  reject(id: number, reason: string): Observable<void> {
    return this.http.post<void>(`${base}/${id}/reject`, { reason });
  }

  return(id: number, reason: string): Observable<void> {
    return this.http.post<void>(`${base}/${id}/return`, { reason });
  }

  financeApprove(id: number, budgetRef: string, availableAmount: number, remarks: string | null): Observable<void> {
    return this.http.post<void>(`${base}/${id}/finance-approve`, { budgetRef, availableAmount, remarks });
  }

  opdBudgetException(id: number, approve: boolean, reason: string): Observable<void> {
    return this.http.post<void>(`${base}/${id}/opd-budget-exception`, { approve, reason });
  }
}
