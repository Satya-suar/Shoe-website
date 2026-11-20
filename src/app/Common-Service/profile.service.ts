import { Injectable, computed, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  image: string; // data URL, or '' when no photo is set
}

export interface Address {
  id: number;
  label: string;
  line: string;
  city: string;
  pincode: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Guest User',
  email: '',
  phone: '',
  image: ''
};

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly PROFILE_KEY = 'shoekart_profile';
  private readonly ADDRESS_KEY = 'shoekart_addresses';

  readonly profile = signal<UserProfile>({
    ...DEFAULT_PROFILE,
    ...readStorage<Partial<UserProfile>>(this.PROFILE_KEY, {})
  });

  readonly addresses = signal<Address[]>(readStorage<Address[]>(this.ADDRESS_KEY, []));

  readonly initial = computed(() => (this.profile().name.trim().charAt(0) || 'G').toUpperCase());

  update(next: UserProfile): void {
    this.profile.set({ ...next, name: next.name.trim() || DEFAULT_PROFILE.name });
    writeStorage(this.PROFILE_KEY, this.profile());
  }

  /** Logout: clears the profile and saved addresses stored on this device. */
  reset(): void {
    this.profile.set({ ...DEFAULT_PROFILE });
    this.addresses.set([]);
    writeStorage(this.PROFILE_KEY, this.profile());
    writeStorage(this.ADDRESS_KEY, this.addresses());
  }

  addAddress(a: Omit<Address, 'id'>): void {
    this.addresses.update(list => [...list, { ...a, id: Date.now() }]);
    writeStorage(this.ADDRESS_KEY, this.addresses());
  }

  removeAddress(id: number): void {
    this.addresses.update(list => list.filter(a => a.id !== id));
    writeStorage(this.ADDRESS_KEY, this.addresses());
  }
}