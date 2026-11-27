import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { CartService } from '../../Common-Service/cart.service';
import { InvoiceService } from '../../Common-Service/invoice.service';
import { ProfileService } from '../../Common-Service/profile.service';
import { AppSettings, SettingsService } from '../../Common-Service/settings.service';
import { ToastService } from '../../Common-Service/toast.service';
import { WishlistService } from '../../Common-Service/wishlist.service';

@Component({
  selector: 'app-settings',
  imports: [RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  store = inject(SettingsService);
  user = inject(ProfileService);
  cart = inject(CartService);
  wishlist = inject(WishlistService);
  invoices = inject(InvoiceService);
  private toast = inject(ToastService);

  toggle(key: keyof AppSettings, event: Event): void {
    this.store.set(key, (event.target as HTMLInputElement).checked);
  }

  async confirm(title: string, text: string): Promise<boolean> {
    const result = await Swal.fire({
      title, text, icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Yes, do it', cancelButtonText: 'Cancel',
      confirmButtonColor: '#e10b1f', cancelButtonColor: '#0a0a0c'
    });
    return result.isConfirmed;
  }

  async clearCart(): Promise<void> {
    if (await this.confirm('Empty your cart?', 'All items will be removed.')) {
      this.cart.clear();
      this.toast.show('Cart emptied', 'info');
    }
  }

  async clearWishlist(): Promise<void> {
    if (await this.confirm('Clear your wishlist?', 'All saved shoes will be removed.')) {
      [...this.wishlist.items()].forEach(i => this.wishlist.remove(i.id));
      this.toast.show('Wishlist cleared', 'info');
    }
  }

  async clearInvoices(): Promise<void> {
    if (await this.confirm('Delete saved invoices?', 'Invoice copies stored on this device will be deleted. Your orders are not affected, and you can open an invoice again from the order history.')) {
      this.invoices.clear();
      this.toast.show('Invoices deleted', 'info');
    }
  }

  resetSettings(): void {
    this.store.reset();
    this.toast.show('Settings reset to defaults');
  }
}
