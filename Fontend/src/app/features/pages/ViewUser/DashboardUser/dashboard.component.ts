import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatsService, StudentPaymentStats, MonthlyStudentBreakdown, StudentCourse } from '../../../services/stats.service';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class UserDashboardComponent implements OnInit {
  stats: StudentPaymentStats = {
    totalPaid: 0, completedLearning: 0, activeLearning: 0,
    cancelledUnrefunded: 0, refunded: 0, monthlyBreakdown: [],
    courseCount: 0, courseTotal: 0, courses: [],
  };

  loading = false;
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  selectedMonth = `${this.year}-${String(this.month).padStart(2, '0')}`;
  allTime = false;

  constructor(private statsService: StatsService) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    const [y, m] = this.allTime ? [undefined, undefined] : [this.year, this.month];
    this.statsService.getStudentStats(y, m).subscribe({
      next: res => { this.stats = res; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onMonthChange(): void {
    const [y, m] = this.selectedMonth.split('-').map(Number);
    this.year = y; this.month = m;
    this.allTime = false;
    this.loadData();
  }

  get periodLabel(): string {
    return this.allTime ? 'All time' : `${this.year}/${this.month < 10 ? '0' + this.month : this.month}`;
  }

  // enrollment bị hủy / hoàn tiền thì hiện theo trạng thái ghi danh, còn lại theo trạng thái lớp
  courseStatus(c: StudentCourse): string {
    if (c.enrollmentStatus === 4) return 'Cancelled';
    if (c.enrollmentStatus === 5) return 'Refunded';
    return c.status;
  }

  monthLabel(row: MonthlyStudentBreakdown): string {
    return `${new Date(row.year, row.month - 1).toLocaleString('en', { month: 'short' })} ${row.year}`;
  }
}
