import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';

@Component({
  selector: 'app-brands',
  imports: [CommonModule, RouterLink],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.css'
})
export class BrandsComponent {

  
  @Input() limit: number = 0;
  @Input() showViewAll: boolean = false;

  brandList: any[] = [];
  isLoading = true;
  imageUrl: string;

  constructor(private myService: MyServiceService) {
    this.imageUrl = this.myService.imageUrl;
  }

  ngOnInit(): void {
    this.myService.getBrands().subscribe({
      next: (res) => {
        let brands = res.data || [];
        this.brandList = this.limit > 0 ? brands.slice(0, this.limit) : brands;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
