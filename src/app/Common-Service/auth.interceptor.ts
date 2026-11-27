// src/app/Common-Service/auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AUTH_CONFIG } from './auth.config';
import { AuthService } from './auth.service';

/** Adds "Authorization: Bearer <token>" to calls to YOUR api, and signs the user out on 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isOurApi = req.url.startsWith(AUTH_CONFIG.apiRoot);

  const outgoing = token && isOurApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLoginCall = req.url.endsWith(AUTH_CONFIG.endpoints.login);
      if (err.status === 401 && isOurApi && !isLoginCall && auth.isLoggedIn()) {
        auth.sessionExpired();
      }
      return throwError(() => err);
    }),
  );
};