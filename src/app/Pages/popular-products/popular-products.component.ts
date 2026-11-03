import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { CardComponent } from '../../CommonCard/card/card.component';

@Component({
  selector: 'app-popular-products',
  imports: [CommonModule, CardComponent],
  templateUrl: './popular-products.component.html',
  styleUrl: './popular-products.component.css'
})
export class PopularProductsComponent implements OnInit {

  productList: any[] = [];
  isLoading = true;

  constructor(private myService: MyServiceService) { }

  ngOnInit(): void {
    this.myService.getPopularProducts().subscribe({
      next: (res) => {
        this.productList = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
