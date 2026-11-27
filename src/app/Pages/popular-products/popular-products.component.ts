import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { CardComponent } from '../../CommonCard/card/card.component';
import { RevealDirective } from '../../Shared/reveal.directive';

@Component({
  selector: 'app-popular-products',
  imports: [RouterLink, CardComponent, RevealDirective],
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
