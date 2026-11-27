// src/app/Common-Service/auth.service.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, of, switchMap, tap, throwError, timer } from 'rxjs';
import { AUTH_CONFIG } from './auth.config';

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  mobile?: string;
  image?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  mobile?: string;
  password: string;
}

/** What your backend should return from POST /auth/login and POST /auth/register */
interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface Session {
  token: string;
  user: AuthUser;
}

/** Mock mode only */
interface MockUser extends AuthUser {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private session = signal<Session | null>(this.read());

  readonly user = computed(() => this.session()?.user ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  // ---------- login ----------
  login(req: LoginRequest): Observable<AuthUser> {
    const request$ = AUTH_CONFIG.useMock
      ? this.mockLogin(req)
      : this.http.post<AuthResponse>(AUTH_CONFIG.apiRoot + AUTH_CONFIG.endpoints.login, {
          email: req.email,
          password: req.password,
        });

    return request$.pipe(
      tap((res) => this.save({ token: res.token, user: res.user }, req.remember)),
      map((res) => res.user),
    );
  }

  // ---------- create account (signs the new member straight in) ----------
  register(req: RegisterRequest): Observable<AuthUser> {
    const request$ = AUTH_CONFIG.useMock
      ? this.mockRegister(req)
      : this.http.post<AuthResponse>(AUTH_CONFIG.apiRoot + AUTH_CONFIG.endpoints.register, {
          name: req.name,
          email: req.email,
          mobile: req.mobile || null,
          password: req.password,
        });

    return request$.pipe(
      tap((res) => this.save({ token: res.token, user: res.user }, true)),
      map((res) => res.user),
    );
  }

  // ---------- logout ----------
  logout(redirect = false): void {
    const token = this.token();

    // tell the server (real mode only). Failure is fine: we still sign out locally.
    if (!AUTH_CONFIG.useMock && token) {
      this.http
        .post(AUTH_CONFIG.apiRoot + AUTH_CONFIG.endpoints.logout, {}, { headers: { Authorization: `Bearer ${token}` } })
        .subscribe({ error: () => {} });
    }

    this.clear();
    if (redirect) this.router.navigate(['/login']);
  }

  // called by the interceptor when the server says 401 (token expired / invalid)
  sessionExpired(): void {
    const returnUrl = this.router.url;
    this.clear();
    this.router.navigate(['/login'], { queryParams: { expired: 1, returnUrl } });
  }

  // =====================================================================
  //  FAKE BACKEND  (delete this whole section when useMock = false)
  //  NOTE: passwords are kept in plain text in the browser. This is for
  //  development only. A real API must store a salted hash on the server.
  // =====================================================================
  private mockLogin(req: LoginRequest): Observable<AuthResponse> {
    const d = AUTH_CONFIG.demo;
    const email = req.email.trim().toLowerCase();

    return timer(700).pipe(
      switchMap(() => {
        if (email === d.email && req.password === d.password) {
          return of<AuthResponse>({ token: 'mock-token-' + Date.now(), user: { id: 1, name: d.name, email: d.email } });
        }
        const found = this.mockUsers().find((u) => u.email === email && u.password === req.password);
        if (found) {
          const { password, ...user } = found;
          return of<AuthResponse>({ token: 'mock-token-' + Date.now(), user });
        }
        return throwError(
          () => new HttpErrorResponse({ status: 401, error: { message: 'Incorrect email or password.' } }),
        );
      }),
    );
  }

  private mockRegister(req: RegisterRequest): Observable<AuthResponse> {
    const email = req.email.trim().toLowerCase();

    return timer(900).pipe(
      switchMap(() => {
        const users = this.mockUsers();
        if (email === AUTH_CONFIG.demo.email || users.some((u) => u.email === email)) {
          return throwError(
            () => new HttpErrorResponse({ status: 409, error: { message: 'An account with this email already exists.' } }),
          );
        }

        const user: MockUser = {
          id: Date.now(),
          name: req.name.trim(),
          email,
          mobile: req.mobile?.trim() || undefined,
          password: req.password,
        };
        try {
          localStorage.setItem(AUTH_CONFIG.mockUsersKey, JSON.stringify([...users, user]));
        } catch {
          /* storage blocked */
        }

        const { password, ...safe } = user;
        return of<AuthResponse>({ token: 'mock-token-' + Date.now(), user: safe });
      }),
    );
  }

  private mockUsers(): MockUser[] {
    try {
      const raw = localStorage.getItem(AUTH_CONFIG.mockUsersKey);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  // ---------- storage ----------
  // "Remember me" -> localStorage (survives closing the browser); otherwise sessionStorage.
  private save(s: Session, remember: boolean): void {
    this.session.set(s);
    try {
      localStorage.removeItem(AUTH_CONFIG.storageKey);
      sessionStorage.removeItem(AUTH_CONFIG.storageKey);
      (remember ? localStorage : sessionStorage).setItem(AUTH_CONFIG.storageKey, JSON.stringify(s));
    } catch {
      /* storage blocked: user stays signed in until refresh */
    }
  }

  private clear(): void {
    this.session.set(null);
    try {
      localStorage.removeItem(AUTH_CONFIG.storageKey);
      sessionStorage.removeItem(AUTH_CONFIG.storageKey);
    } catch {
      /* ignore */
    }
  }

  private read(): Session | null {
    try {
      const raw = localStorage.getItem(AUTH_CONFIG.storageKey) ?? sessionStorage.getItem(AUTH_CONFIG.storageKey);
      const s = raw ? (JSON.parse(raw) as Session) : null;
      return s?.token && s?.user ? s : null;
    } catch {
      return null;
    }
  }
}