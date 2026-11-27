
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';

import { MyServiceService } from '../../Common-Service/my-service.service';
import { CartService } from '../../Common-Service/cart.service';
import { WishlistService } from '../../Common-Service/wishlist.service';
import { ToastService } from '../../Common-Service/toast.service';

import { RevealDirective } from '../../Shared/reveal.directive';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, RouterLink, RevealDirective],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {

  product: any = null;
  isLoading = true;
  notFound = false;

  imageUrl: string;
  qty = 1;

  cart = inject(CartService);
  wishlist = inject(WishlistService);
  private toast = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private myService: MyServiceService,
    private router: Router
  ) {
    this.imageUrl = this.myService.imageUrl;
  }

  // ---------- Quantity ----------
  changeQty(delta: number): void {
    this.qty = Math.min(10, Math.max(1, this.qty + delta));
  }

  // ---------- Add to Cart ----------
  addToCart(): void {

    if (!this.product?.isStock) return;

    this.cart.add(
      {
        id: this.product.productId,
        name: this.product.productName,
        price: Number(this.product.price),
        image: this.imageUrl + this.product.productImage,
        size: this.product.size != null
          ? String(this.product.size)
          : undefined
      },
      this.qty
    );

    this.toast.show(
      `${this.qty} x ${this.product.productName} added to cart`,
      'success',
      'bi-bag-check-fill'
    );
  }

  // ---------- Wishlist ----------
  toggleWishlist(): void {

    if (!this.product) return;

    const wasSaved = this.wishlist.has(this.product.productId);

    this.wishlist.toggle({
      id: this.product.productId,
      name: this.product.productName,
      price: Number(this.product.price),
      image: this.imageUrl + this.product.productImage
    });

    this.toast.show(
      wasSaved ? 'Removed from wishlist' : 'Saved to wishlist',
      wasSaved ? 'info' : 'success',
      'bi-heart-fill'
    );
  }

goToCheckout(): void {

  if (!this.product || !this.product.isStock) {
    return;
  }

  this.router.navigate(
    ['/checkout', this.product.productId],
    {
      queryParams: {
        quantity: this.qty
      }
    }
  );

}
  // ---------- Load Product ----------
  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = Number(params.get('id'));

      if (id > 0) {
        this.loadProduct(id);
      } else {
        this.isLoading = false;
        this.notFound = true;
      }

    });

  }

  loadProduct(id: number): void {

    this.isLoading = true;
    this.notFound = false;
    this.qty = 1;

    this.myService.getProductDetails(id).subscribe({

      next: (res) => {

        this.product = res.data;

        this.isLoading = false;
        this.notFound = !this.product;

      },

      error: () => {

        this.product = null;
        this.isLoading = false;
        this.notFound = true;

      }

    });

  }

}
