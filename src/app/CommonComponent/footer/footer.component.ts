import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

// Rename the class / selector to match your existing footer component.
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('footer') footerRef!: ElementRef<HTMLElement>;

  private platformId = inject(PLATFORM_ID);
  private observer?: IntersectionObserver;

  /** becomes true once the footer scrolls into view; CSS does the animating */
  inView = signal(false);

  year = new Date().getFullYear();

  brandLetters = 'ShoeKart'.split('');

  socials = [
    { label: 'Facebook', icon: 'bi-facebook', url: '#' },
    { label: 'Instagram', icon: 'bi-instagram', url: '#' },
    { label: 'X (Twitter)', icon: 'bi-twitter-x', url: '#' },
    { label: 'YouTube', icon: 'bi-youtube', url: '#' },
    { label: 'WhatsApp', icon: 'bi-whatsapp', url: '#' },
  ];

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.inView.set(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      this.inView.set(true);
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.inView.set(true);
          this.observer?.disconnect(); // animate once
        }
      },
      { threshold: 0.2 }
    );

    this.observer.observe(this.footerRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}