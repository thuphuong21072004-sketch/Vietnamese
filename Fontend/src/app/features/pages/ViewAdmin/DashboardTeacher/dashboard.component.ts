import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatsService, TeacherEarningsStats, MonthlyTeacherBreakdown, ClassRevenue } from '../../../services/stats.service';

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardTeacherComponent implements OnInit {
  stats: TeacherEarningsStats = {
    totalFromStudents: 0, completedEarnings: 0,
    activeEarnings: 0, cancelledUnrefunded: 0, monthlyBreakdown: [],
    classCount: 0, studentCount: 0, classes: [],
    totalOwed: 0, totalPaidOut: 0, balance: 0,
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
    this.statsService.getTeacherStats(y, m).subscribe({
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

  get classTotals() {
    return this.stats.classes.reduce(
      (t, c) => ({
        cancelled: t.cancelled + c.cancelledCount,
        revenue: t.revenue + c.totalRevenue,
      }),
      { cancelled: 0, revenue: 0 },
    );
  }

  statusClass(c: ClassRevenue): string {
    return c.status.toLowerCase();
  }

  monthLabel(row: MonthlyTeacherBreakdown): string {
    return `${new Date(row.year, row.month - 1).toLocaleString('en', { month: 'short' })} ${row.year}`;
  }
}
