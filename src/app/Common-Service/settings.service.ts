import { Injectable, effect, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';

export interface AppSettings {
  animations: boolean;      // page + hover animations
  orderUpdates: boolean;    // notification preference (saved on this device)
  offers: boolean;          // notification preference (saved on this device)
  prefillCheckout: boolean; // fill checkout from profile + saved address
}

const DEFAULTS: AppSettings = {
  animations: true,
  orderUpdates: true,
  offers: false,
  prefillCheckout: true
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly KEY = 'shoekart_settings';

  readonly settings = signal<AppSettings>({
    ...DEFAULTS,
    ...readStorage<Partial<AppSettings>>(this.KEY, {})
  });

  constructor() {
    // Turning animations off adds a class that the global CSS uses to stop all motion.
    effect(() => {
      const on = this.settings().animations;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('no-motion', !on);
      }
    });
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings.update(s => ({ ...s, [key]: value }));
    writeStorage(this.KEY, this.settings());
  }

  reset(): void {
    this.settings.set({ ...DEFAULTS });
    writeStorage(this.KEY, this.settings());
  }
}
