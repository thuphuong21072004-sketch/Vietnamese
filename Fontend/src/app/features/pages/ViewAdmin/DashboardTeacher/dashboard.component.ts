import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BookingService } from '../../../services/booking.service';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardTeacherComponent implements OnInit {
  statistics = {
    totalBookings: 0,
    completedBookings: 0,
    upcomingBookings: 0,
    totalTeachingHours: 0,
    totalEarnings: 0,
    averageEarnings: 0,
  };

  paymentStatistics = {
    totalHours: 0,
    salaryAmount: 0,
  };

  salaryHistory: any[] = [];

  totalSalaryRecords = 0;

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
      this.bookingService
        .getTeacherStatistics(this.month, this.year)
        .subscribe({
          next: (res: any) => {
            const totalBookings =
              res.totalBookings ??
              res.TotalBookings ??
              0;

            const completedBookings =
              res.completedBookings ??
              res.CompletedBookings ??
              0;

            const confirmedBookings =
              res.confirmedBookings ??
              res.ConfirmedBookings ??
              0;

            const inProgressBookings =
              res.inProgressBookings ??
              res.InProgressBookings ??
              0;

            this.statistics.totalBookings =
              totalBookings;

            this.statistics.completedBookings =
              completedBookings;

            this.statistics.upcomingBookings =
              confirmedBookings +
              inProgressBookings;

            this.calculateAverage();

            resolve();
          },

          error: (err: any) => {
            console.error(err);
            resolve();
          },
        });
    });
  }

  calculateAverage(): void {
    this.statistics.averageEarnings =
      this.statistics.completedBookings > 0
        ? this.statistics.totalEarnings /
          this.statistics.completedBookings
        : 0;
  }

  onMonthChange(): void {
    const [year, month] =
      this.selectedMonth
        .split('-')
        .map(Number);

    this.year = year;
    this.month = month;

    this.page = 1;

    this.loadData();
  }
}
