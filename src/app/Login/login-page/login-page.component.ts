import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../Common-Service/auth.service';
import { AUTH_CONFIG } from '../../Common-Service/auth.config';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css'
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly useMock = AUTH_CONFIG.useMock;
  readonly demo = AUTH_CONFIG.demo;
  readonly expired = this.route.snapshot.queryParamMap.get('expired') === '1';

  showPassword = signal(false);
  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember: [true],
  });

  get f() {
    return this.form.controls;
  }

  fillDemo(): void {
    this.form.patchValue({ email: this.demo.email, password: this.demo.password });
  }

  submit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.safeReturnUrl()),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 0
            ? 'We could not reach the server. Please check your connection.'
            : err.error?.message ?? 'Sign in failed. Please try again.',
        );
      },
    });
  }

  // only allow in-app paths so a crafted ?returnUrl= cannot send people to another site
  private safeReturnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/';
  }
}