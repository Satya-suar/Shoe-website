import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

/**
 * Fades an element in the first time it scrolls into view.
 *   <div appReveal>            -> fade up
 *   <div appReveal [revealDelay]="120" revealFrom="left">
 */
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  @Input() revealDelay = 0;
  @Input() revealFrom: '' | 'left' | 'right' = '';

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.classList.add('reveal');
    if (this.revealFrom) node.classList.add(`from-${this.revealFrom}`);
    if (this.revealDelay) node.style.transitionDelay = `${this.revealDelay}ms`;

    if (typeof IntersectionObserver === 'undefined') {
      node.classList.add('in');
      return;
    }

    this.observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('in');
            this.observer?.disconnect();
          }
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    this.observer.observe(node);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
