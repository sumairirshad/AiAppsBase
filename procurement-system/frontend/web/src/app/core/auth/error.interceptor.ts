import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';

// Surfaces the two cross-cutting failure modes every screen can hit, instead of letting a
// component swallow or mis-handle them individually:
//  - 401: the session is gone/expired -> straight back to login.
//  - 409: another user changed the same PR/PO/vendor first (ROWVERSION conflict) -> a clear
//    "refresh and retry" message rather than a silent failed save.
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        if (err.status === 401 && !req.url.includes('/auth/login')) {
          auth.logout();
          router.navigate(['/login']);
        } else if (err.status === 409) {
          toast.error('Someone else just changed this record. Refresh and try again.');
        } else if (err.status === 403) {
          toast.error('You are not allowed to do that.');
        } else if (err.status >= 400) {
          const message = (err.error && (err.error.message || err.error.title)) || err.message || 'The request failed.';
          toast.error(message);
        }
      }
      return throwError(() => err);
    })
  );
};
