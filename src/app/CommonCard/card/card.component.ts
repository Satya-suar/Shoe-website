import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';

@Component({
  selector: 'app-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})
export class CardComponent {

  // pass a single product object: { productId, productName, productImage, size, color, brandName, price, isStock }
  @Input() product: any;

  imageUrl: string;

  constructor(private myService: MyServiceService) {
    this.imageUrl = this.myService.imageUrl;
  }
}
