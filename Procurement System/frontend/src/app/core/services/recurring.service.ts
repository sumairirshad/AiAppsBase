import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRecurringPlanRequest, RecurringPlan } from '../models';

const base = `${environment.apiUrl}/recurring-plans`;

@Injectable({ providedIn: 'root' })
export class RecurringService {
  constructor(private http: HttpClient) {}

  list(): Observable<RecurringPlan[]> {
    return this.http.get<RecurringPlan[]>(base);
  }

  create(request: CreateRecurringPlanRequest): Observable<number> {
    return this.http.post<number>(base, request);
  }

  generateOccurrence(planId: number): Observable<number> {
    return this.http.post<number>(`${base}/${planId}/generate-occurrence`, {});
  }

  attachBill(prId: number, billingPeriod: string, billAmount: number, purpose: string, dueDate: string, billDocumentId: number): Observable<void> {
    return this.http.post<void>(`${base}/occurrences/${prId}/attach-bill`, { billingPeriod, billAmount, purpose, dueDate, billDocumentId });
  }
}
