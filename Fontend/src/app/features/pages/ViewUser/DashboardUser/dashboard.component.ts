import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BookingService } from '../../../services/booking.service';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class UserDashboardComponent implements OnInit {
  statistics = {
    totalBookings: 0,
    completedBookings: 0,
    upcomingBookings: 0,
    cancelledBookings: 0,
  };

  paymentStatistics = {
    totalPaid: 0,
    refundedAmount: 0,
    pendingRefundAmount: 0,
  };

  paymentHistory: any[] = [];

  totalPayments = 0;

  page = 1;

  pageSize = 5;

  month = new Date().getMonth() + 1;

  year = new Date().getFullYear();

  selectedMonth = new Date().toISOString().substring(0, 7);

  loading = false;

  constructor(
    private bookingService: BookingService,
    private paymentService: PaymentService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    Promise.all([
      this.loadStatistics(),
      
    ]).finally(() => {
      this.loading = false;
    });
  }

  loadStatistics(): Promise<void> {
    return new Promise((resolve) => {
      this.bookingService.getMyStatistics(this.month, this.year).subscribe({
        next: (res: any) => {
          this.statistics = {
            totalBookings: res.totalBookings ?? res.TotalBookings ?? 0,

            completedBookings:
              res.completedBookings ?? res.CompletedBookings ?? 0,

            upcomingBookings: res.upcomingBookings ?? res.UpcomingBookings ?? 0,

            cancelledBookings:
              res.cancelledBookings ?? res.CancelledBookings ?? 0,
          };

          resolve();
        },

        error: () => resolve(),
      });
    });
  }


  onMonthChange(): void {
    const [year, month] = this.selectedMonth.split('-').map(Number);

    this.year = year;
    this.month = month;

    this.page = 1;

    this.loadData();
  }
}
