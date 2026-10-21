import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe, UpperCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { PaymentService } from '@web/services/payment.service';
import { BookingService } from '@web/services/booking.service';
import { ClassEnrollmentService } from '@web/services/class-enrollment.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent } from '../../ui/icon.component';
import { LoadingComponent } from '../../ui/states.component';
import { money } from './tutoring.utils';

type Method = 'stripe' | 'bank';

/**
 * 14 Payment — design-mobile/screens/Payment.dc.html (design vẽ tab VietQR; tab Card dựng cùng phong cách).
 * /payment/:id (booking 1-1) hoặc /payment/:id?type=CLASS (enrollment lớp nhóm).
 */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, DatePipe, DecimalPipe, UpperCasePipe, NavBarComponent, IconComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment.page.html',
  styleUrls: ['./tutoring.shared.css', './payment.page.css'],
})
export class PaymentPage implements OnInit {
  private route = inject(ActivatedRoute);
  private nav = inject(NavController);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FeedbackService);
  private paymentService = inject(PaymentService);
  private bookingService = inject(BookingService);
  private enrollmentService = inject(ClassEnrollmentService);

  readonly money = money;
  readonly cardIcon = 'M2 5h20v14H2zM2 10h20';
  readonly bankIcon = 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3';
  readonly lockIcon = 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4';
  readonly checkIcon = 'M20 6 9 17l-5-5';
  readonly clockIcon = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2';

  refId = 0;
  refName = 'PrivateLesson';
  dataLoading = true;
  booking: any = null;
  enrollment: any = null;
  payment: any = null;
  bankInfo: any = null;
  method: Method = 'stripe';
  selectedCurrency = 'USD';
  loading = false;

  get isClass(): boolean {
    return this.refName === 'CLASS';
  }

  ngOnInit(): void {
    this.refId = Number(this.route.snapshot.paramMap.get('id'));
    this.refName = this.route.snapshot.queryParamMap.get('type') || 'PrivateLesson';
    this.load();
  }

  private async load(): Promise<void> {
    this.dataLoading = true;
    await Promise.all([this.loadRef(), this.loadPayment()]);
    this.dataLoading = false;
    this.cdr.markForCheck();
  }

  private async loadRef(): Promise<void> {
    try {
      if (this.isClass) {
        this.enrollment = await firstValueFrom(this.enrollmentService.getDetail(this.refId));
      } else {
        this.booking = await firstValueFrom(this.bookingService.getDetail(this.refId));
      }
      this.loadBankInfo();
    } catch (err) {
      this.fb.toast(errorMessage(err, this.isClass ? 'Failed to load enrollment' : 'Failed to load booking'), 'error');
    }
  }

  private async loadPayment(): Promise<void> {
    try {
      this.payment = await firstValueFrom(this.paymentService.getByRef(this.refName, this.refId));
    } catch {
      this.payment = null;
    }
  }

  private loadBankInfo(): void {
    this.paymentService.getBankInfo(this.amount).subscribe({
      next: (res) => {
        this.bankInfo = res;
        this.cdr.markForCheck();
      },
      error: () => {},
    });
  }

  // ---------- Thông tin hiển thị ----------

  /** Lớp học: entity ClassEnrollment có teacherClass; phòng khi API trả DTO phẳng thì đọc thẳng. */
  get tc(): any {
    return this.enrollment?.teacherClass ?? this.enrollment ?? null;
  }

  get pricePerHour(): number {
    return Number(this.booking?.instructor?.teacherProfile?.approvedPricePerHour || 0);
  }

  /** Số tiền theo công thức web (giá/giờ × thời lượng, tối thiểu 0.5h); thiếu giá thì dùng totalPrice của booking. */
  get amount(): number {
    if (!this.isClass && this.booking) {
      const price = this.pricePerHour;
      if (!price) return Number(this.booking.totalPrice || 0);
      const hours = Math.max(
        0.5,
        (new Date(this.booking.endTime).getTime() - new Date(this.booking.startTime).getTime()) / 3600000,
      );
      return Math.round((price * hours + Number.EPSILON) * 100) / 100;
    }
    if (this.isClass && this.tc) return Number(this.tc.price || 0);
    return 0;
  }

  get duration(): string {
    if (!this.booking) return '-';
    const total = Math.max(
      30,
      Math.round((new Date(this.booking.endTime).getTime() - new Date(this.booking.startTime).getTime()) / 60000),
    );
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h <= 0) return `${m}m`;
    if (m <= 0) return h === 1 ? '1 hour' : `${h} hours`;
    return `${h}h ${m}m`;
  }

  get teacherName(): string {
    if (this.isClass) {
      return this.tc?.teacherProfile?.user?.name || this.tc?.teacherProfile?.teacherName || this.enrollment?.teacherName || '';
    }
    return this.booking?.instructor?.name || this.bookingService.getTeacherName(this.booking);
  }

  get courseTitle(): string {
    return this.tc?.title || this.enrollment?.classTitle || '';
  }

  get isPaid(): boolean {
    return this.payment?.status === 1;
  }

  get isBankPending(): boolean {
    return this.payment?.paymentMethod === 1 && this.payment?.status === 0;
  }

  get qrUrl(): string {
    if (!this.bankInfo) return '';
    const amountVnd = Math.round(this.bankInfo.vndAmount || 0);
    const info = encodeURIComponent(`${this.bankInfo.note} #${this.refId}`);
    const name = encodeURIComponent(this.bankInfo.accountName);
    return `https://img.vietqr.io/image/${this.bankInfo.bankId}-${this.bankInfo.accountNo}-compact2.png?amount=${amountVnd}&accountName=${name}&addInfo=${info}`;
  }

  // ---------- Hành động ----------

  setMethod(m: Method): void {
    this.method = m;
  }

  /** Stripe Checkout: payment Pending/Failed thì tạo lại link; chưa có thì tạo payment trước. */
  async pay(): Promise<void> {
    if (this.amount <= 0) {
      this.fb.toast('Invalid payment amount', 'error');
      return;
    }
    if (this.isPaid || this.loading) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      let paymentId: number;
      if (this.payment && (this.payment.status === 0 || this.payment.status === 2)) {
        paymentId = this.payment.paymentId;
      } else {
        const body = { refName: this.refName, refId: this.refId, amount: this.amount, paymentMethod: 0 };
        const created: any = await firstValueFrom(this.paymentService.create(body as any));
        this.payment = created;
        paymentId = created.paymentId;
      }
      const stripe: any = await firstValueFrom(this.paymentService.createStripeUrl(paymentId, this.selectedCurrency));
      window.location.href = stripe.paymentUrl;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Payment failed'), 'error');
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async submitBankTransfer(): Promise<void> {
    if (!this.bankInfo || this.loading) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(
        this.paymentService.bankTransfer({
          refName: this.refName,
          refId: this.refId,
          amount: this.amount,
          paymentMethod: 1,
        }),
      );
      this.fb.toast('Transfer submitted. Awaiting admin confirmation.', 'success');
      this.goList();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  goList(): void {
    if (this.isClass) {
      this.nav.navigateRoot(['/classes'], { queryParams: { seg: 'mine' } });
    } else {
      this.nav.navigateRoot(['/tutoring'], { queryParams: { seg: 'bookings' } });
    }
  }
}
