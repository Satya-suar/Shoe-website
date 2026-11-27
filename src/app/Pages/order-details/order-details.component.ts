import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InvoiceService } from '../../Common-Service/invoice.service';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { RevealDirective } from '../../Shared/reveal.directive';

type DateRange = 'all' | '7' | '30' | '90';
type OrderSort = 'newest' | 'oldest' | 'price-desc' | 'price-asc';

@Component({
  selector: 'app-order-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, RevealDirective],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit {

  private invoices = inject(InvoiceService);
  private router = inject(Router);

  orders = signal<any[]>([]);
  isLoading = signal(true);
  loadFailed = signal(false);
  imageUrl: string;

  // filters
  search = signal('');
  range = signal<DateRange>('all');
  brand = signal('');
  sortBy = signal<OrderSort>('newest');

  readonly ranges: { value: DateRange; label: string }[] = [
    { value: 'all', label: 'All time' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' }
  ];

  brands = computed(() => [...new Set(this.orders().map(o => o.brandName).filter(Boolean))].sort() as string[]);

  totalSpent = computed(() => this.orders().reduce((sum, o) => sum + Number(o.productPrice ?? 0), 0));

  visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const range = this.range();
    const brand = this.brand();
    const cutoff = range === 'all' ? 0 : Date.now() - Number(range) * 86400000;

    let list = this.orders().filter(o => {
      if (brand && o.brandName !== brand) return false;
      if (cutoff && new Date(o.orderDate).getTime() < cutoff) return false;
      if (!term) return true;
      return `${o.productName} ${o.brandName} ${o.customerName} ${o.address}`.toLowerCase().includes(term);
    });

    const sort = this.sortBy();
    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return Number(a.productPrice) - Number(b.productPrice);
      if (sort === 'price-desc') return Number(b.productPrice) - Number(a.productPrice);
      const diff = new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
      return sort === 'newest' ? diff : -diff;
    });
    return list;
  });

  filtersActive = computed(() => !!(this.search() || this.brand() || this.range() !== 'all'));

  constructor(private myService: MyServiceService) {
    this.imageUrl = this.myService.imageUrl;
  }

  ngOnInit(): void {
    this.myService.getOrders().subscribe({
      next: (res) => {
        this.orders.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadFailed.set(true);
        this.isLoading.set(false);
      }
    });
  }

  resetFilters(): void {
    this.search.set('');
    this.range.set('all');
    this.brand.set('');
  }

  openInvoice(order: any): void {
    const invoice = this.invoices.fromOrder(order, this.imageUrl);
    this.router.navigate(['/invoice', invoice.no]);
  }
}
