import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { CardComponent } from '../../CommonCard/card/card.component';

type SortKey = 'name' | 'price-asc' | 'price-desc';

interface ActiveFilter {
  kind: 'brand' | 'size' | 'color' | 'price' | 'stock';
  value: string;
  label: string;
}

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, CardComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css',
})
export class ProductListComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private myService = inject(MyServiceService);

  // ---------- Data ----------
  products = signal<any[]>([]);
  isLoading = signal(true);
  loadFailed = signal(false);
  brandId = signal(0); // 0 = all products
  brandName = signal('');

  // ---------- Filters ----------
  search = signal('');
  selectedBrands = signal<string[]>([]);
  selectedSizes = signal<string[]>([]);
  selectedColors = signal<string[]>([]); // stored lower-case
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  inStockOnly = signal(false);
  sortBy = signal<SortKey>('name');

  filtersOpen = signal(false); // mobile filter panel

  private loadedFor = -1;

  // ---------- Options built from the loaded products ----------
  brands = computed(() => {
    const counts = new Map<string, number>();
    for (const p of this.products()) {
      const name = p.brandName ?? 'Other';
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  sizes = computed(() => {
    const counts = new Map<string, number>();
    for (const p of this.products()) {
      const value = String(p.size ?? '').trim();
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, undefined, { numeric: true }));
  });

  colors = computed(() => {
    const map = new Map<string, { key: string; name: string; count: number }>();
    for (const p of this.products()) {
      const name = String(p.color ?? '').trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const entry = map.get(key);
      if (entry) entry.count++;
      else map.set(key, { key, name, count: 1 });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  });

  priceBounds = computed(() => {
    const prices = this.products()
      .map((p) => Number(p.price))
      .filter((n) => !isNaN(n));
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  });

  // ---------- Filtered + sorted result ----------
  filtered = computed(() => {
    const term = this.search().trim().toLowerCase();
    const brands = this.selectedBrands();
    const sizes = this.selectedSizes();
    const colors = this.selectedColors();
    const onlyStock = this.inStockOnly();

    let lo = this.minPrice();
    let hi = this.maxPrice();
    if (lo !== null && hi !== null && lo > hi) [lo, hi] = [hi, lo];

    const list = this.products().filter((p) => {
      if (brands.length && !brands.includes(p.brandName ?? 'Other')) return false;
      if (sizes.length && !sizes.includes(String(p.size ?? '').trim())) return false;
      if (colors.length && !colors.includes(String(p.color ?? '').trim().toLowerCase())) return false;
      if (onlyStock && !p.isStock) return false;

      const price = Number(p.price);
      if (lo !== null && price < lo) return false;
      if (hi !== null && price > hi) return false;

      if (term) {
        const text = `${p.productName} ${p.brandName} ${p.color}`.toLowerCase();
        if (!text.includes(term)) return false;
      }
      return true;
    });

    const sort = this.sortBy();
    return list.sort((a, b) => {
      if (sort === 'price-asc') return Number(a.price) - Number(b.price);
      if (sort === 'price-desc') return Number(b.price) - Number(a.price);
      return String(a.productName).localeCompare(String(b.productName));
    });
  });

  // Removable "tags" shown above the results
  activeFilters = computed<ActiveFilter[]>(() => {
    const out: ActiveFilter[] = [];
    const money = (n: number) => '₹' + n.toLocaleString('en-IN');

    for (const b of this.selectedBrands()) out.push({ kind: 'brand', value: b, label: b });
    for (const s of this.selectedSizes()) out.push({ kind: 'size', value: s, label: `Size ${s}` });
    for (const k of this.selectedColors()) {
      const name = this.colors().find((c) => c.key === k)?.name ?? k;
      out.push({ kind: 'color', value: k, label: name });
    }

    const lo = this.minPrice();
    const hi = this.maxPrice();
    if (lo !== null || hi !== null) {
      const label =
        lo !== null && hi !== null
          ? `${money(lo)} to ${money(hi)}`
          : lo !== null
            ? `From ${money(lo)}`
            : `Up to ${money(hi as number)}`;
      out.push({ kind: 'price', value: 'price', label });
    }

    if (this.inStockOnly()) out.push({ kind: 'stock', value: 'stock', label: 'In stock' });
    return out;
  });

  hasFilters = computed(() => this.activeFilters().length > 0 || !!this.search().trim());

  heading = computed(() => {
    if (this.brandId() > 0) {
      return this.brandName() ? `${this.brandName()} shoes` : 'Brand shoes';
    }
    return 'All shoes';
  });

  countText = computed(() => {
    const total = this.products().length;
    const shown = this.filtered().length;
    const noun = total === 1 ? 'shoe' : 'shoes';
    return this.hasFilters() ? `Showing ${shown} of ${total} ${noun}` : `${total} ${noun}`;
  });

  // ---------- Lifecycle ----------

ngOnInit(): void {
  this.route.queryParamMap.subscribe(params => {
    const id = Number(params.get('brandId')) || 0;
    const searchText = params.get('q') ?? '';

    // Always update search, even when the brand has not changed.
    this.search.set(searchText);

    // Load products only when the selected brand changes.
    if (id !== this.loadedFor) {
      this.brandId.set(id);
      this.resetFilters();
      this.loadProducts();
    }
  });
}


  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

 
loadProducts(): void {
  const id = this.brandId();

  this.loadedFor = id;
  this.isLoading.set(true);
  this.loadFailed.set(false);


  const request$ = id > 0
    ? this.myService.getProductsByBrand(id)
    : this.myService.getAllProducts();

  request$.subscribe({
    next: (res: any) => {

      // Supports both API response formats:
      // { data: [...] }
      // [...]

      const list: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];

      this.products.set(list);

      this.brandName.set(
        id > 0 && list.length > 0
          ? list[0].brandName || ''
          : ''
      );

      this.finish();
    },

    error: (error: any) => {
      console.error('Product loading failed:', error);

      this.products.set([]);
      this.loadFailed.set(true);

      this.finish();
    }
  });
}


  // ---------- Filter actions ----------
  toggleBrand(name: string): void {
    this.toggleIn(this.selectedBrands, name);
  }

  toggleSize(value: string): void {
    this.toggleIn(this.selectedSizes, value);
  }

  toggleColor(key: string): void {
    this.toggleIn(this.selectedColors, key);
  }

  setMin(event: Event): void {
    this.minPrice.set(this.parsePrice(event));
  }

  setMax(event: Event): void {
    this.maxPrice.set(this.parsePrice(event));
  }

  removeFilter(f: ActiveFilter): void {
    switch (f.kind) {
      case 'brand':
        this.toggleBrand(f.value);
        break;
      case 'size':
        this.toggleSize(f.value);
        break;
      case 'color':
        this.toggleColor(f.value);
        break;
      case 'price':
        this.minPrice.set(null);
        this.maxPrice.set(null);
        break;
      case 'stock':
        this.inStockOnly.set(false);
        break;
    }
  }

  clearFilters(): void {
    this.resetFilters();
    this.search.set('');
    // also drop ?q= from the address bar
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: null },
      queryParamsHandling: 'merge',
    });
  }

  // ---------- Mobile filter panel ----------
  openFilters(): void {
    this.filtersOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.filtersOpen()) this.closeFilters();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.filtersOpen() && window.innerWidth >= 992) this.closeFilters();
  }

  // ---------- Helpers ----------
  private resetFilters(): void {
    this.selectedBrands.set([]);
    this.selectedSizes.set([]);
    this.selectedColors.set([]);
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.inStockOnly.set(false);
  }

  private toggleIn(list: WritableSignal<string[]>, value: string): void {
    list.update((items) =>
      items.includes(value) ? items.filter((i) => i !== value) : [...items, value],
    );
  }

  private parsePrice(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value.trim();
    if (raw === '') return null;
    const n = Number(raw);
    return isNaN(n) || n < 0 ? null : n;
  }

  private finish(): void {
    this.isLoading.set(false);
  }
}