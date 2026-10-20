import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import {
  StatsService, AdminPaymentStats, MonthlyAdminBreakdown, TeacherPayout, PayoutRecord, ClassRevenue,
} from '../../../services/stats.service';

interface PayoutForm {
  teacherUserId: number;
  amount: number;
  paidAt: string;   // yyyy-MM-dd
  note: string;
}

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardAdminComponent implements OnInit {
  stats: AdminPaymentStats = {
    totalStudentPayments: 0, totalCompletedLearning: 0, totalActiveLearning: 0,
    totalCancelledUnrefunded: 0, totalRefunded: 0,
    monthlyBreakdown: [], teacherPayouts: [], uniqueStudentCount: 0,
  };

  loading = false;
  year = new Date().getFullYear();
  month = new Date().getMonth() + 1;
  selectedMonth = `${this.year}-${String(this.month).padStart(2, '0')}`;
  allTime = false;

  // dòng giáo viên đang xổ ra + lịch sử đã trả của từng người
  expandedTeacherId: number | null = null;
  payoutHistory: { [teacherUserId: number]: PayoutRecord[] } = {};
  payoutError: { [teacherUserId: number]: string } = {};

  // Moderator xem được dashboard nhưng chỉ Admin được ghi nhận / xoá khoản trả
  readonly canManagePayouts = this.isAdmin();

  payForm: PayoutForm | null = null;
  saving = false;
  errorMessage = '';

  constructor(private statsService: StatsService) {}

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    const [y, m] = this.allTime ? [undefined, undefined] : [this.year, this.month];
    this.statsService.getAdminStats(y, m).subscribe({
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

  // làm tròn đến cent trước khi so sánh: cộng số thực JS có thể để lại sai số (vd 1e-13)
  private cents(n: number): number {
    return Math.round(n * 100) / 100;
  }

  balanceClass(balance: number): string {
    const b = this.cents(balance);
    if (b > 0) return 'balance-due';
    if (b < 0) return 'balance-over';
    return 'money';
  }

  balanceLabel(balance: number): string {
    const b = this.cents(balance);
    if (b > 0) return 'Owed';
    if (b < 0) return 'Overpaid';
    return 'Settled';
  }

  abs(n: number): number { return Math.abs(this.cents(n)); }

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
    this.statsService.getPayouts(teacherUserId).subscribe({
      next: list => { this.payoutHistory[teacherUserId] = list; },
      error: err => {
        delete this.payoutHistory[teacherUserId];
        this.payoutError[teacherUserId] = err?.error?.message || 'Could not load payout history';
      },
    });
  }

  openPayForm(t: TeacherPayout, event?: Event): void {
    event?.stopPropagation();
    this.errorMessage = '';
    const today = new Date();
    this.payForm = {
      teacherUserId: t.userId,
      amount: t.balance > 0 ? Math.round(t.balance * 100) / 100 : 0,
      // ngày theo giờ máy người dùng, không dùng toISOString (UTC)
      paidAt: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
      note: '',
    };
  }

  cancelPayForm(): void {
    this.payForm = null;
    this.errorMessage = '';
  }

  savePayout(): void {
    if (!this.payForm) return;
    if (!this.payForm.amount || this.payForm.amount <= 0) {
      this.errorMessage = 'Amount must be greater than 0';
      return;
    }
    // ngày được chọn, lúc 12:00 giờ máy người dùng → không bị lùi ngày khi đổi sang UTC
    const paidAt = new Date(`${this.payForm.paidAt}T12:00:00`);
    if (!this.payForm.paidAt || isNaN(paidAt.getTime())) {
      this.errorMessage = 'Please choose a valid payment date';
      return;
    }
    const teacherUserId = this.payForm.teacherUserId;
    this.saving = true;
    this.statsService.createPayout({
      teacherUserId,
      amount: this.payForm.amount,
      paidAt: paidAt.toISOString(),
      note: this.payForm.note || undefined,
    }).subscribe({
      next: () => {
        this.saving = false;
        this.payForm = null;
        this.loadData();
        if (this.expandedTeacherId === teacherUserId) this.loadPayouts(teacherUserId);
      },
      error: err => {
        this.saving = false;
        this.errorMessage = err?.error?.message || 'Could not save payout';
      },
    });
  }

  deletePayout(p: PayoutRecord): void {
    if (!confirm(`Delete payout of ${p.amount} to ${p.teacherName}?`)) return;
    this.statsService.deletePayout(p.payoutId).subscribe({
      next: () => {
        this.loadData();
        this.loadPayouts(p.teacherUserId);
      },
    });
  }

  statusClass(c: ClassRevenue): string {
    return c.status.toLowerCase();
  }

  private isAdmin(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload: any = jwtDecode(token);
      const role =
        payload.role ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      return role?.toString().trim().toLowerCase() === 'admin';
    } catch {
      return false;
    }
  }

  monthLabel(row: MonthlyAdminBreakdown): string {
    return `${new Date(row.year, row.month - 1).toLocaleString('en', { month: 'short' })} ${row.year}`;
  }
}
