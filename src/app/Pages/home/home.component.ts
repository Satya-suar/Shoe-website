import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BannerComponent } from '../banner/banner.component';
import { BrandsComponent } from '../brands/brands.component';
import { PopularProductsComponent } from '../popular-products/popular-products.component';
import { HappyCustomerComponent } from '../happy-customer/happy-customer.component';
import { RevealDirective } from '../../Shared/reveal.directive';

@Component({
  selector: 'app-home',
  imports: [RouterLink, BannerComponent, BrandsComponent, PopularProductsComponent, HappyCustomerComponent, RevealDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  features = [
    { icon: 'bi-patch-check-fill', title: 'Handpicked brands', text: 'We stock names you already trust, nothing random.', cta: 'Browse brands', link: '/brands' },
    { icon: 'bi-tag-fill', title: 'Honest prices', text: 'Clear prices on every pair, no filler.', cta: 'See all shoes', link: '/products' },
    { icon: 'bi-eye-fill', title: 'Know before you buy', text: 'Size, color and stock status shown on every product.', cta: 'Open the shop', link: '/products' },
    { icon: 'bi-receipt', title: 'Quick checkout', text: 'Order in a few taps and keep your invoice copy.', cta: 'Go to cart', link: '/cart' }
  ];
}
