import { Injectable, computed, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';
// import { readStorage, writeStorage } from './storage';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  size?: string;
  qty: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly KEY = 'shoekart_cart';

  readonly items = signal<CartItem[]>(readStorage<CartItem[]>(this.KEY, []));
  readonly count = computed(() => this.items().reduce((sum, i) => sum + i.qty, 0));
  readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price * i.qty, 0));

  add(item: Omit<CartItem, 'qty'>, qty = 1): void {
    this.update(list => {
      const found = list.find(i => i.id === item.id && i.size === item.size);
      if (found) {
        return list.map(i => (i === found ? { ...i, qty: i.qty + qty } : i));
      }
      return [...list, { ...item, qty }];
    });
  }

  setQty(id: number, qty: number, size?: string): void {
    if (qty < 1) {
      this.remove(id, size);
      return;
    }
    this.update(list => list.map(i => (i.id === id && i.size === size ? { ...i, qty } : i)));
  }

  remove(id: number, size?: string): void {
    this.update(list => list.filter(i => !(i.id === id && i.size === size)));
  }

  clear(): void {
    this.update(() => []);
  }

  private update(fn: (list: CartItem[]) => CartItem[]): void {
    this.items.update(fn);
    writeStorage(this.KEY, this.items());
  }
}