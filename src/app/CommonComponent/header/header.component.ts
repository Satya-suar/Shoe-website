import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../Common-Service/auth.service';
import { CartService } from '../../Common-Service/cart.service';
import { ProfileService } from '../../Common-Service/profile.service';
import { WishlistService } from '../../Common-Service/wishlist.service';

const RECENT_KEY = 'luxekart_recent_searches';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  cart = inject(CartService);
  wishlist = inject(WishlistService);
  user = inject(ProfileService);
  auth = inject(AuthService);

  // name / email / initial: use the signed-in account first, fall back to the saved profile
  displayName = computed(() => this.auth.user()?.name || this.user.profile().name || 'Member');
  displayEmail = computed(() => this.auth.user()?.email || this.user.profile().email || '');
  initial = computed(() => (this.displayName().trim().charAt(0) || 'L').toUpperCase());

  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);

  // ---------- panels ----------
  searchOpen = signal(false);
  settingsOpen = signal(false);
  profileOpen = signal(false);
  menuOpen = signal(false);

  // ---------- scroll behaviour ----------
  scrolled = signal(false);
  hidden = signal(false);      // header slides away while scrolling down
  progress = signal(0);        // 0-100, reading progress line
  private lastY = 0;

  // ---------- announcement strip (edit these messages) ----------
  announceOpen = signal(true);
  announcements = [
    { icon: 'bi-patch-check-fill', text: '100% authenticated luxury' },
    { icon: 'bi-truck', text: 'Complimentary insured delivery on premium orders' },
    { icon: 'bi-stars', text: 'New season arrivals have landed' },
    { icon: 'bi-arrow-repeat', text: '7-day easy returns' },
  ];
  announceIndex = signal(0);
  currentAnnouncement = computed(() => [this.announcements[this.announceIndex()]]);

  // ---------- logo letters ----------
  letters = 'LuxeKart'.split('');

  // ---------- search ----------
  query = '';
  popular = ['Watches', 'Handbags', 'Gucci', 'Rolex', 'Perfumes', 'Sunglasses'];
  recent = signal<string[]>(this.loadRecent());

  // ---------- badge bump animation ----------
  bumpCart = signal(false);
  bumpWish = signal(false);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor() {
    // rotate the announcement every few seconds
    if (typeof window !== 'undefined') {
      const timer = setInterval(() => {
        this.announceIndex.update((i) => (i + 1) % this.announcements.length);
      }, 4500);
      this.destroyRef.onDestroy(() => clearInterval(timer));
    }

    // make the cart / wishlist badge "pop" when the count changes
    let lastCart = this.cart.count();
    effect(() => {
      const n = this.cart.count();
      if (n !== lastCart) {
        lastCart = n;
        this.pulse(this.bumpCart);
      }
    });

    let lastWish = this.wishlist.count();
    effect(() => {
      const n = this.wishlist.count();
      if (n !== lastWish) {
        lastWish = n;
        this.pulse(this.bumpWish);
      }
    });
  }

  // ---------- toggles ----------
  toggleSearch(): void {
    const next = !this.searchOpen();
    this.closeAll();
    this.searchOpen.set(next);
    if (next) {
      this.hidden.set(false);
      setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
    }
  }

  toggleSettings(): void {
    const next = !this.settingsOpen();
    this.closeAll();
    this.settingsOpen.set(next);
  }

  toggleProfile(): void {
    const next = !this.profileOpen();
    this.closeAll();
    this.profileOpen.set(next);
  }

  toggleMenu(): void {
    const next = !this.menuOpen();
    this.closeAll();
    this.menuOpen.set(next);
  }

  closeAll(): void {
    this.searchOpen.set(false);
    this.settingsOpen.set(false);
    this.profileOpen.set(false);
    this.menuOpen.set(false);
  }

  private anyPanelOpen(): boolean {
    return this.searchOpen() || this.settingsOpen() || this.profileOpen() || this.menuOpen();
  }

  // ---------- search ----------
  submitSearch(): void {
    const q = this.query.trim();
    if (!q) return;
    this.saveRecent(q);
    this.router.navigate(['/products'], { queryParams: { q } });
    this.closeAll();
  }

  // used by the "Recent" and "Popular" chips
  searchFor(term: string): void {
    this.query = term;
    this.submitSearch();
  }

  clearRecent(): void {
    this.recent.set([]);
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      /* storage can be blocked, ignore */
    }
  }

  private loadRecent(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.slice(0, 5) : [];
    } catch {
      return [];
    }
  }

  private saveRecent(term: string): void {
    const list = [term, ...this.recent().filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    this.recent.set(list);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
  }

  // ---------- greeting (shown in the profile menu) ----------
  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  // ---------- small helpers ----------
  private pulse(flag: ReturnType<typeof signal<boolean>>): void {
    // deferred so the signal is never written inside the effect itself
    setTimeout(() => {
      flag.set(true);
      setTimeout(() => flag.set(false), 600);
    });
  }

  // ---------- listeners ----------
  // Compact header + shadow, progress line, and hide-on-scroll-down / show-on-scroll-up.
  @HostListener('window:scroll')
  onScroll(): void {
    const y = window.scrollY;
    this.scrolled.set(y > 8);

    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.progress.set(max > 0 ? Math.min(100, (y / max) * 100) : 0);

    if (this.anyPanelOpen() || y < 240) {
      this.hidden.set(false);
    } else if (y > this.lastY + 6) {
      this.hidden.set(true);
    } else if (y < this.lastY - 6) {
      this.hidden.set(false);
    }
    this.lastY = y;
  }

  // If the window grows to desktop size, make sure the mobile menu is not left open.
  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 992 && this.menuOpen()) this.menuOpen.set(false);
  }

  // Close any open panel when the user clicks outside the header.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.closeAll();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAll();
  }

  // Press "/" anywhere (outside a text field) to open search.
  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    const t = event.target as HTMLElement | null;
    const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if (typing) return;
    event.preventDefault();
    if (!this.searchOpen()) this.toggleSearch();
  }
}