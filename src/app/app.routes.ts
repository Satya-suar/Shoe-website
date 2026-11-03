import { Routes } from '@angular/router';
import { HomeComponent } from './Pages/home/home.component';
import { ProductListComponent } from './Pages/product-list/product-list.component';
import { ProductDetailsComponent } from './Pages/product-details/product-details.component';
import { BrandsComponent } from './Pages/brands/brands.component';
import { OrderDetailsComponent } from './Pages/order-details/order-details.component';
import { AddBrandComponent } from './Pages/add-brand/add-brand.component';
import { AddProductComponent } from './Pages/add-product/add-product.component';

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
        path:'add-product',
        component:AddProductComponent,
        title:'ShoeKart | Add Product'

    },
    {
        path:'add-brand',
        component:AddBrandComponent,
        title:'ShoeKart | Add Brand'

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
        path: '**',
        redirectTo: ''
    }

];
