import { Component } from '@angular/core';
import { BannerComponent } from '../banner/banner.component';
import { BrandsComponent } from '../brands/brands.component';
import { PopularProductsComponent } from '../popular-products/popular-products.component';
import { HappyCustomerComponent } from '../happy-customer/happy-customer.component';

@Component({
  selector: 'app-home',
  imports: [BannerComponent, BrandsComponent, PopularProductsComponent, HappyCustomerComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
