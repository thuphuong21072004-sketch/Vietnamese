import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import {
  AdminPaymentStats,
  MonthlyAdminBreakdown,
  PayoutRecord,
  StatsService,
  TeacherPayout,
} from '@web/services/stats.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { BadgeComponent } from '../../ui/badge.component';
import { BadgeTone } from '../../ui/status';
import { IconComponent } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

interface PayoutForm {
  teacherUserId: number;
  amount: number | null;
  paidAt: string; // yyyy-MM-dd
  note: string;
}

const EMPTY_STATS: AdminPaymentStats = {
  totalStudentPayments: 0,
  totalCompletedLearning: 0,
  totalActiveLearning: 0,
  totalCancelledUnrefunded: 0,
  totalRefunded: 0,
  monthlyBreakdown: [],
  teacherPayouts: [],
  uniqueStudentCount: 0,
};

/** 30 Admin Finance — design-mobile/screens/AdminFinance.dc.html */
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
    BadgeComponent,
    IconComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './finance.page.html',
  styleUrls: ['./admin.css', './finance.page.css'],
  host: { class: 'bg-admin' },
})
export class AdminFinancePage implements OnInit {
  private statsService = inject(StatsService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);
  private auth = inject(AuthService);

  readonly chevron = 'm6 9 6 6 6-6';

  stats: AdminPaymentStats = EMPTY_STATS;
  loading = true;
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  selectedMonth = `${this.year}-${String(this.month).padStart(2, '0')}`;
  allTime = false;

  // giáo viên đang mở rộng + lịch sử đã trả
  expandedTeacherId: number | null = null;
  payoutHistory: Record<number, PayoutRecord[]> = {};
  payoutError: Record<number, string> = {};
  payoutLoading: Record<number, boolean> = {};

  // chỉ Admin được ghi nhận / xoá khoản trả (giống web)
  get canManagePayouts(): boolean {
    return (this.auth.user() ?? this.auth.userFromToken())?.role === 'Admin';
  }

