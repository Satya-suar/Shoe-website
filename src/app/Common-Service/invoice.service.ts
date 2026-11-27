import { Injectable, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';

export interface InvoiceItem {
  name: string;
  brand?: string;
  size?: string;
  color?: string;
  qty: number;
  price: number;
  image?: string;
}

export interface InvoiceCustomer {
  name: string;
  mobile: string;
  email: string;
  address: string;
}

export interface Invoice {
  no: string;
  date: string; // ISO string
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
}

/**
 * Keeps a copy of every invoice on this device. The API only stores the order,
 * so the invoice is built here when an order is placed (or rebuilt later from
 * an order in the history list).
 */
@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly KEY = 'shoekart_invoices';
  private readonly MAX = 100;

  readonly invoices = signal<Invoice[]>(readStorage<Invoice[]>(this.KEY, []));

  get(no: string): Invoice | undefined {
    return this.invoices().find(i => i.no === no);
  }

  /** Creates and saves the invoice for a freshly placed order. */
  create(customer: InvoiceCustomer, items: InvoiceItem[], orderRef?: string | number): Invoice {
    const date = new Date();
    const ref = orderRef !== undefined && orderRef !== null && orderRef !== ''
      ? this.cleanRef(orderRef)
      : String(Date.now()).slice(-6);
    const invoice = this.build(`SK-${this.ymd(date)}-${ref}`, date.toISOString(), customer, items);
    this.save(invoice);
    return invoice;
  }

  /** Rebuilds an invoice from an order record returned by the order-list API. */
  fromOrder(order: any, imageBase: string): Invoice {
    const date = order.orderDate ? new Date(order.orderDate) : new Date();
    const safeDate = isNaN(date.getTime()) ? new Date() : date;
    const ref = order.orderId ?? order.id ?? this.hash(`${order.productName}|${order.orderDate}|${order.customerName}`);
    const no = `SK-${this.ymd(safeDate)}-${this.cleanRef(ref)}`;

    const existing = this.get(no);
    if (existing) return existing;

    const invoice = this.build(
      no,
      safeDate.toISOString(),
      {
        name: order.customerName ?? '',
        mobile: order.mobileNumber ?? '',
        email: order.email ?? '',
        address: order.address ?? ''
      },
      [
        {
          name: order.productName ?? 'Shoe',
          brand: order.brandName,
          size: order.size != null ? String(order.size) : undefined,
          color: order.color,
          qty: 1,
          price: Number(order.productPrice ?? order.price ?? 0),
          image: order.productImage ? imageBase + order.productImage : undefined
        }
      ]
    );
    this.save(invoice);
    return invoice;
  }

  clear(): void {
    this.invoices.set([]);
    writeStorage(this.KEY, []);
  }

  private build(no: string, date: string, customer: InvoiceCustomer, items: InvoiceItem[]): Invoice {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    return { no, date, customer, items, subtotal, total: subtotal };
  }

  private save(invoice: Invoice): void {
    const rest = this.invoices().filter(i => i.no !== invoice.no);
    const next = [invoice, ...rest].slice(0, this.MAX);
    this.invoices.set(next);
    writeStorage(this.KEY, next);
  }

  /** Only letters and digits, so an invoice number is always safe in a URL and on screen. */
  private cleanRef(ref: string | number): string {
    return String(ref).replace(/[^A-Za-z0-9]/g, '').slice(0, 12).padStart(5, '0');
  }

  private ymd(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}${m}${day}`;
  }

  private hash(text: string): number {
    let h = 0;
    for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 99999;
    return h;
  }
}
