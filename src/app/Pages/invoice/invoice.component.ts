import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { InvoiceService } from '../../Common-Service/invoice.service';

@Component({
  selector: 'app-invoice',
  imports: [RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.css'
})
export class InvoiceComponent {
  private route = inject(ActivatedRoute);
  private store = inject(InvoiceService);

  private no = toSignal(this.route.paramMap.pipe(map(p => p.get('no') ?? '')), { initialValue: '' });
  invoice = computed(() => this.store.invoices().find(i => i.no === this.no()));

  print(): void {
    window.print();
  }
}
