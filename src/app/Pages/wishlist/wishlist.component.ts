import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CartService } from '../../Common-Service/cart.service';
import { WishlistItem, WishlistService } from '../../Common-Service/wishlist.service';
import { ToastService } from '../../Common-Service/toast.service';
import { RevealDirective } from '../../Shared/reveal.directive';

type WishSort = 'added' | 'price-asc' | 'price-desc' | 'name';

@Component({
  selector: 'app-wishlist',
  imports: [RouterLink, CurrencyPipe, RevealDirective],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent {
  wishlist = inject(WishlistService);
  cart = inject(CartService);
  private toast = inject(ToastService);

  search = signal('');
  sortBy = signal<WishSort>('added');

  visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    let list = this.wishlist.items().filter(i => !term || i.name.toLowerCase().includes(term));

    const sort = this.sortBy();
    if (sort !== 'added') {
      list = [...list].sort((a, b) => {
        if (sort === 'price-asc') return a.price - b.price;
        if (sort === 'price-desc') return b.price - a.price;
        return a.name.localeCompare(b.name);
      });
    }
    return list;
  });

  addToCart(item: WishlistItem): void {
    this.cart.add({ id: item.id, name: item.name, price: item.price, image: item.image });
    this.toast.show(`${item.name} added to cart`, 'success', 'bi-bag-check-fill');
  }

  moveToCart(item: WishlistItem): void {
    this.addToCart(item);
    this.wishlist.remove(item.id);
  }

  moveAllToCart(): void {
    const items = this.wishlist.items();
    for (const item of items) this.cart.add({ id: item.id, name: item.name, price: item.price, image: item.image });
    items.forEach(i => this.wishlist.remove(i.id));
    this.toast.show(`${items.length} ${items.length === 1 ? 'item' : 'items'} moved to cart`, 'success', 'bi-bag-check-fill');
  }

  remove(item: WishlistItem): void {
    this.wishlist.remove(item.id);
    this.toast.show('Removed from wishlist', 'info', 'bi-heart');
  }

  async clearAll(): Promise<void> {
    const result = await Swal.fire({
      title: 'Clear your wishlist?',
      text: 'All saved shoes will be removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear it',
      cancelButtonText: 'Keep them',
      confirmButtonColor: '#e10b1f',
      cancelButtonColor: '#0a0a0c'
    });
    if (result.isConfirmed) {
      [...this.wishlist.items()].forEach(i => this.wishlist.remove(i.id));
      this.toast.show('Wishlist cleared', 'info');
    }
  }
}
