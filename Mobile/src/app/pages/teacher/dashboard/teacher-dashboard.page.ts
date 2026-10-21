import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { ClassRevenue, MonthlyTeacherBreakdown, StatsService, TeacherEarningsStats } from '@web/services/stats.service';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { StatCardComponent } from '../../../ui/stat-card.component';
import { BadgeComponent } from '../../../ui/badge.component';
import { LoadingComponent, EmptyStateComponent } from '../../../ui/states.component';

/** 25 Teacher Dashboard — design-mobile/screens/TeacherDashboard.dc.html */
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
    StatCardComponent,
    BadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-dashboard.page.html',
  styleUrls: ['./teacher-dashboard.page.css'],
})
export class TeacherDashboardPage implements OnInit {
  private statsService = inject(StatsService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  stats: TeacherEarningsStats = {
    totalFromStudents: 0,
    completedEarnings: 0,
    activeEarnings: 0,
    cancelledUnrefunded: 0,
    monthlyBreakdown: [],
    classCount: 0,
    studentCount: 0,
    classes: [],
    totalOwed: 0,
    totalPaidOut: 0,
    balance: 0,
  };

  loading = true;
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  selectedMonth = `${this.year}-${String(this.month).padStart(2, '0')}`;
  allTime = false;

  ngOnInit(): void {
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    this.loading = !event;
    this.cdr.markForCheck();
    const [y, m] = this.allTime ? [undefined, undefined] : [this.year, this.month];
    try {
      this.stats = await firstValueFrom(this.statsService.getTeacherStats(y, m));
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load dashboard'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  onMonthChange(): void {
    if (!this.selectedMonth) return;
    const [y, m] = this.selectedMonth.split('-').map(Number);
    this.year = y;
    this.month = m;
    this.allTime = false;
    this.load();
  }

  get periodLabel(): string {
    return this.allTime ? 'All time' : `${this.year}/${this.month < 10 ? '0' + this.month : this.month}`;
  }

  get classTotals(): { cancelled: number; revenue: number } {
    return this.stats.classes.reduce(
      (t, c) => ({ cancelled: t.cancelled + c.cancelledCount, revenue: t.revenue + c.totalRevenue }),
      { cancelled: 0, revenue: 0 },
    );
  }

  /** Màu card số dư: cam (còn nợ) / đỏ (trả thừa) / xanh (đã đủ). */
  get balanceTone(): 'owed' | 'over' | 'settled' {
    return this.stats.balance > 0 ? 'owed' : this.stats.balance < 0 ? 'over' : 'settled';
  }

  monthLabel(row: MonthlyTeacherBreakdown): string {
    return `${new Date(row.year, row.month - 1).toLocaleString('en', { month: 'short' })} ${row.year}`;
  }

  trackClass(_: number, c: ClassRevenue): number {
    return c.classId;
  }
}