  payForm: PayoutForm | null = null;
  saving = false;
  formError = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(event?: CustomEvent): void {
    const [y, m] = this.allTime ? [undefined, undefined] : [this.year, this.month];
    this.statsService.getAdminStats(y, m).subscribe({
      next: (res) => {
        this.stats = { ...EMPTY_STATS, ...res };
        this.loading = false;
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
      error: (err) => {
        this.loading = false;
        this.fb.toast(errorMessage(err, 'Could not load financial data'), 'error');
        this.cdr.markForCheck();
        (event?.target as HTMLIonRefresherElement | undefined)?.complete();
      },
    });
  }

  reload(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.loadData();
  }

  onMonthChange(): void {
    if (!this.selectedMonth) return;
    const [y, m] = this.selectedMonth.split('-').map(Number);
    this.year = y;
    this.month = m;
    this.allTime = false;
    this.reload();
  }

  onAllTimeChange(): void {
    this.reload();
  }

  get periodLabel(): string {
    return this.allTime ? 'All time' : `${this.year}/${String(this.month).padStart(2, '0')}`;
  }

  get payoutTotals() {
    return this.stats.teacherPayouts.reduce(
      (t, p) => ({
        classes: t.classes + p.classCount,
        groupOwed: t.groupOwed + p.groupOwed,
        privateOwed: t.privateOwed + p.privateOwed,
        totalOwed: t.totalOwed + p.totalOwed,
        paidOut: t.paidOut + p.totalPaidOut,
        balance: t.balance + p.balance,
      }),
      { classes: 0, groupOwed: 0, privateOwed: 0, totalOwed: 0, paidOut: 0, balance: 0 },
    );
  }

  get isEmpty(): boolean {
    return !this.stats.monthlyBreakdown.length && !this.stats.teacherPayouts.length;
  }

  // làm tròn đến cent trước khi so sánh
  private cents(n: number): number {
    return Math.round(n * 100) / 100;
  }

  abs(n: number): number {
    return Math.abs(this.cents(n));
  }

  balanceLabel(balance: number): 'Owed' | 'Overpaid' | 'Settled' {
    const b = this.cents(balance);
    if (b > 0) return 'Owed';
    if (b < 0) return 'Overpaid';
    return 'Settled';
  }

  balanceTone(balance: number): BadgeTone {
    const l = this.balanceLabel(balance);
    return l === 'Owed' ? 'orange' : l === 'Overpaid' ? 'danger' : 'success';
  }

  /** Màu chữ ô Balance: còn nợ cam, trả thừa đỏ, đủ xanh. */
  balanceColor(balance: number): string {
    const l = this.balanceLabel(balance);
    return l === 'Owed' ? '#ea580c' : l === 'Overpaid' ? '#dc2626' : '#166534';
  }

  monthLabel(row: MonthlyAdminBreakdown): string {
    return `${new Date(row.year, row.month - 1).toLocaleString('en', { month: 'short' })} ${row.year}`;
  }

  toggleTeacher(t: TeacherPayout): void {
    if (this.expandedTeacherId === t.userId) {
      this.expandedTeacherId = null;
      return;
    }
    this.expandedTeacherId = t.userId;
    this.loadPayouts(t.userId);
  }

  loadPayouts(teacherUserId: number): void {
    delete this.payoutError[teacherUserId];
    this.payoutLoading[teacherUserId] = true;
    this.statsService.getPayouts(teacherUserId).subscribe({
      next: (list) => {
        this.payoutHistory[teacherUserId] = list ?? [];
        this.payoutLoading[teacherUserId] = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        delete this.payoutHistory[teacherUserId];
        this.payoutError[teacherUserId] = errorMessage(err, 'Could not load payout history');
        this.payoutLoading[teacherUserId] = false;
        this.cdr.markForCheck();
      },
    });
  }

  openPayForm(t: TeacherPayout): void {
    this.formError = '';
    const today = new Date();
    this.payForm = {
      teacherUserId: t.userId,
      amount: t.balance > 0 ? this.cents(t.balance) : null,
      // ngày theo giờ máy, không dùng toISOString (UTC)
      paidAt: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      note: '',
    };
  }

  /** Form đang mở cho giáo viên này (null nếu không). */
  formFor(t: TeacherPayout): PayoutForm | null {
    return this.payForm && this.payForm.teacherUserId === t.userId ? this.payForm : null;
  }

  cancelPayForm(): void {
    this.payForm = null;
    this.formError = '';
  }

  savePayout(): void {
    const f = this.payForm;
    if (!f || this.saving) return;
    if (!f.amount || f.amount <= 0) {
      this.formError = 'Amount must be greater than 0';
      return;
    }
    // 12:00 giờ máy → không bị lùi ngày khi đổi sang UTC
    const paidAt = new Date(`${f.paidAt}T12:00:00`);
    if (!f.paidAt || isNaN(paidAt.getTime())) {
      this.formError = 'Please choose a valid payment date';
      return;
    }
    const teacherUserId = f.teacherUserId;
    this.saving = true;
    this.formError = '';
    this.statsService
      .createPayout({ teacherUserId, amount: f.amount, paidAt: paidAt.toISOString(), note: f.note || undefined })
      .subscribe({
        next: () => {
          this.saving = false;
          this.payForm = null;
          this.fb.toast('Payment recorded', 'success');
          this.loadData();
          if (this.expandedTeacherId === teacherUserId) this.loadPayouts(teacherUserId);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.saving = false;
          this.formError = errorMessage(err, 'Could not save payout');
          this.cdr.markForCheck();
        },
      });
  }

  async deletePayout(p: PayoutRecord): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Delete payout',
      message: `Delete payout of $${p.amount} to ${p.teacherName}?`,
      okText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    this.statsService.deletePayout(p.payoutId).subscribe({
      next: () => {
        this.fb.toast('Payout deleted', 'success');
        this.loadData();
        this.loadPayouts(p.teacherUserId);
      },
      error: (err) => this.fb.toast(errorMessage(err, 'Could not delete payout'), 'error'),
    });
  }
}
