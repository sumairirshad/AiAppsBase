import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const allowedRoles = route.data['roles'] as string[] | undefined;
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }
    const roles = this.auth.currentUser?.roles.map((r) => r.roleCode) ?? [];
    if (allowedRoles.some((role) => roles.includes(role))) {
      return true;
    }
    return this.router.createUrlTree(['/home']);
  }
}
