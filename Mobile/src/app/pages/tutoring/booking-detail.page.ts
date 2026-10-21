import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '@web/services/booking.service';
import { PaymentService } from '@web/services/payment.service';
import { ReviewService } from '@web/services/review.service';
import { VideoRoomService } from '@web/services/video-room.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { IconComponent } from '../../ui/icon.component';
import { LoadingComponent, EmptyStateComponent } from '../../ui/states.component';
import {
  durationHours,
  hoursLabel,
  inJoinWindow,
  joinWindow,
  money,
  paymentMethodText,
  paymentStatusText,
} from './tutoring.utils';

/** 16 Booking Detail — design-mobile/screens/BookingDetail.dc.html */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonFooter,
    DatePipe,
    NavBarComponent,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-detail.page.html',
  styleUrls: ['./tutoring.shared.css', './booking-detail.page.css'],
})
export class BookingDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private nav = inject(NavController);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FeedbackService);
  private paymentService = inject(PaymentService);
  private roomService = inject(VideoRoomService);
  private reviewService = inject(ReviewService);
  readonly bookingService = inject(BookingService);

  readonly money = money;
  readonly videoIcon = 'M23 7l-7 5 7 5zM1 5h15v14H1z';

  loading = true;
  booking: any = null;
  payment: any = null;
  room: any = null;
  review: any = null;
  cancelLoading = false;
  joinLoading = false;
  private id = 0;
  private entered = false;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  /** Quay lại từ Payment / Review → cập nhật trạng thái. */
  ionViewWillEnter(): void {
    if (this.entered) this.load(true);
    this.entered = true;
  }

  private async load(silent = false): Promise<void> {
    if (!silent) this.loading = true;
    try {
      this.booking = await firstValueFrom(this.bookingService.getDetail(this.id));
      this.loadPayment();
      this.loadRoom();
      this.loadReview();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load booking'), 'error');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private loadPayment(): void {
    this.paymentService.getByRef('PrivateLesson', this.booking.bookingId).subscribe({
      next: (res) => {
        this.payment = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.payment = null;
        this.cdr.markForCheck();
      },
    });
  }

  private loadRoom(): void {
    this.roomService.join('PrivateLesson', this.booking.bookingId).subscribe({
      next: (res) => {
        this.room = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.room = null;
        this.cdr.markForCheck();
      },
    });
  }

  private loadReview(): void {
    this.reviewService.getByBookingId(this.booking.bookingId).subscribe({
      next: (res) => {
        this.review = res;
        this.cdr.markForCheck();
      },
      error: () => {
        this.review = null;
        this.cdr.markForCheck();
      },
    });
  }

  // ---------- Hiển thị ----------

  get teacherName(): string {
    return this.bookingService.getTeacherName(this.booking);
  }
  get specialty(): string {
    return this.bookingService.getTeacherSpecialty(this.booking) || 'Vietnamese Teacher';
  }
  get durationText(): string {
    return hoursLabel(durationHours(this.booking?.startTime, this.booking?.endTime));
  }
  /** Web để trống 2 dòng này — mobile lấy từ payment; không có thì ẩn. */
  get paymentStatus(): string {
    return this.payment ? paymentStatusText(this.payment.status) : '';
  }
  get paymentMethod(): string {
    return this.payment ? paymentMethodText(this.payment.paymentMethod) : '';
  }

  // ---------- Điều kiện nút (theo web) ----------

  canPay(): boolean {
    return this.booking?.status === 0 && (!this.payment || this.payment.status !== 1);
  }

  canJoinRoom(): boolean {
    if (this.booking?.status !== 2) return false;
    if (!this.payment || this.payment.status !== 1) return false;
    return inJoinWindow(this.booking.startTime, this.booking.endTime);
  }

  joinWindowMessage(): string {
    if (this.booking?.status !== 2) return '';
    const { openAt, closeAt } = joinWindow(this.booking.startTime, this.booking.endTime);
    const now = new Date();
    if (now < openAt) return 'Room opens 30 minutes before class start.';
    if (now > closeAt) return 'Room access has expired.';
    return '';
  }

  canReview(): boolean {
    if (this.booking?.status !== 3) return false;
    if (this.payment && this.payment.status !== 1) return false;
    return !this.review;
  }

  canCancel(): boolean {
    if (!this.booking) return false;
    if (this.booking.status === 0) return true;
    if (this.booking.status === 1) return new Date() < new Date(this.booking.startTime);
    return false;
  }

  // ---------- Hành động ----------

  goPayment(): void {
    this.nav.navigateForward(['/payment', this.booking.bookingId]);
  }

  writeReview(): void {
    this.nav.navigateForward(['/review', this.booking.bookingId]);
  }

  async joinRoom(): Promise<void> {
    if (!this.canJoinRoom()) {
      this.fb.toast(this.joinWindowMessage() || 'Room is not available right now.');
      return;
    }
    this.joinLoading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.roomService.join('PrivateLesson', this.booking.bookingId));
      if (res?.joinUrl) {
        window.open(res.joinUrl, '_blank');
      } else {
        this.nav.navigateForward(['/room', this.booking.bookingId]);
      }
    } catch {
      this.nav.navigateForward(['/room', this.booking.bookingId]);
    } finally {
      this.joinLoading = false;
      this.cdr.markForCheck();
    }
  }

  openRoomLink(): void {
    if (this.room?.joinUrl) window.open(this.room.joinUrl, '_blank');
  }

  async cancelBooking(): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Cancel this booking?',
      message: 'This action cannot be undone.',
      okText: 'Cancel Booking',
      cancelText: 'Keep',
      danger: true,
    });
    if (!ok) return;
    this.cancelLoading = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.bookingService.cancel(this.booking.bookingId));
      this.booking = { ...this.booking, status: 4 };
      this.fb.toast('Booking cancelled successfully', 'success');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to cancel booking'), 'error');
    } finally {
      this.cancelLoading = false;
      this.cdr.markForCheck();
    }
  }
}
