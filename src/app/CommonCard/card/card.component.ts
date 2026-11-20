import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { CartService } from '../../Common-Service/cart.service';
import { WishlistService } from '../../Common-Service/wishlist.service';

@Component({
  selector: 'app-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {

  // pass a single product object: { productId, productName, productImage, size, color, brandName, price, isStock }
  @Input() product: any;

  imageUrl: string;

  cart = inject(CartService);
  wishlist = inject(WishlistService);

  // true for a moment after "Add to cart" so the button can confirm
  added = signal(false);

  constructor(private myService: MyServiceService) {
    this.imageUrl = this.myService.imageUrl;
  }

  toggleWishlist(): void {
    this.wishlist.toggle({
      id: this.product.productId,
      name: this.product.productName,
      price: Number(this.product.price),
      image: this.imageUrl + this.product.productImage
    });
  }

  addToCart(): void {
    if (!this.product.isStock) return;

    this.cart.add({
      id: this.product.productId,
      name: this.product.productName,
      price: Number(this.product.price),
      image: this.imageUrl + this.product.productImage,
      size: this.product.size != null ? String(this.product.size) : undefined
    });

    this.added.set(true);
    setTimeout(() => this.added.set(false), 1500);
  }
}