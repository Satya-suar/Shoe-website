import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Premium custom cursor: a crisp oxblood dot that tracks the pointer
 * exactly, plus a soft ivory ring that trails behind it.
 *
 * - grows + tints over links / buttons
 * - becomes a thin caret-style bar over text inputs
 * - shows a label over anything with data-cursor="View" (e.g. product cards)
 * - shrinks on press, hides when the pointer leaves the window
 * - disabled automatically on touch devices
 *
 * Add <app-cursor /> once, in app.component.html.
 */
@Component({
  selector: 'app-cursor',
  standalone: true,
  template: `
    <div #ring class="lk-ring" aria-hidden="true">
      <div class="lk-ring-inner"><span class="lk-ring-label"></span></div>
    </div>
    <div #dot class="lk-dot" aria-hidden="true">
      <div class="lk-dot-inner"></div>
    </div>
  `,
  styleUrls: ['./cursor.component.css'],
  encapsulation: ViewEncapsulation.None, // lets the html.lk-cursor-on rule apply globally
})
export class CursorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('ring', { static: true }) ringRef!: ElementRef<HTMLElement>;
  @ViewChild('dot', { static: true }) dotRef!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);

  private raf = 0;
  private tx = -100; private ty = -100;   // pointer position
  private rx = -100; private ry = -100;   // ring position (eased)
  private ease = 0.17;
  private active = false;

  private readonly LINKS =
    'a, button, [role="button"], summary, label[for], select, input[type="checkbox"], input[type="radio"], input[type="range"], .clickable';
  private readonly TEXT =
    'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) {
      this.ringRef.nativeElement.remove();
      this.dotRef.nativeElement.remove();
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.ease = 1;

    this.active = true;
    document.documentElement.classList.add('lk-cursor-on');

    this.zone.runOutsideAngular(() => {
      document.addEventListener('pointermove', this.onMove, { passive: true });
      document.addEventListener('pointerover', this.onOver, { passive: true });
      document.addEventListener('pointerdown', this.onDown, { passive: true });
      document.addEventListener('pointerup', this.onUp, { passive: true });
      document.documentElement.addEventListener('pointerleave', this.onWindowLeave);
      document.documentElement.addEventListener('pointerenter', this.onWindowEnter);
      this.raf = requestAnimationFrame(this.loop);
    });
  }

  ngOnDestroy(): void {
    if (!this.active) return;
    cancelAnimationFrame(this.raf);
    document.documentElement.classList.remove('lk-cursor-on');
    document.removeEventListener('pointermove', this.onMove);
    document.removeEventListener('pointerover', this.onOver);
    document.removeEventListener('pointerdown', this.onDown);
    document.removeEventListener('pointerup', this.onUp);
    document.documentElement.removeEventListener('pointerleave', this.onWindowLeave);
    document.documentElement.removeEventListener('pointerenter', this.onWindowEnter);
  }

  private onMove = (e: PointerEvent) => {
    this.tx = e.clientX;
    this.ty = e.clientY;
    // dot follows instantly
    this.dotRef.nativeElement.style.transform = `translate3d(${this.tx}px, ${this.ty}px, 0)`;
    if (this.rx < 0) { this.rx = this.tx; this.ry = this.ty; } // first move: no fly-in
    this.ringRef.nativeElement.classList.add('is-visible');
    this.dotRef.nativeElement.classList.add('is-visible');
  };

  private onOver = (e: PointerEvent) => {
    const t = e.target as Element | null;
    const ring = this.ringRef.nativeElement;
    const label = ring.querySelector('.lk-ring-label') as HTMLElement;
    if (!t || !t.closest) return;

    const labelled = t.closest('[data-cursor]') as HTMLElement | null;
    ring.classList.toggle('is-label', !!labelled);
    label.textContent = labelled?.dataset['cursor'] ?? '';

    ring.classList.toggle('is-text', !labelled && !!t.closest(this.TEXT));
    ring.classList.toggle('is-link', !labelled && !t.closest(this.TEXT) && !!t.closest(this.LINKS));
  };

  private onDown = () => {
    this.ringRef.nativeElement.classList.add('is-down');
    this.dotRef.nativeElement.classList.add('is-down');
  };

  private onUp = () => {
    this.ringRef.nativeElement.classList.remove('is-down');
    this.dotRef.nativeElement.classList.remove('is-down');
  };

  private onWindowLeave = () => {
    this.ringRef.nativeElement.classList.remove('is-visible');
    this.dotRef.nativeElement.classList.remove('is-visible');
  };

  private onWindowEnter = () => {
    this.ringRef.nativeElement.classList.add('is-visible');
    this.dotRef.nativeElement.classList.add('is-visible');
  };

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    this.rx += (this.tx - this.rx) * this.ease;
    this.ry += (this.ty - this.ry) * this.ease;
    this.ringRef.nativeElement.style.transform = `translate3d(${this.rx}px, ${this.ry}px, 0)`;
  };
}