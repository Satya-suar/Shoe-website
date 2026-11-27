import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './CommonComponent/header/header.component';
import { FooterComponent } from './CommonComponent/footer/footer.component';
import { ToastComponent } from './CommonComponent/toast/toast.component';
import { CursorComponent } from './Shared/cursor/cursor.component';

// Pages that show NO header and NO footer. Add more addresses here later.
const HIDE_CHROME_ON = ['/login', '/register'];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastComponent, CursorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'FinalExamProject';

  private router = inject(Router);

  // Starts from the real address bar, so opening /register directly never flashes the header.
  private url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: typeof window !== 'undefined' ? window.location.pathname : '/' },
  );

  showChrome = computed(() => {
    const path = this.url().split('?')[0].split('#')[0];
    return !HIDE_CHROME_ON.includes(path);
  });
}