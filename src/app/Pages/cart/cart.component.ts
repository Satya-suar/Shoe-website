import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CartItem, CartService } from '../../Common-Service/cart.service';
import { WishlistService } from '../../Common-Service/wishlist.service';
import { ToastService } from '../../Common-Service/toast.service';

type CartSort = 'added' | 'price-asc' | 'price-desc' | 'name';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  cart = inject(CartService);
  wishlist = inject(WishlistService);
  private toast = inject(ToastService);

  readonly maxQty = 10;

  search = signal('');
  sortBy = signal<CartSort>('added');

  /** Cart lines after the search box and sort are applied. */
  visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    let list = this.cart.items().filter(i => !term || `${i.name} ${i.size ?? ''}`.toLowerCase().includes(term));

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

  changeQty(item: CartItem, delta: number): void {
    const next = Math.min(this.maxQty, item.qty + delta);
    this.cart.setQty(item.id, next, item.size);
  }

  remove(item: CartItem): void {
    this.cart.remove(item.id, item.size);
    this.toast.show(`${item.name} removed`, 'info', 'bi-trash3-fill');
  }

  moveToWishlist(item: CartItem): void {
    if (!this.wishlist.has(item.id)) {
      this.wishlist.toggle({ id: item.id, name: item.name, price: item.price, image: item.image });
    }
    this.cart.remove(item.id, item.size);
    this.toast.show('Moved to wishlist', 'success', 'bi-heart-fill');
  }

  async clearCart(): Promise<void> {
    const result = await Swal.fire({
      title: 'Empty your cart?',
      text: 'All items will be removed from your cart.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, empty it',
      cancelButtonText: 'Keep items',
      confirmButtonColor: '#e10b1f',
      cancelButtonColor: '#0a0a0c'
    });
    if (result.isConfirmed) {
      this.cart.clear();
      this.toast.show('Cart emptied', 'info');
    }
  }

  trackLine(_: number, item: CartItem): string {
    return `${item.id}-${item.size ?? ''}`;
  }
}
