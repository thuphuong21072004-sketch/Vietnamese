import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatsService, StudentPaymentStats, MonthlyStudentBreakdown } from '../../../services/stats.service';

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
  };

  loading = false;
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  selectedMonth = new Date().toISOString().substring(0, 7);

  constructor(private statsService: StatsService) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.statsService.getStudentStats(this.year, this.month).subscribe({
      next: res => { this.stats = res; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  onMonthChange(): void {
    const [y, m] = this.selectedMonth.split('-').map(Number);
    this.year = y; this.month = m;
    this.loadData();
  }

  monthLabel(row: MonthlyStudentBreakdown): string {
    return `${new Date(row.year, row.month - 1).toLocaleString('en', { month: 'short' })} ${row.year}`;
  }
}
