import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { OrderFormComponent } from '../order-form/order-form.component';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, RouterLink, OrderFormComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit, OnDestroy {

  product: any = null;
  isLoading = true;
  notFound = false;
  showOrderForm = false;
  imageUrl: string;

  constructor(
    private route: ActivatedRoute,
    private myService: MyServiceService
  ) {
    this.imageUrl = this.myService.imageUrl;
  }

  // opens the popup (no longer toggles)
  openBuyForm() {
    this.showOrderForm = true;
    document.body.style.overflow = 'hidden';   // lock page scroll behind the popup
  }

  closeBuyForm() {
    this.showOrderForm = false;
    document.body.style.overflow = '';
  }

  // close popup with the Esc key
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showOrderForm) {
      this.closeBuyForm();
    }
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id > 0) {
        this.loadProduct(id);
      }
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';          // release scroll lock when leaving the page
  }

  loadProduct(id: number) {
    this.isLoading = true;
    this.notFound = false;

    this.myService.getProductDetails(id).subscribe({
      next: (res) => {
        this.product = res.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notFound = true;
      }
    });
  }

  // called by the order form once an order has been placed successfully
  onOrderPlaced() {
    if (this.product) {
      this.product.isStock = false;
    }
    this.closeBuyForm();
  }
}