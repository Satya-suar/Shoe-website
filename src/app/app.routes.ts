import { Routes } from '@angular/router';

import { HomeComponent } from './Pages/home/home.component';
import { ProductListComponent } from './Pages/product-list/product-list.component';
import { ProductDetailsComponent } from './Pages/product-details/product-details.component';
import { BrandsComponent } from './Pages/brands/brands.component';
import { OrderDetailsComponent } from './Pages/order-details/order-details.component';
import { AddBrandComponent } from './Pages/add-brand/add-brand.component';
import { AddProductComponent } from './Pages/add-product/add-product.component';
import { ProfileComponent } from './Pages/profile/profile.component';
import { ContactComponent } from './Pages/contact/contact.component';
import { AboutComponent } from './Pages/about/about.component';
import { RegisterPageComponent } from './Pages/register-page/register-page.component';
import { authGuard, guestGuard } from './Common-Service/auth.guard';
import { LogoutPageComponent } from './Login/logout-page/logout-page.component';
import { LoginPageComponent } from './Login/login-page/login-page.component';

/*
 * HOW TO READ THIS FILE
 *  - canActivate: [authGuard]   -> page needs a signed-in user (others are sent to /login, then come back)
 *  - canActivate: [guestGuard]  -> page is only for signed-OUT users (signed-in users are sent to "/")
 *  - no canActivate             -> anyone can open it
 */
export const routes: Routes = [

  // ---------- Home ----------
  { path: '', component: HomeComponent, title: 'LuxeKart | Home' },

  // ---------- Account access (signed-out pages) ----------
  { path: 'login',    component: LoginPageComponent,    canActivate: [guestGuard], title: 'LuxeKart | Sign in' },
  { path: 'register', component: RegisterPageComponent, canActivate: [guestGuard], title: 'LuxeKart | Create account' },
  { path: 'logout',   component: LogoutPageComponent,   title: 'LuxeKart | Sign out' },

  // ---------- Public: anyone can browse ----------
  { path: 'products',     component: ProductListComponent,    title: 'LuxeKart | Collections' },
  { path: 'products/:id', component: ProductDetailsComponent, title: 'LuxeKart | Product Details' },
  { path: 'brands',       component: BrandsComponent,         title: 'LuxeKart | Brands' },
  { path: 'about',        component: AboutComponent,          title: 'LuxeKart | About Us' },
  { path: 'contact',      component: ContactComponent,        title: 'LuxeKart | Concierge' },
  {
    path: 'help-center',
    loadComponent: () => import('./Pages/help-center/help-center.component').then(m => m.HelpCenterComponent),
    title: 'LuxeKart | Help Center'
  },
  {
    path: 'cart',
    loadComponent: () => import('./Pages/cart/cart.component').then(m => m.CartComponent),
    title: 'LuxeKart | Cart'
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./Pages/wishlist/wishlist.component').then(m => m.WishlistComponent),
    title: 'LuxeKart | Wishlist'
  },

  // old links: /shop -> /products (query params such as ?q= are kept)
  { path: 'shop', redirectTo: 'products', pathMatch: 'full' },

  // ---------- Protected: sign-in required ----------
  // Normal cart checkout
{
  path: 'checkout',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./Pages/checkout/checkout.component')
      .then(m => m.CheckoutComponent),
  title: 'LuxeKart | Checkout'
},

// Direct product checkout (Buy Now)
{
  path: 'checkout/:id',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./Pages/checkout/checkout.component')
      .then(m => m.CheckoutComponent),
  title: 'LuxeKart | Checkout'
},
  {
    path: 'invoice/:no',
    canActivate: [authGuard],
    loadComponent: () => import('./Pages/invoice/invoice.component').then(m => m.InvoiceComponent),
    title: 'LuxeKart | Invoice'
  },
  { path: 'orders',  component: OrderDetailsComponent, canActivate: [authGuard], title: 'LuxeKart | My Orders' },
  { path: 'profile', component: ProfileComponent,      canActivate: [authGuard], title: 'LuxeKart | My Profile' },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./Pages/settings/settings.component').then(m => m.SettingsComponent),
    title: 'LuxeKart | Settings'
  },

  // ---------- Store management (protected) ----------
  { path: 'add-product', component: AddProductComponent, canActivate: [authGuard], title: 'LuxeKart | Add Product' },
  { path: 'add-brand',   component: AddBrandComponent,   canActivate: [authGuard], title: 'LuxeKart | Add Brand' },

  // ---------- Anything unknown goes home (keep this LAST) ----------
  { path: '**', redirectTo: '' }
];