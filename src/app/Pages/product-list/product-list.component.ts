import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { CardComponent } from '../../CommonCard/card/card.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-product-list',
  imports: [CommonModule, RouterLink, CardComponent, NgxSpinnerModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent {
  productList: any[] = [];
  brandName = '';
  isLoading = true;
  brandId = 0;

  constructor(
    private route: ActivatedRoute,
    private myService: MyServiceService,
    private spinner: NgxSpinnerService,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.brandId = Number(params['brandId']) || 0;
      this.loadProducts();
    });
  }

  loadProducts() {
    if (this.brandId <= 0) {
      this.productList = [];
      return;
    }

    this.spinner.show();
    this.myService.getProductsByBrand(this.brandId).subscribe({
      next: (res) => {
        let products = res.data || [];

        products.sort((a: any, b: any) =>
          a.productName.localeCompare(b.productName),
        );

        this.productList = products;
        this.brandName = products.length > 0 ? products[0].brandName : '';
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
      },
    });
  }
}
