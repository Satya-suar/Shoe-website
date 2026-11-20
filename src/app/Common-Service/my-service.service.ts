import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MyServiceService {

  baseUrl = environment.apiUrl;
  imageUrl = environment.imageUrl;

  constructor(private http: HttpClient) { }

  // brands for the home page / shop page

  addBrand(brandData: any) {
    return this.http.post<any>(`${this.baseUrl}/add-brand`, brandData);
  }

  addProduct(productData: any) {
    return this.http.post<any>(`${this.baseUrl}/add-product`, productData);
  }

  updateProduct(productId: number, productData: any) {
    return this.http.put<any>(`${this.baseUrl}/${productId}`, productData);
  }

  getBrands() {
    return this.http.get<any>(`${this.baseUrl}/get-brands`);
  }

  getPopularProducts() {
    return this.http.get<any>(`${this.baseUrl}/get-popular-products`);
  }

  // Get all products
getAllProducts(): Observable<any> {
  return this.http.get<any>(
    `${this.baseUrl}/get-all-products`
  );
}

// Get products by brand
getProductsByBrand(brandId: number): Observable<any> {
  return this.http.get<any>(
    `${this.baseUrl}/get-products-by-brand/${brandId}`
  );
}

// Get product details
getProductDetails(productId: number) {
  return this.http.get<any>(
    `${this.baseUrl}/get-product-details/${productId}`
  );
}

  // place an order (buy now)
  placeOrder(orderData: any) {
    return this.http.post<any>(`${this.baseUrl}/buy-now`, orderData);
  }

  // order history
  getOrders() {
    return this.http.get<any>(`${this.baseUrl}/order-list`);
  }
}