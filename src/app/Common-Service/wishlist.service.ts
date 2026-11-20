import { Injectable, computed, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';
// import { readStorage, writeStorage } from './storage';

export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  image: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly KEY = 'shoekart_wishlist';

  readonly items = signal<WishlistItem[]>(readStorage<WishlistItem[]>(this.KEY, []));
  readonly count = computed(() => this.items().length);

  has(id: number): boolean {
    return this.items().some(i => i.id === id);
  }

  /** Adds the product if it isn't saved yet, removes it if it is. */
  toggle(item: WishlistItem): void {
    if (this.has(item.id)) {
      this.remove(item.id);
    } else {
      this.update(list => [...list, item]);
    }
  }

  remove(id: number): void {
    this.update(list => list.filter(i => i.id !== id));
  }

  private update(fn: (list: WishlistItem[]) => WishlistItem[]): void {
    this.items.update(fn);
    writeStorage(this.KEY, this.items());
  }
}