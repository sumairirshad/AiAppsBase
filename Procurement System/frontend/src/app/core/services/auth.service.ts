import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser, LoginResult } from '../models';

const TOKEN_KEY = 'procurement.token';
const USER_KEY = 'procurement.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<CurrentUser | null>(this.readStoredUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  get isLoggedIn(): boolean {
    return !!this.token && !!this.currentUser;
  }

  login(email: string, password: string): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap((result) => this.setSession(result)),
    );
  }

  refreshMe(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUserSubject.next(user);
        this.storeUser(user);
      }),
    );
  }

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    this.currentUserSubject.next(null);
  }

  hasRole(roleCode: string): boolean {
    return !!this.currentUser?.roles.some((r) => r.roleCode === roleCode);
  }

  hasPermission(permissionCode: string): boolean {
    return !!this.currentUser?.permissions.includes(permissionCode);
  }

  private setSession(result: LoginResult): void {
    try {
      localStorage.setItem(TOKEN_KEY, result.token);
      this.storeUser(result.user);
    } catch {
      /* ignore */
    }
    this.currentUserSubject.next(result.user);
  }

  private storeUser(user: CurrentUser): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  }

  private readStoredUser(): CurrentUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as CurrentUser) : null;
    } catch {
      return null;
    }
  }
}
