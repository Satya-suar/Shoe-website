
import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { firstValueFrom, forkJoin, of, combineLatest } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import Swal from 'sweetalert2';

import { CartService } from '../../Common-Service/cart.service';
import { InvoiceItem, InvoiceService } from '../../Common-Service/invoice.service';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { ProfileService } from '../../Common-Service/profile.service';
import { SettingsService } from '../../Common-Service/settings.service';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  // Existing services
  cart = inject(CartService);
  user = inject(ProfileService);

  private settings = inject(SettingsService);
  private invoices = inject(InvoiceService);
  private api = inject(MyServiceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Loading and order status
  busy = signal(false);

  isLoading = false;
  notFound = false;

  // Direct Buy Now checkout
  isDirectCheckout = false;

  directCheckoutItem: any = null;

  // Checkout form
  form = this.fb.group({

    customerName: ['', [
      Validators.required,
      Validators.minLength(3)
    ]],

    mobileNumber: ['', [
      Validators.required,
      Validators.pattern(/^[0-9]{10}$/)
    ]],

    email: ['', [
      Validators.required,
      Validators.email
    ]],

    address: ['', [
      Validators.required,
      Validators.minLength(10)
    ]]

  });

  get f() {
    return this.form.controls;
  }

  // ---------- Checkout Items ----------

  checkoutItems(): any[] {

    if (this.isDirectCheckout) {
      return this.directCheckoutItem
        ? [this.directCheckoutItem]
        : [];
    }

    return this.cart.items();

  }

  // ---------- Checkout Total ----------

  checkoutTotal(): number {

    return this.checkoutItems().reduce(
      (total, item) => total + (Number(item.price) * item.qty),
      0
    );

  }

  // ---------- Initialize Checkout ----------

  ngOnInit(): void {

    // Prefill customer information
    if (this.settings.settings().prefillCheckout) {

      const p = this.user.profile();
      const first = this.user.addresses()[0];

      this.form.patchValue({

        customerName:
          p.name && p.name !== 'Guest User' ? p.name : '',

        mobileNumber: p.phone || '',

        email: p.email || '',

        address: first
          ? `${first.line}, ${first.city} ${first.pincode}`
          : ''

      });

    }

    // Check whether checkout is for a specific product or cart
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ]).subscribe(([params, queryParams]) => {

      const id = Number(params.get('id'));

      if (id > 0) {

        // Direct Buy Now checkout
        this.isDirectCheckout = true;

        const quantity = Number(queryParams.get('quantity')) || 1;

        const validQuantity = Math.max(
          1,
          Math.min(10, quantity)
        );

        this.loadDirectProduct(id, validQuantity);

      } else {

        // Normal cart checkout
        this.isDirectCheckout = false;

        this.directCheckoutItem = null;

        this.isLoading = false;

        this.notFound = false;

      }

    });

  }

  // ---------- Load Direct Product ----------

  loadDirectProduct(id: number, quantity: number): void {

    this.isLoading = true;
    this.notFound = false;
    this.directCheckoutItem = null;

    this.api.getProductDetails(id).subscribe({

      next: (res: any) => {

        const product = res?.data;

        if (!product || !product.isStock) {

          this.directCheckoutItem = null;
          this.notFound = true;
          this.isLoading = false;

          return;

        }

        // Convert API product into checkout item format
        this.directCheckoutItem = {

          id: product.productId ?? id,

          name: product.productName,

          price: Number(product.price),

          image: this.api.imageUrl + product.productImage,

          size: product.size != null
            ? String(product.size)
            : undefined,

          qty: quantity

        };

        this.isLoading = false;

      },

      error: () => {

        this.directCheckoutItem = null;

        this.notFound = true;

        this.isLoading = false;

      }

    });

  }

  // ---------- Saved Address ----------

  useSaved(id: string): void {

    const a = this.user.addresses().find(
      x => String(x.id) === id
    );

    if (a) {

      this.form.patchValue({

        address: `${a.line}, ${a.city} ${a.pincode}`

      });

    }

  }

  // ---------- Place Order ----------

  /**
   * Supports both:
   * 1. Normal cart checkout
   * 2. Direct Buy Now checkout
   *
   * Each pair is placed as its own order.
   */

  async placeOrder(): Promise<void> {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    const lines = this.checkoutItems();

    if (!lines.length) {

      Swal.fire({
        icon: 'warning',
        title: 'No products',
        text: 'Please select a product before placing your order.',
        confirmButtonColor: '#e10b1f'
      });

      return;

    }

    const customer = {

      customerName: this.form.value.customerName!,

      mobileNumber: this.form.value.mobileNumber!,

      email: this.form.value.email!,

      address: this.form.value.address!

    };

    this.busy.set(true);

    const ids = [
      ...new Set(lines.map(l => l.id))
    ];

    // Verify current product details from API
    const details = await firstValueFrom(

      forkJoin(

        ids.map(id =>
          this.api.getProductDetails(id).pipe(

            map((r: any) => r?.data ?? null),

            catchError(() => of(null))

          )
        )

      )

    );

    const byId = new Map<number, any>(

      ids.map((id, i) => [id, details[i]])

    );

    const placed: InvoiceItem[] = [];

    const problems: string[] = [];

    let orderRef: string | number | undefined;

    // Place individual product orders
    for (const line of lines) {

      const d = byId.get(line.id);

      if (!d) {

        problems.push(`${line.name}: could not be checked`);

        continue;

      }

      if (!d.isStock) {

        problems.push(`${line.name}: out of stock`);

        continue;

      }

      let ok = 0;

      // One API order per pair
      for (let n = 0; n < line.qty; n++) {

        try {

          const res: any = await firstValueFrom(

            this.api.placeOrder({

              productId: d.productId ?? line.id,

              brandId: d.brandId,

              price: d.price,

              ...customer

            })

          );

          orderRef ??=
            typeof res?.data === 'number'
              ? res.data
              : (
                  res?.data?.orderId ??
                  res?.data?.id ??
                  res?.orderId
                );

          ok++;

        } catch {

          break;

        }

      }

      if (ok > 0) {

        placed.push({

          name: line.name,

          brand: d.brandName,

          size: line.size,

          color: d.color,

          qty: ok,

          price: Number(d.price),

          image: line.image

        });

      }

      // Update cart only during normal cart checkout
      if (!this.isDirectCheckout) {

        if (ok === line.qty) {

          this.cart.remove(line.id, line.size);

        } else {

          if (ok > 0) {

            this.cart.setQty(
              line.id,
              line.qty - ok,
              line.size
            );

          }

          problems.push(
            `${line.name}: ${ok} of ${line.qty} placed`
          );

        }

      } else if (ok < line.qty) {

        problems.push(
          `${line.name}: ${ok} of ${line.qty} placed`
        );

      }

    }

    this.busy.set(false);

    // If all orders failed
    if (placed.length === 0) {

      Swal.fire({

        icon: 'error',

        title: 'Order failed',

        text: problems.length
          ? problems.join('. ')
          : 'Something went wrong. Please try again.',

        confirmButtonColor: '#e10b1f'

      });

      return;

    }

    // Generate invoice
    const invoice = this.invoices.create(

      {

        name: customer.customerName,

        mobile: customer.mobileNumber,

        email: customer.email,

        address: customer.address

      },

      placed,

      orderRef

    );

    // Order confirmation
    await Swal.fire({

      icon: problems.length ? 'warning' : 'success',

      title: problems.length
        ? 'Order partly placed'
        : 'Order placed!',

      text: problems.length
        ? problems.join('. ') + '.'
        : 'Your order has been placed successfully.',

      footer: `Invoice ${invoice.no} is ready`,

      confirmButtonText: 'View invoice',

      confirmButtonColor: '#e10b1f'

    });

    this.router.navigate([
      '/invoice',
      invoice.no
    ]);

  }

}
