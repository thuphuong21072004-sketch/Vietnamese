import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { BookingService } from '@web/services/booking.service';
import { ReviewService } from '@web/services/review.service';
import { VideoRoomService } from '@web/services/video-room.service';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { AvatarComponent } from '../../../ui/avatar.component';
import { BadgeComponent } from '../../../ui/badge.component';
import { IconComponent } from '../../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { T_ICONS, roomUrlOf } from '../teacher.utils';

/** 29 Student Bookings — design-mobile/screens/TeacherBookings.dc.html */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    RouterLink,
    DatePipe,
    CurrencyPipe,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-bookings.page.html',
  styleUrls: ['../teacher-shared.css', './teacher-bookings.page.css'],
})
export class TeacherBookingsPage implements OnInit {
  readonly bookingService = inject(BookingService);
  private reviewService = inject(ReviewService);
  private roomService = inject(VideoRoomService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = T_ICONS;
  readonly statusChips = [
    { value: '', label: 'All' },
    { value: '0', label: 'Pending Payment' },
    { value: '1', label: 'Confirmed' },
    { value: '2', label: 'In Progress' },
    { value: '3', label: 'Completed' },
    { value: '4', label: 'Cancelled' },
    { value: '5', label: 'Refunded' },
  ];

  bookings: any[] = [];
  loading = true;
  selectedDate = '';
  selectedStatus = '';
  reviewed = new Set<number>();

  ngOnInit(): void {
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    this.loading = !event;
    this.cdr.markForCheck();
    const status = this.selectedStatus !== '' ? Number(this.selectedStatus) : undefined;
    try {
      this.bookings = (await firstValueFrom(this.bookingService.getTeacherBookings(status, this.selectedDate))) ?? [];
      this.checkReviews();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load bookings'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  /** Booking Completed đã có review → hiện nút "View Review". */
  private checkReviews(): void {
    this.reviewed = new Set<number>();
    for (const b of this.bookings) {
      if (b.status !== 3) continue;
      this.reviewService
        .getByBookingId(b.bookingId)
        .pipe(catchError(() => of(null)))
        .subscribe((review) => {
          if (review) {
            this.reviewed.add(b.bookingId);
            this.cdr.markForCheck();
          }
        });
    }
  }

  setStatus(v: string): void {
    this.selectedStatus = v;
    this.load();
  }

  clearDate(): void {
    this.selectedDate = '';
    this.load();
  }

  name(b: any): string {
    return this.bookingService.getStudentName(b);
  }

  avatar(b: any): string {
    return this.bookingService.getStudentAvatar(b);
  }

  statusText(b: any): string {
    return this.bookingService.getStatusText(b.status);
  }

  duration(b: any): number {
    return this.bookingService.getDurationHours(b);
  }

  /** In Progress: mở 30' trước giờ học, đóng 15' sau giờ kết thúc. */
  canJoin(b: any): boolean {
    if (b?.status !== 2) return false;
    const now = Date.now();
    const start = new Date(b.startTime).getTime();
    const end = new Date(b.endTime).getTime();
    return now >= start - 30 * 60000 && now <= end + 15 * 60000;
  }

  isWaiting(b: any): boolean {
    return b?.status === 1 && Date.now() < new Date(b.startTime).getTime();
  }

  canCancel(b: any): boolean {
    if (b?.status === 0) return true;
    if (b?.status === 1) return Date.now() < new Date(b.startTime).getTime();
    return false;
  }

  async join(b: any): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.roomService.join('PrivateLesson', b.bookingId));
      if (res?.joinUrl) {
        window.open(res.joinUrl, '_blank');
        return;
      }
    } catch {
      // chưa có phòng → tạo mới
    }
    try {
      const room = await firstValueFrom(this.roomService.create('PrivateLesson', b.bookingId));
      const url = roomUrlOf(room);
      if (url) window.open(url, '_blank');
      else this.fb.toast('Room created but no link found', 'error');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to open room'), 'error');
    }
  }

  async cancel(b: any): Promise<void> {
    const ok = await this.fb.confirm({ header: 'Cancel this booking?', okText: 'Cancel Booking', cancelText: 'Keep', danger: true });
    if (!ok) return;
    try {
      await firstValueFrom(this.bookingService.cancel(b.bookingId));
      this.fb.toast('Booking cancelled successfully', 'success');
      this.load();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to cancel booking'), 'error');
    }
  }
}
