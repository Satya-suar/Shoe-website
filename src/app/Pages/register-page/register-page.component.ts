import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../Common-Service/auth.service';

// confirm-password must match password
function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.css'
})
export class RegisterPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  showPassword = signal(false);
  showConfirm = signal(false);
  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],            // optional
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)]],
      confirm: ['', [Validators.required]],
      terms: [false, [Validators.requiredTrue]],
    },
    { validators: matchPasswords },
  );

  get f() {
    return this.form.controls;
  }

  // 0 (empty) to 4 (strong), shown as the strength bar
  strength(): number {
    const p = this.f.password.value;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) score++;
    return Math.max(1, score);
  }

  strengthLabel(): string {
    return ['', 'Weak', 'Fair', 'Good', 'Strong'][this.strength()];
  }

  submit(): void {
    if (this.loading()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const { name, email, mobile, password } = this.form.getRawValue();

    this.auth.register({ name, email, mobile, password }).subscribe({
      next: () => this.router.navigateByUrl(this.safeReturnUrl()),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(
          err.status === 0
            ? 'We could not reach the server. Please check your connection.'
            : err.error?.message ?? 'We could not create your account. Please try again.',
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