
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
      this.loadOverview(),
      this.loadTeacherReport(),
      this.loadStudentReport(),
    ]).finally(() => {
      this.loading = false;
    });
  }

  loadOverview(): Promise<void> {
    return new Promise((resolve) => {
      this.paymentService
        .getAdminFinanceOverview(
          this.month,
          this.year,
        )
        .subscribe({
          next: (res: any) => {
            const totalPaid =
              res.totalPaid ??
              res.TotalPaid ??
              0;

            const refundedAmount =
              res.refundedAmount ??
              res.RefundedAmount ??
              0;

            const pendingRefundAmount =
              res.pendingRefundAmount ??
              res.PendingRefundAmount ??
              0;

            const teacherSalary =
              res.teacherSalary ??
              res.TeacherSalary ??
              0;

            const totalHours =
              res.totalHours ??
              res.TotalHours ??
              0;

            this.financialOverview = {
              totalPaid,

              refundedAmount,

              pendingRefundAmount,

              teacherSalary,

              totalHours,

              netProfit:
                totalPaid -
                teacherSalary -
                refundedAmount,
            };

            resolve();
          },

          error: (err: any) => {
            console.error(err);
            resolve();
          },
        });
    });
  }

  loadTeacherReport(): Promise<void> {
    return new Promise((resolve) => {
      this.paymentService
        .getTeacherFinanceReport(
          this.month,
          this.year,
          1,
          100,
        )
        .subscribe({
          next: (res: any) => {
            this.teacherFinance =
              res.data ??
              res.Data ??
              [];

            this.teacherTotal =
              res.total ??
              res.Total ??
              0;

            resolve();
          },

          error: (err: any) => {
            console.error(err);
            resolve();
          },
        });
    });
  }

  loadStudentReport(): Promise<void> {
    return new Promise((resolve) => {
      this.paymentService
        .getStudentFinanceReport(
          this.month,
          this.year,
          1,
          100,
        )
        .subscribe({
          next: (res: any) => {
            this.studentFinance =
              res.data ??
              res.Data ??
              [];

            this.studentTotal =
              res.total ??
              res.Total ??
              0;

            resolve();
          },

          error: (err: any) => {
            console.error(err);
            resolve();
          },
        });
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
