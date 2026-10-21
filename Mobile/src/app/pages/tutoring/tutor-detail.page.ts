import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TeacherAvailabilityService } from '@web/services/teacher-availability.service';
import { BookingService } from '@web/services/booking.service';
import { ReviewService } from '@web/services/review.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { LoadingComponent, EmptyStateComponent } from '../../ui/states.component';
import { durationHours, hoursLabel, money } from './tutoring.utils';

/** 13 Tutor Slot Detail — design-mobile/screens/TutorDetail.dc.html */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonFooter,
    DatePipe,
    DecimalPipe,
    NavBarComponent,
    AvatarComponent,
    IconComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tutor-detail.page.html',
  styleUrls: ['./tutoring.shared.css', './tutor-detail.page.css'],
})
export class TutorDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private nav = inject(NavController);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FeedbackService);
  private scheduleService = inject(TeacherAvailabilityService);
  private bookingService = inject(BookingService);
  private reviewService = inject(ReviewService);

  @ViewChild('intro') introVideo?: ElementRef<HTMLVideoElement>;

  readonly icons = ICONS;
  readonly money = money;
  readonly stars = [5, 4, 3, 2, 1];

  loading = true;
  schedule: any = null;
  bookingLoading = false;
  playing = false;

  reviews: any[] = [];
  filteredReviews: any[] = [];
  reviewLoading = false;
  reviewError = '';
  ratingFilter = 0;

  ngOnInit(): void {
    this.load(Number(this.route.snapshot.paramMap.get('id')));
  }

  private async load(id: number): Promise<void> {
    this.loading = true;
    try {
      this.schedule = await firstValueFrom(this.scheduleService.getDetail(id));
      this.loadReviews();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load schedule'), 'error');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  // ---------- Giáo viên ----------

  get teacherName(): string {
    return this.schedule?.instructor?.name || 'Teacher';
  }
  get teacherAvatar(): string {
    return mediaUrl(this.schedule?.instructor?.avatarUrl, 'uploads');
  }
  get specialty(): string {
    return this.schedule?.instructorProfile?.specialty || '';
  }
  get pricePerHour(): number {
    return this.scheduleService.getPricePerHour(this.schedule);
  }
  get rating(): number {
    return this.schedule?.instructorProfile?.ratingAverage || 0;
  }
  get totalReviews(): number {
    return this.schedule?.instructorProfile?.totalReviews || 0;
  }
  get experience(): number {
    return this.schedule?.instructorProfile?.experienceYears || 0;
  }
  get description(): string {
    return this.schedule?.instructorProfile?.description || '';
  }
  get videoUrl(): string {
    return mediaUrl(this.schedule?.instructorProfile?.introVideoUrl, 'videos');
  }

  playIntro(): void {
    this.playing = true;
    this.cdr.markForCheck();
    // video đã có trong DOM (ẩn dưới lớp phủ) → phát luôn
    this.introVideo?.nativeElement.play().catch(() => {});
  }

  // ---------- Slot ----------

  get statusText(): string {
    const s = this.schedule?.status;
    return s === 0 ? 'Available' : s === 1 ? 'Booked' : 'Expired';
  }
  get durationText(): string {
    return hoursLabel(durationHours(this.schedule?.startTime, this.schedule?.endTime));
  }
  get totalCost(): string {
    return money(this.schedule?.pricePerHour);
  }

  async book(): Promise<void> {
    if (this.schedule?.status !== 0 || this.bookingLoading) return;
    this.bookingLoading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.bookingService.create(this.schedule.availabilityId));
      this.nav.navigateForward(['/payment', res.bookingId]);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Booking failed'), 'error');
    } finally {
      this.bookingLoading = false;
      this.cdr.markForCheck();
    }
  }

  // ---------- Reviews ----------

  private loadReviews(): void {
    this.reviews = [];
    this.filteredReviews = [];
    this.reviewError = '';
    const teacherId = this.schedule?.instructorId;
    if (!teacherId) {
      this.reviewError = 'No teacher ID available.';
      return;
    }
    this.reviewLoading = true;
    this.reviewService.getByTeacherId(teacherId).subscribe({
      next: (res) => {
        this.reviews = res || [];
        this.applyFilter();
        this.reviewLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.reviewError = errorMessage(err, 'Failed to load teacher reviews.');
        this.reviewLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  setFilter(rating: number): void {
    this.ratingFilter = rating;
    this.applyFilter();
  }

  private applyFilter(): void {
    this.filteredReviews =
      this.ratingFilter <= 0 ? [...this.reviews] : this.reviews.filter((r) => r.rating === this.ratingFilter);
  }

  countOf(rating: number): number {
    return this.reviews.filter((r) => r.rating === rating).length;
  }

  get average(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + (r.rating || 0), 0) / this.reviews.length;
  }

  reviewAvatar(review: any): string {
    return mediaUrl(review?.studentAvatar || review?.student?.avatarUrl, 'uploads');
  }

  starsOf(n: number): string {
    const k = Math.max(0, Math.min(5, Math.round(n || 0)));
    return '★'.repeat(k);
  }
}
