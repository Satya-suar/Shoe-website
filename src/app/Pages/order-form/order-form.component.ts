import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { ProfileService } from '../../Common-Service/profile.service';
import { SettingsService } from '../../Common-Service/settings.service';
import { InvoiceService } from '../../Common-Service/invoice.service';

@Component({
  selector: 'app-order-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './order-form.component.html',
  styleUrl: './order-form.component.css'
})
export class OrderFormComponent implements OnInit {

  // product passed from the product-details page: { productId, brandId, price, productName, ... }
  @Input() product: any;
  @Output() orderPlaced = new EventEmitter<void>();

  orderForm: FormGroup;
  isSubmitting = false;

  user = inject(ProfileService);
  private settings = inject(SettingsService);
  private invoices = inject(InvoiceService);
  private router = inject(Router);

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

  ngOnInit(): void {
    // Save the shopper some typing: use the profile and first saved address.
    if (!this.settings.settings().prefillCheckout) return;

    const p = this.user.profile();
    const first = this.user.addresses()[0];
    this.orderForm.patchValue({
      customerName: p.name && p.name !== 'Guest User' ? p.name : '',
      mobileNumber: p.phone || '',
      email: p.email || '',
      address: first ? this.formatAddress(first) : ''
    });
  }

  get f() {
    return this.orderForm.controls;
  }

  useSaved(id: string): void {
    const found = this.user.addresses().find(a => String(a.id) === id);
    if (found) this.orderForm.patchValue({ address: this.formatAddress(found) });
  }

  private formatAddress(a: { line: string; city: string; pincode: string }): string {
    return `${a.line}, ${a.city} ${a.pincode}`;
  }

  submitOrder() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    const value = this.orderForm.value;
    const orderData = {
      productId: this.product.productId,
      brandId: this.product.brandId,
      price: this.product.price,
      customerName: value.customerName,
      mobileNumber: value.mobileNumber,
      email: value.email,
      address: value.address
    };

    this.isSubmitting = true;

    this.myService.placeOrder(orderData).subscribe({
      next: (res) => {
        this.isSubmitting = false;

        // Keep an invoice copy on this device.
        const orderRef = typeof res?.data === 'number' ? res.data : (res?.data?.orderId ?? res?.data?.id ?? res?.orderId);
        const invoice = this.invoices.create(
          { name: value.customerName, mobile: value.mobileNumber, email: value.email, address: value.address },
          [{
            name: this.product.productName,
            brand: this.product.brandName,
            size: this.product.size != null ? String(this.product.size) : undefined,
            color: this.product.color,
            qty: 1,
            price: Number(this.product.price),
            image: this.product.productImage ? this.myService.imageUrl + this.product.productImage : undefined
          }],
          orderRef
        );

        this.orderForm.reset();
        this.orderPlaced.emit();

        Swal.fire({
          icon: 'success',
          title: 'Order placed!',
          text: res.message || 'Your order has been placed successfully.',
          footer: `Invoice ${invoice.no} is ready`,
          showCancelButton: true,
          confirmButtonText: 'View invoice',
          cancelButtonText: 'Keep shopping',
          confirmButtonColor: '#e10b1f',
          cancelButtonColor: '#0a0a0c'
        }).then(result => {
          if (result.isConfirmed) this.router.navigate(['/invoice', invoice.no]);
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Order failed',
          text: err?.error?.message || 'Something went wrong. Please try again.',
          confirmButtonColor: '#e10b1f'
        });
      }
    });
  }
}
