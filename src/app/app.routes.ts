
import { Routes } from '@angular/router';

import { HomeComponent } from './Pages/home/home.component';
import { ProductListComponent } from './Pages/product-list/product-list.component';
import { ProductDetailsComponent } from './Pages/product-details/product-details.component';
import { BrandsComponent } from './Pages/brands/brands.component';
import { OrderDetailsComponent } from './Pages/order-details/order-details.component';
import { AddBrandComponent } from './Pages/add-brand/add-brand.component';
import { AddProductComponent } from './Pages/add-product/add-product.component';
import { ProfileComponent } from './Pages/profile/profile.component';

// Import CartComponent, WishlistComponent and HelpCenterComponent
// after creating those components.

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'ShoeKart | Home'
  },
  {
    path: 'brands',
    component: BrandsComponent,
    title: 'ShoeKart | Brands'
  },
  {
    path: 'add-product',
    component: AddProductComponent,
    title: 'ShoeKart | Add Product'
  },
  {
    path: 'add-brand',
    component: AddBrandComponent,
    title: 'ShoeKart | Add Brand'
  },
  {
    path: 'products',
    component: ProductListComponent,
    title: 'ShoeKart | Products'
  },
  {
    path: 'products/:id',
    component: ProductDetailsComponent,
    title: 'ShoeKart | Product Details'
  },
  {
    path: 'orders',
    component: OrderDetailsComponent,
    title: 'ShoeKart | My Orders'
  },
  {
    path: 'profile',
    component: ProfileComponent,
    title: 'ShoeKart | My Profile'
  },

  // Add these routes when their components are available:
  // {
  //   path: 'cart',
  //   component: CartComponent,
  //   title: 'ShoeKart | Cart'
  // },
  // {
  //   path: 'wishlist',
  //   component: WishlistComponent,
  //   title: 'ShoeKart | Wishlist'
  // },
  // {
  //   path: 'help-center',
  //   component: HelpCenterComponent,
  //   title: 'ShoeKart | Help Center'
  // },

  {
    path: '**',
    redirectTo: ''
  }
];
