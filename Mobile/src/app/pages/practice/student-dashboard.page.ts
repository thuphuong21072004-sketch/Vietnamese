import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { StatsService, StudentPaymentStats, MonthlyStudentBreakdown, StudentCourse } from '@web/services/stats.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { LoadingComponent, EmptyStateComponent } from '../../ui/states.component';

const EMPTY_STATS: StudentPaymentStats = {
  totalPaid: 0,
  completedLearning: 0,
  activeLearning: 0,
  cancelledUnrefunded: 0,
  refunded: 0,
  monthlyBreakdown: [],
  courseCount: 0,
  courseTotal: 0,
  courses: [],
};

/** 11 Student Dashboard — design-mobile/screens/StudentDashboard.dc.html */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    CurrencyPipe,
    DatePipe,
    NavBarComponent,
    BadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-dashboard.page.html',
  styleUrls: ['./student-dashboard.page.css'],
})
export class StudentDashboardPage implements OnInit {
  private statsService = inject(StatsService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  stats: StudentPaymentStats = EMPTY_STATS;
  loading = true;
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  selectedMonth = `${this.year}-${String(this.month).padStart(2, '0')}`;
  allTime = false;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(event?: CustomEvent): void {
    if (!event) this.loading = true;
    const [y, m] = this.allTime ? [undefined, undefined] : [this.year, this.month];
    this.statsService.getStudentStats(y, m).subscribe({
      next: (res) => {
        this.stats = { ...EMPTY_STATS, ...res, courses: res?.courses ?? [], monthlyBreakdown: res?.monthlyBreakdown ?? [] };
        this.loading = false;
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
      error: (err) => {
        this.loading = false;
        this.fb.toast(errorMessage(err, 'Cannot load dashboard.'), 'error');
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
    });
    this.cdr.markForCheck();
  }

  onMonthChange(): void {
    if (!this.selectedMonth) return;
    const [y, m] = this.selectedMonth.split('-').map(Number);
    this.year = y;
    this.month = m;
    this.allTime = false;
    this.loadData();
  }

  onAllTimeChange(): void {
    this.loadData();
  }

  /** "October 2026" hoặc "All time" (theo design). */
  get periodLabel(): string {
    if (this.allTime) return 'All time';
    return new Date(this.year, this.month - 1).toLocaleString('en', { month: 'long', year: 'numeric' });
  }

  get smallCards(): { label: string; value: number; money: boolean; color: string }[] {
    const s = this.stats;
    return [
      { label: 'Completed Learning', value: s.completedLearning, money: true, color: '#16a34a' },
      { label: 'Active Learning', value: s.activeLearning, money: true, color: '#2563eb' },
      { label: 'Cancelled (Pending Refund)', value: s.cancelledUnrefunded, money: true, color: '#ea580c' },
      { label: 'Refunded', value: s.refunded, money: true, color: '#dc2626' },
      { label: 'My Courses', value: s.courseCount, money: false, color: '#7c3aed' },
      { label: 'Spent on Courses', value: s.courseTotal, money: true, color: '#7c3aed' },
    ];
  }

  // Enrollment bị hủy / hoàn tiền → hiện theo trạng thái ghi danh, còn lại theo trạng thái lớp (như web)
  courseStatus(c: StudentCourse): string {
    if (c.enrollmentStatus === 4) return 'Cancelled';
    if (c.enrollmentStatus === 5) return 'Refunded';
    return c.status;
  }

  monthLabel(row: MonthlyStudentBreakdown): string {
    return new Date(row.year, row.month - 1).toLocaleString('en', { month: 'long', year: 'numeric' });
  }
}
