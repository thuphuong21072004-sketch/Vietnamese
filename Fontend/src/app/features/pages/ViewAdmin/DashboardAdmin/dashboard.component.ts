
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardAdminComponent implements OnInit {
  financialOverview = {
    totalPaid: 0,

    refundedAmount: 0,

    pendingRefundAmount: 0,

    teacherSalary: 0,

    totalHours: 0,

    netProfit: 0,
  };

  teacherFinance: any[] = [];

  studentFinance: any[] = [];

  teacherTotal = 0;

  studentTotal = 0;

  loading = false;

  month = new Date().getMonth() + 1;

  year = new Date().getFullYear();

  selectedMonth = new Date().toISOString().substring(0, 7);

  constructor(
    private paymentService: PaymentService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    Promise.all([
    ]).finally(() => {
      this.loading = false;
    });
  }

  onMonthChange(): void {
    const [year, month] =
      this.selectedMonth
        .split('-')
        .map(Number);

    this.year = year;

    this.month = month;

    this.loadData();
  }
}
