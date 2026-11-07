import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryDto, DepartmentDto, ItemDto, ItemRequestDto, LocationDto, ProjectDto, UnitDto } from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private base = `${environment.apiBaseUrl}/catalog`;

  constructor(private http: HttpClient) {}

  departments(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(`${this.base}/departments`);
  }

  createDepartment(code: string, name: string, parentId?: number | null): Observable<number> {
    return this.http.post<number>(`${this.base}/departments`, { code, name, parentId });
  }

  locations(): Observable<LocationDto[]> {
    return this.http.get<LocationDto[]>(`${this.base}/locations`);
  }

  createLocation(code: string, name: string, address?: string): Observable<number> {
    return this.http.post<number>(`${this.base}/locations`, { code, name, address });
  }

  updateLocation(id: number, name: string, address: string | null, isActive: boolean): Observable<void> {
    return this.http.put<void>(`${this.base}/locations/${id}`, { name, address, isActive });
  }

  categories(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(`${this.base}/categories`);
  }

  createCategory(code: string, name: string, parentId?: number | null): Observable<number> {
    return this.http.post<number>(`${this.base}/categories`, { actorUserId: 0, code, name, parentId });
  }

  mapDepartmentCategory(departmentId: number, categoryId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/department-categories`, { actorUserId: 0, departmentId, categoryId });
  }

  units(): Observable<UnitDto[]> {
    return this.http.get<UnitDto[]>(`${this.base}/units`);
  }

  createUnit(code: string, name: string, precision = 0): Observable<number> {
    return this.http.post<number>(`${this.base}/units`, { actorUserId: 0, code, name, precision });
  }

  items(departmentId?: number, categoryId?: number): Observable<ItemDto[]> {
    const params: Record<string, number> = {};
    if (departmentId) params['departmentId'] = departmentId;
    if (categoryId) params['categoryId'] = categoryId;
    return this.http.get<ItemDto[]>(`${this.base}/items`, { params });
  }

  createItem(code: string, name: string, categoryId: number, unitId: number): Observable<number> {
    return this.http.post<number>(`${this.base}/items`, { actorUserId: 0, code, name, categoryId, unitId });
  }

  createItemRequest(requestType: 'Item' | 'Category', proposedName: string, categoryId?: number | null): Observable<number> {
    return this.http.post<number>(`${this.base}/item-requests`, { actorUserId: 0, requestType, proposedName, categoryId });
  }

  pendingItemRequests(): Observable<ItemRequestDto[]> {
    return this.http.get<ItemRequestDto[]>(`${this.base}/item-requests/pending`);
  }

  decideItemRequest(id: number, approve: boolean, reason?: string, unitId?: number): Observable<void> {
    return this.http.post<void>(`${this.base}/item-requests/${id}/decision`, { approve, reason, unitId });
  }

  projects(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(`${this.base}/projects`);
  }

  createProject(projectCode: string, name: string, ownerDepartmentId: number, managerUserId?: number | null, contractProvided = false): Observable<number> {
    return this.http.post<number>(`${this.base}/projects`, { projectCode, name, ownerDepartmentId, managerUserId, contractProvided });
  }

  createMarketSurvey(itemId: number, locationId: number | null, surveyedPrice: number, source: string, surveyedOn: string): Observable<number> {
    return this.http.post<number>(`${this.base}/market-surveys`, { itemId, locationId, surveyedPrice, source, surveyedOn });
  }
}
