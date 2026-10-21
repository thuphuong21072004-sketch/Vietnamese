import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '@web/services/booking.service';
import { PaymentService } from '@web/services/payment.service';
import { ReviewService } from '@web/services/review.service';
import { VideoRoomService } from '@web/services/video-room.service';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { NavBarComponent } from '../../../ui/nav-bar.component';
import { AvatarComponent } from '../../../ui/avatar.component';
import { BadgeComponent } from '../../../ui/badge.component';
import { IconComponent } from '../../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { T_ICONS, roomUrlOf } from '../teacher.utils';

/** Booking Detail (GV) — chưa có design, dựng theo ui-spec §3.3 (phong cách BookingDetail.dc.html) */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonFooter,
    IonRefresher,
    IonRefresherContent,
    DatePipe,
    CurrencyPipe,
    NavBarComponent,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-booking-detail.page.html',
  styleUrls: ['../teacher-shared.css', './teacher-booking-detail.page.css'],
})
export class TeacherBookingDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);
  private paymentService = inject(PaymentService);
  private reviewService = inject(ReviewService);
  private roomService = inject(VideoRoomService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = T_ICONS;
  readonly stars = [1, 2, 3, 4, 5];

  loading = true;
  booking: any = null;
  payment: any = null;
  review: any = null;
  private id = 0;

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    this.loading = !event;
    this.cdr.markForCheck();
    try {
      this.booking = await firstValueFrom(this.bookingService.getDetail(this.id));
      const [payment, review] = await Promise.all([
        firstValueFrom(this.paymentService.getByRef('PrivateLesson', this.booking.bookingId)).catch(() => null),
        firstValueFrom(this.reviewService.getByBookingId(this.booking.bookingId)).catch(() => null),
      ]);
      this.payment = payment;
      this.review = review;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load booking'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  get name(): string {
    return this.bookingService.getStudentName(this.booking);
  }

  get avatar(): string {
    return this.bookingService.getStudentAvatar(this.booking);
  }

  get statusText(): string {
    return this.bookingService.getStatusText(this.booking?.status);
  }

  get duration(): number {
    return this.bookingService.getDurationHours(this.booking);
  }

  get paymentStatusText(): string {
    return ({ 0: 'Pending', 1: 'Success', 2: 'Failed', 3: 'Refunded' } as Record<number, string>)[this.payment?.status] ?? '—';
  }

  get paymentMethodText(): string {
    return this.payment?.paymentMethod === 1 ? 'Bank Transfer' : 'Stripe';
  }

  get totalRevenue(): number {
    return Number(this.booking?.totalPrice ?? this.payment?.amount ?? 0);
  }

  /** In Progress + đã thanh toán: mở 30' trước, đóng 15' sau. */
  get canJoin(): boolean {
    const b = this.booking;
    if (!b || b.status !== 2) return false;
    if (this.payment && this.payment.status !== 1) return false;
    const now = Date.now();
    return now >= new Date(b.startTime).getTime() - 30 * 60000 && now <= new Date(b.endTime).getTime() + 15 * 60000;
  }

  get isWaiting(): boolean {
    return this.booking?.status === 1 && Date.now() < new Date(this.booking.startTime).getTime();
  }

  get canCancel(): boolean {
    const b = this.booking;
    if (!b) return false;
    if (b.status === 0) return true;
    if (b.status === 1) return Date.now() < new Date(b.startTime).getTime();
    return false;
  }

  get hasReview(): boolean {
    return !!this.review && !!this.review.comment;
  }

  async join(): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.roomService.join('PrivateLesson', this.booking.bookingId));
      if (res?.joinUrl) {
        window.open(res.joinUrl, '_blank');
        return;
      }
    } catch {
      // chưa có phòng → tạo mới
    }
    try {
      const room = await firstValueFrom(this.roomService.create('PrivateLesson', this.booking.bookingId));
      const url = roomUrlOf(room);
      if (url) window.open(url, '_blank');
      else this.fb.toast('Room created but no URL found', 'error');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to create room'), 'error');
    }
  }

  async cancel(): Promise<void> {
    const ok = await this.fb.confirm({ header: 'Cancel this booking?', okText: 'Cancel Booking', cancelText: 'Keep', danger: true });
    if (!ok) return;
    try {
      await firstValueFrom(this.bookingService.cancel(this.booking.bookingId));
      this.booking = { ...this.booking, status: 4 };
      this.fb.toast('Booking cancelled successfully', 'success');
      this.cdr.markForCheck();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to cancel booking'), 'error');
    }
  }
}
