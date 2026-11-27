import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../Common-Service/auth.service';

@Component({
  selector: 'app-logout-page',
  imports: [RouterLink],
  templateUrl: './logout-page.component.html',
  styleUrl: './logout-page.component.css'
})
export class LogoutPageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  name = this.auth.user()?.name ?? '';
  // already signed out (e.g. opened /logout directly)? go straight to the goodbye screen
  done = signal(!this.auth.isLoggedIn());

  confirm(): void {
    this.auth.logout();
    this.done.set(true);
  }

  cancel(): void {
    this.router.navigateByUrl('/');
  }
}