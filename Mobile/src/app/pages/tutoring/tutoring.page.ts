import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonHeader,
  IonModal,
  IonRefresher,
  IonRefresherContent,
  NavController,
} from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TeacherAvailabilityService } from '@web/services/teacher-availability.service';
import { BookingService } from '@web/services/booking.service';
import { ReviewService } from '@web/services/review.service';
import { VideoRoomService } from '@web/services/video-room.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { SegmentedComponent } from '../../ui/segmented.component';
import { LoadingComponent, EmptyStateComponent } from '../../ui/states.component';
import { durationHours, hoursLabel, inJoinWindow, money, roomUrlOf } from './tutoring.utils';

type Seg = 'find' | 'bookings';

/**
 * 12 1-on-1 Tutoring — design-mobile/screens/Tutoring.dc.html (segment "Find tutors")
 * 15 My Bookings — design-mobile/screens/MyBookings.dc.html (segment "My Bookings")
 * Một page ở tab /tutoring, segment theo ?seg=find|bookings; ?payment=success|cancel (Stripe quay về) → toast + mở bookings.
 */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    DatePipe,
    DecimalPipe,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    SegmentedComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tutoring.page.html',
  styleUrls: ['./tutoring.page.css'],
})
export class TutoringPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nav = inject(NavController);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FeedbackService);
  private reviewService = inject(ReviewService);
  private roomService = inject(VideoRoomService);
  readonly scheduleService = inject(TeacherAvailabilityService);
  readonly bookingService = inject(BookingService);

  readonly icons = ICONS;
  readonly money = money;
  readonly segOptions = [
    { value: 'find', label: 'Find tutors' },
    { value: 'bookings', label: 'My Bookings' },
  ];
  readonly statusChips: { value: number | null; label: string }[] = [
    { value: null, label: 'All' },
    { value: 0, label: 'Pending Payment' },
    { value: 1, label: 'Confirmed' },
    { value: 2, label: 'In Progress' },
    { value: 3, label: 'Completed' },
    { value: 4, label: 'Cancelled' },
    { value: 5, label: 'Refunded' },
  ];

  seg: Seg = 'find';
  private loaded: Record<Seg, boolean> = { find: false, bookings: false };
  private viewEntered = false;

  // Find tutors (ScheduleList web)
  schedules: any[] = [];
  visibleSchedules: any[] = [];
  keyword = '';
  selectedDate = '';
  loadingFind = false;
  bookingSlotId: number | null = null;

  // My Bookings (MyBookings web)
  bookings: any[] = [];
  selectedStatus: number | null = null;
  bookingDate = '';
  loadingBookings = false;
  reviewStatusMap: Record<number, boolean> = {};
  busyBookingId: number | null = null;

  // Bottom sheet chọn ngày
  sheetOpen = false;
  sheetDraft = '';

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      const payment = q.get('payment');
      const seg: Seg = q.get('seg') === 'bookings' || payment ? 'bookings' : 'find';
      const changed = seg !== this.seg;
      this.seg = seg;
      if (payment === 'success' || payment === 'cancel') {
        this.fb.toast(payment === 'success' ? 'Payment successful' : 'Payment cancelled', payment === 'success' ? 'success' : 'info');
        // bỏ ?payment= khỏi URL để không hiện lại toast
        this.loaded.bookings = true; // tránh tải 2 lần khi URL đổi lại thành ?seg=bookings
        this.router.navigate([], { relativeTo: this.route, queryParams: { seg: 'bookings' }, replaceUrl: true });
        this.loadBookings();
      } else if (!this.loaded[seg] || changed) {
        // đổi segment (bấm hoặc quay về bằng ?seg=) → tải mới dữ liệu segment đó
        this.reload();
      }
      this.cdr.markForCheck();
    });
  }

  /** Quay lại tab (sau khi thanh toán / hủy / đánh giá) → tải lại segment đang mở. */
  ionViewWillEnter(): void {
    if (this.viewEntered) this.reload();
    this.viewEntered = true;
  }

  changeSeg(value: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { seg: value }, replaceUrl: true });
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.reload();
    (event.target as HTMLIonRefresherElement | null)?.complete();
  }

  private reload(): Promise<void> {
    return this.seg === 'find' ? this.loadSchedules() : this.loadBookings();
  }

  // ---------- Find tutors ----------

  async loadSchedules(): Promise<void> {
    this.loadingFind = true;
    this.cdr.markForCheck();
    try {
      const res = await firstValueFrom(this.scheduleService.getAvailableSchedules(this.selectedDate));
      const now = new Date();
      // chỉ slot còn trống và chưa bắt đầu (giống web)
      this.schedules = (res || []).filter((item) => item.status === 0 && new Date(item.startTime) > now);
      this.applySearch();
      this.loaded.find = true;
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load schedules'), 'error');
    } finally {
      this.loadingFind = false;
      this.cdr.markForCheck();
    }
  }

  applySearch(): void {
    const search = this.keyword.trim().toLowerCase();
    if (!search) {
      this.visibleSchedules = [...this.schedules];
      return;
    }
    this.visibleSchedules = this.schedules.filter((item) => {
      const name = this.scheduleService.getTeacherName(item).toLowerCase();
      const specialty = this.scheduleService.getSpecialty(item).toLowerCase();
      const date = item.startTime ? new Date(item.startTime).toLocaleDateString().toLowerCase() : '';
      return name.includes(search) || specialty.includes(search) || date.includes(search);
    });
  }

  openSlot(item: any): void {
    this.nav.navigateForward(['/tutoring/slot', item.availabilityId]);
  }

  async bookSlot(item: any): Promise<void> {
    if (item.status !== 0 || this.bookingSlotId !== null) return;
    this.bookingSlotId = item.availabilityId;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.bookingService.create(item.availabilityId));
      this.nav.navigateForward(['/payment', res.bookingId]);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Booking failed'), 'error');
    } finally {
      this.bookingSlotId = null;
      this.cdr.markForCheck();
    }
  }

  // ---------- My Bookings ----------

  async loadBookings(): Promise<void> {
    this.loadingBookings = true;
    this.cdr.markForCheck();
    try {
      const res = await firstValueFrom(
        this.bookingService.getMyBookings(this.selectedStatus ?? undefined, this.bookingDate),
      );
      this.bookings = res || [];
      this.loaded.bookings = true;
      this.checkReviewedBookings();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load bookings'), 'error');
    } finally {
      this.loadingBookings = false;
      this.cdr.markForCheck();
    }
  }

  setStatus(value: number | null): void {
    if (this.selectedStatus === value) return;
    this.selectedStatus = value;
    this.loadBookings();
  }

  /** Booking đã Completed: kiểm tra đã đánh giá chưa (Write Review / Reviewed). */
  private checkReviewedBookings(): void {
    const completed = this.bookings.filter((b) => b.status === 3);
    const map: Record<number, boolean> = {};
    completed.forEach((b) => (map[b.bookingId] = false));
    this.reviewStatusMap = map;
    completed.forEach((b) => {
      this.reviewService.getByBookingId(b.bookingId).subscribe({
        next: (review) => {
          this.reviewStatusMap = { ...this.reviewStatusMap, [b.bookingId]: !!review };
          this.cdr.markForCheck();
        },
        error: () => {},
      });
    });
  }

  teacherName(item: any): string {
    return this.bookingService.getTeacherName(item);
  }

  durationText(item: any): string {
    return hoursLabel(durationHours(item?.startTime, item?.endTime));
  }

  canJoinRoom(item: any): boolean {
    if (item?.status !== 1 && item?.status !== 2) return false;
    return inJoinWindow(item.startTime, item.endTime);
  }

  isPast(item: any): boolean {
    return new Date() > new Date(item?.endTime);
  }

  /** Confirmed / In Progress nhưng chưa tới khung giờ vào phòng. */
  roomNotOpen(item: any): boolean {
    return (item?.status === 1 || item?.status === 2) && !this.canJoinRoom(item) && !this.isPast(item);
  }

  canReview(item: any): boolean {
    return item?.status === 3 && this.reviewStatusMap[item.bookingId] === false;
  }

  hasReviewed(item: any): boolean {
    return item?.status === 3 && this.reviewStatusMap[item.bookingId] === true;
  }

  /** Chỉ Pending Payment / Confirmed và lớp chưa bắt đầu. */
  canCancel(item: any): boolean {
    if (item?.status !== 0 && item?.status !== 1) return false;
    return new Date() < new Date(item.startTime);
  }

  openDetail(item: any): void {
    this.nav.navigateForward(['/booking', item.bookingId]);
  }

  goPayment(item: any): void {
    this.nav.navigateForward(['/payment', item.bookingId]);
  }

  writeReview(item: any): void {
    this.nav.navigateForward(['/review', item.bookingId]);
  }

  async cancelBooking(item: any): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Cancel this booking?',
      message: 'This action cannot be undone.',
      okText: 'Cancel Booking',
      cancelText: 'Keep',
      danger: true,
    });
    if (!ok) return;
    this.busyBookingId = item.bookingId;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.bookingService.cancel(item.bookingId));
      this.fb.toast('Booking cancelled successfully', 'success');
      await this.loadBookings();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to cancel booking'), 'error');
    } finally {
      this.busyBookingId = null;
      this.cdr.markForCheck();
    }
  }

  /** Join: lấy phòng có sẵn → không có thì tạo → không có link thì mở màn Video Room. */
  async joinRoom(item: any): Promise<void> {
    const id = item.bookingId;
    this.busyBookingId = id;
    this.cdr.markForCheck();
    try {
      let url: string | null = null;
      try {
        const res: any = await firstValueFrom(this.roomService.join('PrivateLesson', id));
        url = res?.joinUrl || null;
      } catch {
        url = null;
      }
      if (!url) {
        try {
          const created: any = await firstValueFrom(this.roomService.create('PrivateLesson', id));
          url = roomUrlOf(created);
          if (!url) {
            this.fb.toast('Room created but link unavailable');
            this.nav.navigateForward(['/room', id]);
            return;
          }
        } catch (err) {
          this.fb.toast(errorMessage(err, 'Failed to create room'), 'error');
          return;
        }
      }
      window.open(url, '_blank');
    } finally {
      this.busyBookingId = null;
      this.cdr.markForCheck();
    }
  }

  // ---------- Bottom sheet chọn ngày ----------

  get currentDate(): string {
    return this.seg === 'find' ? this.selectedDate : this.bookingDate;
  }

  openDateSheet(): void {
    this.sheetDraft = this.currentDate;
    this.sheetOpen = true;
  }

  applyDate(value: string): void {
    this.sheetOpen = false;
    if (this.seg === 'find') {
      if (this.selectedDate === value) return;
      this.selectedDate = value;
      this.loadSchedules();
    } else {
      if (this.bookingDate === value) return;
      this.bookingDate = value;
      this.loadBookings();
    }
  }

  clearDate(): void {
    this.applyDate('');
  }
}
