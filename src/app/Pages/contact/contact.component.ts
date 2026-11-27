import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../Common-Service/toast.service';
import { RevealDirective } from '../../Shared/reveal.directive';

@Component({
  selector: 'app-contact',
  imports: [RouterLink, ReactiveFormsModule, RevealDirective],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly email = 'support@shoekart.com';

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['Order help', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  get f() { return this.form.controls; }

  /** There is no mail backend, so this opens the visitor's email app with the message filled in. */
  send(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const body = `${v.message}\n\nFrom: ${v.name} (${v.email})`;
    window.location.href = `mailto:${this.email}?subject=${encodeURIComponent(v.subject!)}&body=${encodeURIComponent(body)}`;
    this.toast.show('Opening your email app...', 'info', 'bi-envelope-fill');
  }
}
