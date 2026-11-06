import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResult, MeResult, RoleAssignmentDto } from '../models/auth.models';

const STORAGE_KEY = 'procurement.session';

interface StoredSession {
  token: string;
  expiresAtUtc: string;
  userId: number;
  displayName: string;
  roles: RoleAssignmentDto[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<StoredSession | null>(this.loadFromStorage());

  readonly isAuthenticated = computed(() => !!this.session() && new Date(this.session()!.expiresAtUtc) > new Date());
  readonly displayName = computed(() => this.session()?.displayName ?? '');
  readonly userId = computed(() => this.session()?.userId ?? null);
  readonly roles = computed(() => this.session()?.roles ?? []);
  readonly roleCodes = computed(() => Array.from(new Set(this.roles().map((r) => r.roleCode))));

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${environment.apiBaseUrl}/auth/login`, { email, password }).pipe(
      tap((result) => {
        const stored: StoredSession = {
          token: result.token,
          expiresAtUtc: result.expiresAtUtc,
          userId: result.userId,
          displayName: result.displayName,
          roles: result.roles,
        };
        this.session.set(stored);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      })
    );
  }

  me(): Observable<MeResult> {
    return this.http.get<MeResult>(`${environment.apiBaseUrl}/auth/me`);
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  get token(): string | null {
    return this.session()?.token ?? null;
  }

  hasRole(roleCode: string): boolean {
    return this.roleCodes().includes(roleCode);
  }

  /** The department a user holds a given role in (null if the role is department-unscoped, e.g. OPD). */
  departmentForRole(roleCode: string): number | null {
    const match = this.roles().find((r) => r.roleCode === roleCode);
    return match?.departmentId ?? null;
  }

  /** True when the user's HOD assignment is specifically for the Procurement department. */
  isProcurementHod(procurementDepartmentCode = 'PROC'): boolean {
    return this.roles().some((r) => r.roleCode === 'HOD' && r.departmentCode === procurementDepartmentCode);
  }

  private loadFromStorage(): StoredSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    } catch {
      return null;
    }
  }
}
