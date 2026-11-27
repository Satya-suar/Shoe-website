import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../Shared/reveal.directive';

@Component({
  selector: 'app-about',
  imports: [RouterLink, RevealDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent {
  values = [
    { icon: 'bi-patch-check-fill', title: 'Quality first', text: 'We pick brands and pairs we would wear ourselves.', back: 'Brands you can trust' },
    { icon: 'bi-tag-fill', title: 'Honest prices', text: 'Clear prices on every pair, with no surprises at checkout.', back: 'What you see is what you pay' },
    { icon: 'bi-eye-fill', title: 'Clear details', text: 'Size, color and stock status shown before you decide.', back: 'No guessing' },
    { icon: 'bi-heart-fill', title: 'People first', text: 'Real help when you need it, from a real team.', back: 'We are here for you' }
  ];

  steps = [
    { n: '01', title: 'Find your pair', text: 'Search, filter by size, color, brand or price, and save favorites to your wishlist.' },
    { n: '02', title: 'Order in a few taps', text: 'Buy one pair right away, or fill your cart and check out together.' },
    { n: '03', title: 'Keep your invoice', text: 'Every order gets an invoice copy you can print or save as a PDF.' }
  ];
}
