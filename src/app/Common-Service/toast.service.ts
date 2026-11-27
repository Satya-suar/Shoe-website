import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  kind: 'success' | 'info' | 'error';
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(message: string, kind: Toast['kind'] = 'success', icon?: string): void {
    const defaults = { success: 'bi-check-circle-fill', info: 'bi-info-circle-fill', error: 'bi-exclamation-triangle-fill' };
    const toast: Toast = { id: this.nextId++, message, kind, icon: icon ?? defaults[kind] };
    this.toasts.update(list => [...list.slice(-3), toast]);
    setTimeout(() => this.dismiss(toast.id), 2800);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
