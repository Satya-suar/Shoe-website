import { Component, computed, inject, signal } from '@angular/core';
import { Location, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from '../../Common-Service/cart.service';
import { ProfileService, UserProfile } from '../../Common-Service/profile.service';
import { WishlistService } from '../../Common-Service/wishlist.service';

type View = 'home' | 'edit' | 'address';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, RouterLink, NgTemplateOutlet],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  user = inject(ProfileService);
  cart = inject(CartService);
  wishlist = inject(WishlistService);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  view = signal<View>('home');
  title = computed(() => {
    const titles: Record<View, string> = {
      home: 'My account',
      edit: 'Edit profile',
      address: 'Shipping address'
    };
    return titles[this.view()];
  });

  notice = signal('');
  photoError = signal('');

  draft: UserProfile = { ...this.user.profile() };
  formError = '';

  newAddress = { label: 'Home', line: '', city: '', pincode: '' };
  addressError = '';

  // The six order shortcuts
  tiles = [
    { label: 'Pending payment', icon: 'bi-wallet2', tone: 'amber', link: '/orders', params: { status: 'pending' } },
    { label: 'Delivered', icon: 'bi-truck', tone: 'green', link: '/orders', params: { status: 'delivered' } },
    { label: 'Processing', icon: 'bi-box-seam', tone: 'blue', link: '/orders', params: { status: 'processing' } },
    { label: 'Cancelled', icon: 'bi-x-circle', tone: 'slate', link: '/orders', params: { status: 'cancelled' } },
    { label: 'Wishlist', icon: 'bi-heart', tone: 'rose', link: '/wishlist', params: {} },
    { label: 'Customer care', icon: 'bi-headset', tone: 'violet', link: '/help-center', params: {} }
  ];

  constructor() {
    // /profile             -> account overview
    // /profile?edit=1      -> Edit profile
    // /profile?tab=address -> Shipping address
    this.route.queryParamMap.subscribe(params => {
      if (params.get('edit')) {
        this.draft = { ...this.user.profile() };
        this.formError = '';
        this.view.set('edit');
      } else if (params.get('tab') === 'address') {
        this.view.set('address');
      } else {
        this.view.set('home');
      }
    });
  }

  goBack(): void {
    if (this.view() !== 'home') {
      this.router.navigate(['/profile']);
    } else if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/']);
    }
  }

  // ---------- Photo ----------
  onPhotoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.photoError.set('Choose an image file (JPG, PNG or WebP).');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.photoError.set('Choose an image smaller than 1 MB.');
      input.value = '';
      return;
    }

    this.photoError.set('');
    const reader = new FileReader();
    reader.onload = () => {
      this.user.update({ ...this.user.profile(), image: reader.result as string });
      this.showNotice('Photo updated');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  removePhoto(): void {
    this.user.update({ ...this.user.profile(), image: '' });
    this.showNotice('Photo removed');
  }

  // ---------- Edit profile ----------
  saveProfile(): void {
    const name = this.draft.name.trim();
    const email = this.draft.email.trim();
    const phone = this.draft.phone.trim();

    if (!name) {
      this.formError = 'Enter your name.';
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.formError = 'Enter a valid email address.';
      return;
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      this.formError = 'Enter a 10-digit phone number.';
      return;
    }

    this.user.update({ ...this.user.profile(), name, email, phone });
    this.formError = '';
    this.router.navigate(['/profile']);
    this.showNotice('Profile updated');
  }

  // ---------- Addresses ----------
  addAddress(): void {
    const { label, line, city, pincode } = this.newAddress;

    if (!line.trim() || !city.trim()) {
      this.addressError = 'Enter the street address and city.';
      return;
    }
    if (!/^\d{6}$/.test(pincode.trim())) {
      this.addressError = 'Enter a 6-digit pincode.';
      return;
    }

    this.user.addAddress({
      label: label.trim() || 'Home',
      line: line.trim(),
      city: city.trim(),
      pincode: pincode.trim()
    });
    this.newAddress = { label: 'Home', line: '', city: '', pincode: '' };
    this.addressError = '';
    this.showNotice('Address saved');
  }

  // ---------- Logout ----------
  logout(): void {
    const ok = window.confirm(
      'Log out of ShoeKart? This clears your profile and saved addresses on this device.'
    );
    if (!ok) return;
    this.user.reset();
    this.router.navigate(['/']);
  }

  private showNotice(message: string): void {
    this.notice.set(message);
    setTimeout(() => this.notice.set(''), 2500);
  }
}