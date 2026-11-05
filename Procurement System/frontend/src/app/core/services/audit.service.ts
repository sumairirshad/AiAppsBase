import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditQuery, AuditStamp } from '../models';

const base = `${environment.apiUrl}/audit`;

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private http: HttpClient) {}

  stamp(prId: number, paymentVerified: boolean, deliveryVerified: boolean, remarks: string | null): Observable<void> {
    return this.http.post<void>(`${base}/requisitions/${prId}/stamp`, { paymentVerified, deliveryVerified, remarks });
  }

  getStamp(prId: number): Observable<AuditStamp | null> {
    return this.http.get<AuditStamp | null>(`${base}/requisitions/${prId}/stamp`);
  }

  raiseQuery(entityTypeCode: string, entityId: number, roleCode: string, assignedUserId: number | null, queryText: string): Observable<number> {
    return this.http.post<number>(`${base}/queries`, { entityTypeCode, entityId, roleCode, assignedUserId, queryText });
  }

  respondQuery(queryId: number, responseText: string, returnToPrStatusCode: string): Observable<void> {
    return this.http.post<void>(`${base}/queries/${queryId}/respond`, { responseText, returnToPrStatusCode });
  }

  listQueries(entityTypeCode: string, entityId: number): Observable<AuditQuery[]> {
    return this.http.get<AuditQuery[]>(`${base}/queries?entityTypeCode=${entityTypeCode}&entityId=${entityId}`);
  }
}
