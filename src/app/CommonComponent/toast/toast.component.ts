import { Component, inject } from '@angular/core';
import { ToastService } from '../../Common-Service/toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div class="toast-stack" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast-kart" [class.error]="t.kind === 'error'" role="status">
          <i [class]="'bi ' + t.icon"></i>
          <span>{{ t.message }}</span>
          <button type="button" aria-label="Dismiss" (click)="toast.dismiss(t.id)"><i class="bi bi-x-lg"></i></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      left: 50%;
      bottom: 22px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: min(92vw, 420px);
      transform: translateX(-50%);
      pointer-events: none;
    }
    .toast-kart {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px 12px 16px;
      border-radius: 14px;
      border-left: 4px solid var(--red);
      background: var(--black);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35), 0 0 22px rgba(225, 11, 31, 0.35);
      pointer-events: auto;
      animation: toastIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .toast-kart > i { color: var(--red); font-size: 1.15rem; }
    .toast-kart span { flex: 1; }
    .toast-kart button {
      border: 0; background: transparent; color: rgba(255,255,255,.6);
      cursor: pointer; padding: 2px 4px; line-height: 1;
    }
    .toast-kart button:hover { color: #fff; }
    .toast-kart.error { border-left-color: #fff; }
    @keyframes toastIn { from { opacity: 0; transform: translateY(18px) scale(.95); } to { opacity: 1; transform: none; } }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
}
