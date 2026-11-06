import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Gates a lazy feature area to users holding at least one of the given roles. A user with
 * several roles (e.g. a department HOD who is also a Requestor) can open several areas and
 * switches between them from the top-nav role switcher - this guard only decides "can this
 * person open this area at all", the API's own role/task/scope checks decide what they can
 * actually do once inside it.
 */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }
    if (allowedRoles.some((r) => auth.hasRole(r))) return true;
    router.navigate(['/']);
    return false;
  };
}
