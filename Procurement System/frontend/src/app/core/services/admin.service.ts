import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Department, DepartmentCategory, Item, Location, Role, SpendSubHead, Unit, UserSummary } from '../models';

const base = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  listDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${base}/departments`);
  }

  createDepartment(code: string, name: string, parentId: number | null): Observable<number> {
    return this.http.post<number>(`${base}/departments`, { code, name, parentId });
  }

  updateDepartment(id: number, name: string, parentId: number | null, hodUserId: number | null, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${base}/departments/${id}`, { id, name, parentId, hodUserId, isActive });
  }

  listDepartmentCategories(departmentId: number): Observable<DepartmentCategory[]> {
    return this.http.get<DepartmentCategory[]>(`${base}/departments/${departmentId}/categories`);
  }

  setDepartmentCategories(departmentId: number, categoryIds: number[]): Observable<void> {
    return this.http.put<void>(`${base}/departments/${departmentId}/categories`, categoryIds);
  }

  listLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${base}/locations`);
  }

  createLocation(code: string, name: string, address: string | null): Observable<number> {
    return this.http.post<number>(`${base}/locations`, { code, name, address });
  }

  updateLocation(id: number, name: string, address: string | null, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${base}/locations/${id}`, { id, name, address, isActive });
  }

  listCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${base}/categories`);
  }

  createCategory(code: string, name: string, parentId: number | null): Observable<number> {
    return this.http.post<number>(`${base}/categories`, { code, name, parentId });
  }

  listItems(categoryId?: number): Observable<Item[]> {
    const url = categoryId ? `${base}/items?categoryId=${categoryId}` : `${base}/items`;
    return this.http.get<Item[]>(url);
  }

  createItem(code: string, name: string, categoryId: number, unitId: number): Observable<number> {
    return this.http.post<number>(`${base}/items`, { code, name, categoryId, unitId });
  }

  listUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${base}/units`);
  }

  listSpendSubHeads(): Observable<SpendSubHead[]> {
    return this.http.get<SpendSubHead[]>(`${base}/spend-sub-heads`);
  }

  listUsers(): Observable<UserSummary[]> {
    return this.http.get<UserSummary[]>(`${base}/users`);
  }

  createUser(employeeNo: string, displayName: string, email: string, departmentId: number, password: string, roleCode: string, roleDepartmentId: number | null): Observable<number> {
    return this.http.post<number>(`${base}/users`, { employeeNo, displayName, email, departmentId, password, roleCode, roleDepartmentId });
  }

  listRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${base}/roles`);
  }
}
