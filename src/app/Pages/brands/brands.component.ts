import { Component, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';
import { RevealDirective } from '../../Shared/reveal.directive';

@Component({
  selector: 'app-brands',
  imports: [RouterLink],
  templateUrl: './brands.component.html',
  styleUrl: './brands.component.css'
})
export class BrandsComponent implements OnInit {

  /** 0 = show every brand. */
  @Input() limit: number = 0;
  /** true on the home page (shows the "View all" link); false on the full /brands page. */
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
        const brands = res.data || [];
        this.brandList = this.limit > 0 ? brands.slice(0, this.limit) : brands;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
