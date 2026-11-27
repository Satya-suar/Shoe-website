// src/app/Common-Service/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Put on pages that need a signed-in user. Others are sent to /login and come back after. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Put on /login: a signed-in user is sent home instead. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.createUrlTree(['/']) : true;
};