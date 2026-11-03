import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MyServiceService } from '../../Common-Service/my-service.service';

@Component({
  selector: 'app-order-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit {

  orderList: any[] = [];
  isLoading = true;
  imageUrl: string;

  constructor(private myService: MyServiceService) {
    this.imageUrl = this.myService.imageUrl;
  }

  ngOnInit(): void {
    this.myService.getOrders().subscribe({
      next: (res) => {
        this.orderList = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
