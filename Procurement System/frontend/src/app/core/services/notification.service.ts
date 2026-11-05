import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppNotification } from '../models';

const base = `${environment.apiUrl}/notifications`;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient) {}

  list(unreadOnly = false): Observable<AppNotification[]> {
    return this.http.get<AppNotification[]>(`${base}?unreadOnly=${unreadOnly}`);
  }

  markRead(id: number): Observable<void> {
    return this.http.post<void>(`${base}/${id}/read`, {});
  }
}
