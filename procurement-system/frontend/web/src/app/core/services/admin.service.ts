import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserDto {
  id: number;
  employeeNo: string;
  displayName: string;
  email: string;
  departmentId: number;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  users(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.base}/users`);
  }

  createUser(employeeNo: string, displayName: string, email: string, departmentId: number, password: string): Observable<number> {
    return this.http.post<number>(`${this.base}/users`, { employeeNo, displayName, email, departmentId, password });
  }

  assignRole(userId: number, roleCode: string, departmentId?: number | null): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${userId}/roles`, { roleCode, departmentId });
  }

  grantDepartmentAccess(userId: number, departmentId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/users/${userId}/department-access`, { departmentId });
  }
}
