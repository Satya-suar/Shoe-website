import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-happy-customer',
  imports: [CommonModule],
  templateUrl: './happy-customer.component.html',
  styleUrl: './happy-customer.component.css'
})
export class HappyCustomerComponent {

  // static content as per requirement - no API call needed
  customers = [
    {
      name: 'Ritika Sahu',
      image: 'https://i.pravatar.cc/120?img=47',
      review: 'Ordered a pair of running shoes and they arrived well packed, exactly as shown on the site. Sizing guide was spot on.',
      rating: 5,
      postedAgo: '1 Day Ago'
    },
    {
      name: 'Aman Verma',
      image: 'https://i.pravatar.cc/120?img=12',
      review: 'Good collection of brands at fair prices. Placing the order took less than two minutes, no unnecessary steps.',
      rating: 4,
      postedAgo: '2 Days Ago'
    },
    {
      name: 'Priya Nair',
      image: 'https://i.pravatar.cc/120?img=32',
      review: 'The stock status on the product page saved me from ordering something unavailable. Small detail, but very helpful.',
      rating: 5,
      postedAgo: '1 Week Ago'
    }
  ];

  stars = [1, 2, 3, 4, 5];
}
