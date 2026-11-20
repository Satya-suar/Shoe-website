import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Particle {
  tx: number; ty: number;      // target (on the letters)
  sx: number; sy: number;      // start (random spot in the footer)
  px: number; py: number;      // perpendicular unit vector (for the swirl)
  sw: number;                  // swirl amount
  delay: number; dur: number;  // seconds
  s: number; a: number;        // size, alpha
  ox: number; oy: number;      // mouse offset
  vx: number; vy: number;      // mouse velocity
}

interface Ember { x: number; y: number; r: number; vy: number; ph: number; a: number; }

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
})
export class FooterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('footer') footerRef!: ElementRef<HTMLElement>;
  @ViewChild('fx') canvasRef!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);
  private zone = inject(NgZone);

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

  /* ---------- particle engine state ---------- */
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private raf = 0;
  private started = false;
  private visible = false;
  private reduced = false;

  private ctx!: CanvasRenderingContext2D;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private t0 = 0;
  private formedAt = 0;

  private ivory: Particle[] = [];
  private crimson: Particle[] = [];
  private embers: Ember[] = [];

  private mx = -9999;
  private my = -9999;
  private resizeTimer?: ReturnType<typeof setTimeout>;

  private readonly WORD = 'SHOEKART';

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.inView.set(true);
      return;
    }

    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!('IntersectionObserver' in window)) {
      this.inView.set(true);
      this.start();
      return;
    }

    this.io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          this.visible = e.isIntersecting;
          if (e.intersectionRatio >= 0.2 && !this.started) {
            this.zone.run(() => this.inView.set(true));
            this.start();
          }
        }
      },
      { threshold: [0, 0.2] }
    );
    this.io.observe(this.footerRef.nativeElement);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.resizeTimer);
    this.io?.disconnect();
    this.ro?.disconnect();
    const f = this.footerRef?.nativeElement;
    f?.removeEventListener('pointermove', this.onMove);
    f?.removeEventListener('pointerleave', this.onLeave);
  }

  /* =====================================================
     Start: wait for the font, build particles, run the loop
     ===================================================== */
  private async start() {
    if (this.started) return;
    this.started = true;

    try {
      await document.fonts.load('700 120px "Playfair Display"');
      await document.fonts.ready;
    } catch { /* fall back to Georgia */ }

    this.zone.runOutsideAngular(() => {
      this.build(this.reduced);              // reduced motion → already formed
      this.t0 = performance.now();
      this.visible = true;

      const f = this.footerRef.nativeElement;
      f.addEventListener('pointermove', this.onMove);
      f.addEventListener('pointerleave', this.onLeave);

      this.ro = new ResizeObserver(() => {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
          const w = f.clientWidth, h = f.clientHeight;
          if (Math.abs(w - this.W) > 1 || Math.abs(h - this.H) > 1) {
            this.build(true);                // rebuild without replaying the intro
            if (this.reduced) this.draw(9999);
          }
        }, 150);
      });
      this.ro.observe(f);

      if (this.reduced) {
        this.draw(9999);                     // single static frame
      } else {
        this.raf = requestAnimationFrame(this.frame);
      }
    });
  }

  /* ---------- pointer ---------- */
  private onMove = (ev: PointerEvent) => {
    const f = this.footerRef.nativeElement;
    const r = f.getBoundingClientRect();
    this.mx = ev.clientX - r.left;
    this.my = ev.clientY - r.top;
    f.style.setProperty('--mx', this.mx + 'px');
    f.style.setProperty('--my', this.my + 'px');
  };

  private onLeave = () => {
    this.mx = -9999;
    this.my = -9999;
  };

  /* =====================================================
     Build: sample the word "SHOEKART" into particle targets
     ===================================================== */
  private build(skipIntro: boolean) {
    const footer = this.footerRef.nativeElement;
    const W = footer.clientWidth;
    const H = footer.clientHeight;
    if (!W || !H) return;

    const cv = this.canvasRef.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    this.ctx = cv.getContext('2d')!;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = W; this.H = H; this.dpr = dpr;

    const word = this.WORD;
    const font = (s: number) => `700 ${s}px "Playfair Display", Georgia, "Times New Roman", serif`;

    const off = document.createElement('canvas');
    const octx = off.getContext('2d', { willReadFrequently: true })!;

    const measure = (fs: number) => {
      octx.font = font(fs);
      const spacing = fs * 0.04;
      const widths = [...word].map((c) => octx.measureText(c).width);
      const total = widths.reduce((a, b) => a + b, 0) + spacing * (word.length - 1);
      return { spacing, widths, total };
    };

    let fs = Math.min(W * 0.17, 230);
    let m = measure(fs);
    if (m.total > W * 0.96) {
      fs *= (W * 0.96) / m.total;
      m = measure(fs);
    }

    const sh = Math.ceil(fs * 1.25);
    off.width = Math.ceil(W);
    off.height = sh;
    octx.font = font(fs);
    octx.textBaseline = 'alphabetic';

    const baseY = sh * 0.84;
    const startX = (W - m.total) / 2;
    const starts: number[] = [];
    let cx = startX;
    m.widths.forEach((w) => { starts.push(cx); cx += w + m.spacing; });

    // where the strip sits inside the footer (baseline slightly below the bottom edge)
    const offY = H - baseY + fs * 0.06;

    const sample = (step: number): [number, number][] => {
      const data = octx.getImageData(0, 0, off.width, sh).data;
      const pts: [number, number][] = [];
      for (let y = 0; y < sh; y += step) {
        for (let x = 0; x < off.width; x += step) {
          if (data[(y * off.width + x) * 4 + 3] > 100) {
            pts.push([
              x + (Math.random() - 0.5) * step * 0.6,
              y + (Math.random() - 0.5) * step * 0.6,
            ]);
          }
        }
      }
      return pts;
    };

    const letterOf = (x: number) => {
      let idx = 0;
      for (let i = 0; i < starts.length; i++) if (x >= starts[i]) idx = i;
      return idx;
    };

    this.ivory = [];
    this.crimson = [];

    const make = (x: number, y: number, kind: 'edge' | 'fill'): Particle => {
      const tx = x, ty = y + offY;
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      const dx = tx - sx, dy = ty - sy;
      const d = Math.hypot(dx, dy) || 1;
      const letter = letterOf(x);
      return {
        tx, ty, sx, sy,
        px: -dy / d, py: dx / d,
        sw: (Math.random() - 0.5) * 180,
        delay: skipIntro ? 0 : letter * 0.34 + Math.random() * 0.55,
        dur: skipIntro ? 0.001 : 1.3 + Math.random() * 1.0,
        s: kind === 'edge' ? 1 + Math.random() * 0.9 : 0.8 + Math.random() * 0.7,
        a: kind === 'edge' ? 0.55 + Math.random() * 0.4 : 0.25 + Math.random() * 0.25,
        ox: 0, oy: 0, vx: 0, vy: 0,
      };
    };

    // pass 1 - letter outlines (dense)
    octx.clearRect(0, 0, off.width, sh);
    octx.strokeStyle = '#fff';
    octx.lineWidth = Math.max(1.5, fs * 0.012);
    [...word].forEach((c, i) => octx.strokeText(c, starts[i], baseY));
    sample(3).forEach(([x, y]) => {
      const p = make(x, y, 'edge');
      (Math.random() < 0.3 ? this.crimson : this.ivory).push(p);
    });

    // pass 2 - letter interiors (sparse dust)
    octx.clearRect(0, 0, off.width, sh);
    octx.fillStyle = '#fff';
    [...word].forEach((c, i) => octx.fillText(c, starts[i], baseY));
    sample(Math.max(9, Math.round(fs * 0.045))).forEach(([x, y]) => {
      const p = make(x, y, 'fill');
      (Math.random() < 0.6 ? this.crimson : this.ivory).push(p);
    });

    // time at which the last particle has landed
    const letters = word.length;
    this.formedAt = skipIntro ? 0 : (letters - 1) * 0.34 + 0.55 + 2.3;

    // drifting embers (whole footer)
    const count = Math.round(Math.min(46, W / 40));
    this.embers = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 0.8 + Math.random() * 1.8,
      vy: -(0.15 + Math.random() * 0.45),
      ph: Math.random() * Math.PI * 2,
      a: 0.25 + Math.random() * 0.5,
    }));
  }

  /* =====================================================
     Render loop
     ===================================================== */
  private frame = (ts: number) => {
    this.raf = requestAnimationFrame(this.frame);
    if (!this.visible) return;               // pause while off-screen
    this.draw((ts - this.t0) / 1000);
  };

  private draw(now: number) {
    const { ctx, W, H } = this;
    if (!ctx) return;
    const TAU = Math.PI * 2;

    ctx.clearRect(0, 0, W, H);

    /* --- embers: slow rising sparks --- */
    const emberFade = Math.min(1, Math.max(0, (now - 0.3) / 2));
    ctx.fillStyle = 'rgb(215,31,45)';
    for (const e of this.embers) {
      if (!this.reduced) {
        e.y += e.vy;
        e.x += Math.sin(now * 0.8 + e.ph) * 0.25;
        if (e.y < -10) { e.y = H + 10; e.x = Math.random() * W; }
      }
      const tw = 0.5 + 0.5 * Math.sin(now * 2 + e.ph);
      ctx.globalAlpha = e.a * tw * emberFade * 0.22;      // soft halo
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 3.2, 0, TAU); ctx.fill();
      ctx.globalAlpha = e.a * (0.35 + tw * 0.65) * emberFade;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, TAU); ctx.fill();
    }

    /* --- particles forming the name --- */
    const formed = now > this.formedAt;
    // diagonal light sweep that runs along the word once it is complete
    const shineX = formed ? (((now - this.formedAt) * W * 0.2) % (W * 1.7)) - W * 0.35 : -99999;
    const bandW = W * 0.07;
    const R = 120;                                         // mouse radius
    const mx = this.mx, my = this.my;

    const groups: [string, Particle[]][] = [
      ['rgb(245,239,230)', this.ivory],
      ['rgb(215,31,45)', this.crimson],
    ];

    for (const [color, list] of groups) {
      ctx.fillStyle = color;
      for (const p of list) {
        const t = Math.min(1, (now - p.delay) / p.dur);
        if (t <= 0) continue;

        let x: number, y: number, a = p.a, s = p.s;

        if (t < 1) {
          // flying in: ease-out path with a sideways swirl, fading in
          const e = 1 - Math.pow(1 - t, 3);
          const sw = Math.sin(Math.PI * t) * p.sw;
          x = p.sx + (p.tx - p.sx) * e + p.px * sw;
          y = p.sy + (p.ty - p.sy) * e + p.py * sw;
          a *= Math.min(1, t * 2.5);
          s += (1 - t) * 0.9;                              // comets shrink as they land
        } else {
          // settled: mouse pushes particles away, springs pull them home
          const cxp = p.tx + p.ox, cyp = p.ty + p.oy;
          const dx = cxp - mx, dy = cyp - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = 1 - d / R;
            p.vx += (dx / d) * f * 3;
            p.vy += (dy / d) * f * 3;
          }
          p.vx += -p.ox * 0.07; p.vy += -p.oy * 0.07;
          p.vx *= 0.84;         p.vy *= 0.84;
          p.ox += p.vx;         p.oy += p.vy;
          x = p.tx + p.ox;
          y = p.ty + p.oy;

          if (formed) {                                    // light sweep
            const b = Math.max(0, 1 - Math.abs(p.tx - p.ty * 0.4 - shineX) / bandW);
            if (b > 0) { a = Math.min(1, a + b * 0.9); s += b * 1.1; }
          }
        }

        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}