import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { OrderFormComponent } from '../order-form/order-form.component';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, RouterLink, OrderFormComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent {

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
   openBuyForm() {
    this.showOrderForm = !this.showOrderForm;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id > 0) {
        this.loadProduct(id);
      }
    });
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
       this.showOrderForm = false;
    }
  }
}
