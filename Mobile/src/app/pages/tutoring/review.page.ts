import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '@web/services/booking.service';
import { ClassEnrollmentService } from '@web/services/class-enrollment.service';
import { ReviewService } from '@web/services/review.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { IconComponent } from '../../ui/icon.component';
import { LoadingComponent } from '../../ui/states.component';
import { durationHours, hoursLabel, money } from './tutoring.utils';

/**
 * 17 Review — design-mobile/screens/Review.dc.html (sao bấm được thay cho select của web).
 * /review/:bookingId hoặc /review/:classId?type=CLASS&enrollmentId=
 */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, FormsModule, DatePipe, NavBarComponent, AvatarComponent, IconComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review.page.html',
  styleUrls: ['./tutoring.shared.css', './review.page.css'],
})
export class ReviewPage implements OnInit {
  private route = inject(ActivatedRoute);
  private nav = inject(NavController);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FeedbackService);
  private bookingService = inject(BookingService);
  private enrollmentService = inject(ClassEnrollmentService);
  private reviewService = inject(ReviewService);

  readonly money = money;
  readonly starIcon = 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z';
  readonly starValues = [1, 2, 3, 4, 5];

  refId = 0;
  refName = 'PrivateLesson';
  dataLoading = true;
  booking: any = null;
  enrollment: any = null;
  review: any = null;
  reviewed = false;

  rating = 5;
  comment = '';
  submitted = false;
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
    const tasks: Promise<void>[] = [this.loadReview()];
    if (this.isClass) {
      const enrollmentId = Number(this.route.snapshot.queryParamMap.get('enrollmentId'));
      if (enrollmentId) tasks.push(this.loadEnrollment(enrollmentId));
    } else {
      tasks.push(this.loadBooking());
    }
    await Promise.all(tasks);
    this.dataLoading = false;
    this.cdr.markForCheck();
  }

  private async loadBooking(): Promise<void> {
    try {
      this.booking = await firstValueFrom(this.bookingService.getDetail(this.refId));
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load booking'), 'error');
    }
  }

  private async loadEnrollment(id: number): Promise<void> {
    try {
      this.enrollment = await firstValueFrom(this.enrollmentService.getDetail(id));
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load enrollment'), 'error');
    }
  }

  private async loadReview(): Promise<void> {
    try {
      const res = await firstValueFrom(this.reviewService.getByRef(this.refName, this.refId));
      if (res) {
        this.reviewed = true;
        this.review = res;
      }
    } catch {
      // chưa có review
    }
  }

  // ---------- Hiển thị ----------

  get tc(): any {
    return this.enrollment?.teacherClass ?? this.enrollment ?? null;
  }

  get teacherName(): string {
    if (!this.isClass) return this.booking?.instructor?.name || 'Teacher';
    return this.tc?.teacherProfile?.teacherName || this.tc?.teacherProfile?.user?.name || this.enrollment?.teacherName || 'Teacher';
  }

  get teacherAvatar(): string {
    const avatar = this.isClass
      ? this.tc?.teacherProfile?.avatarUrl || this.enrollment?.teacherAvatarUrl
      : this.booking?.instructor?.avatarUrl;
    return mediaUrl(avatar, 'uploads');
  }

  get specialty(): string {
    return this.isClass ? this.tc?.teacherProfile?.specialty || '' : this.bookingService.getTeacherSpecialty(this.booking);
  }

  get durationText(): string {
    return hoursLabel(durationHours(this.booking?.startTime, this.booking?.endTime));
  }

  get ratingLabel(): string {
    return `${this.rating} Star${this.rating > 1 ? 's' : ''}`;
  }

  /** Chỉ đánh giá khi buổi / lớp đã Completed (status 3). */
  canReview(): boolean {
    if (this.isClass) return this.enrollment?.status === 3;
    return this.booking?.status === 3;
  }

  setRating(n: number): void {
    this.rating = n;
  }

  // ---------- Gửi ----------

  async submit(): Promise<void> {
    if (!this.canReview()) {
      this.fb.toast('You can only review after completion', 'error');
      return;
    }
    this.submitted = true;
    if (!this.comment.trim()) {
      this.cdr.markForCheck();
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(
        this.reviewService.create({ refName: this.refName, refId: this.refId, rating: this.rating, comment: this.comment }),
      );
      this.fb.toast('Review submitted', 'success');
      if (this.isClass) {
        this.nav.navigateRoot(['/classes'], { queryParams: { seg: 'mine' } });
      } else {
        this.nav.navigateRoot(['/tutoring'], { queryParams: { seg: 'bookings' } });
      }
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed'), 'error');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
