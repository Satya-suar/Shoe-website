import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { MyServiceService } from '../../Common-Service/my-service.service';

@Component({
  selector: 'app-order-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent {

  // product passed from the product-details page: { productId, brandId, price }
  @Input() product: any;
  @Output() orderPlaced = new EventEmitter<void>();

  orderForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private myService: MyServiceService
  ) {
    this.orderForm = this.fb.group({
      customerName: ['', [Validators.required, Validators.minLength(3)]],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  get f() {
    return this.orderForm.controls;
  }

  submitOrder() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    const orderData = {
      productId: this.product.productId,
      brandId: this.product.brandId,
      price: this.product.price,
      customerName: this.orderForm.value.customerName,
      mobileNumber: this.orderForm.value.mobileNumber,
      email: this.orderForm.value.email,
      address: this.orderForm.value.address
    };

    this.isSubmitting = true;

    this.myService.placeOrder(orderData).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'success',
          title: 'Order Placed!',
          text: res.message || 'Your order has been placed successfully.',
          confirmButtonColor: '#16181d'
        });
        this.orderForm.reset();
        this.orderPlaced.emit();
      },
      error: (err) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Order Failed',
          text: err?.error?.message || 'Something went wrong. Please try again.',
          confirmButtonColor: '#16181d'
        });
      }
    });
  }
}
