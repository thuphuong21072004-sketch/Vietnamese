import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonFooter, IonHeader } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TeacherClassService } from '@web/services/teacher-class.service';
import { ClassEnrollmentService } from '@web/services/class-enrollment.service';
import { ReviewService } from '@web/services/review.service';
import { VideoRoomService } from '@web/services/video-room.service';
import { ClassSessionDto, TeacherClassDto } from '@web/models/teacher-class.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { IconComponent } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';
import {
  canJoinSession,
  classLifecycle,
  dayLabel,
  enrollStatusLabel,
  isPastSession,
  money,
  timeRange,
} from './class-utils';

/** 19 Class Detail — design-mobile/screens/ClassDetail.dc.html (logic web ViewUser/ClassRoom/ClassDetail). */
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
    BadgeComponent,
    IconComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './class-detail.page.html',
  styleUrls: ['./class-detail.page.css'],
})
export class ClassDetailPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classSvc = inject(TeacherClassService);
  private enrollSvc = inject(ClassEnrollmentService);
  private reviewSvc = inject(ReviewService);
  private roomSvc = inject(VideoRoomService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly chevronDown = 'm6 9 6 6 6-6';
  readonly videoIcon = 'M23 7l-7 5 7 5zM1 5h15v14H1z';
  readonly money = money;
  readonly dayLabel = dayLabel;
  readonly timeRange = timeRange;
  readonly isPast = isPastSession;

  classId = 0;
  loading = true;
  cls: TeacherClassDto | null = null;
  status: number | null = null;
  enrollmentId: number | null = null;
  busy = false;
  joiningId: number | null = null;

  showTeacher = false;
  showReviews = false;
  reviews: any[] = [];
  reviewLoading = false;
  reviewError = '';
  ratingFilter = 0;

  private entered = false;
  private tick = setInterval(() => this.cdr.markForCheck(), 30_000);

  ngOnInit(): void {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadAll();
  }

  ngOnDestroy(): void {
    clearInterval(this.tick);
  }

  /** Quay lại từ Payment → cập nhật trạng thái đăng ký. */
  ionViewWillEnter(): void {
    if (!this.entered) {
      this.entered = true;
      return;
    }
    this.loadAll(true);
  }

  private async loadAll(silent = false): Promise<void> {
    if (!silent) this.loading = true;
    this.cdr.markForCheck();
    await Promise.all([this.loadClass(), this.loadEnrollment()]);
    this.loading = false;
    this.cdr.markForCheck();
  }

  private async loadClass(): Promise<void> {
    try {
      this.cls = await firstValueFrom(this.classSvc.getClassById(this.classId));
      this.loadReviews();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load course details'), 'error');
    }
  }

  private async loadEnrollment(): Promise<void> {
    try {
      const list = (await firstValueFrom(this.enrollSvc.getMyClasses())) ?? [];
      const e = list.find((x: any) => x.classId === this.classId);
      this.status = e ? e.status : null;
      this.enrollmentId = e ? e.enrollmentId : null;
    } catch {
      // giữ trạng thái cũ
    }
  }

  private loadReviews(): void {
    const teacherUserId = this.cls?.teacherProfile?.userId;
    if (!teacherUserId) return;
    this.reviewLoading = true;
    this.reviewError = '';
    this.reviewSvc.getByTeacherId(teacherUserId).subscribe({
      next: (res) => {
        this.reviews = res ?? [];
        this.reviewLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.reviewError = 'Failed to load reviews';
        this.reviewLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  // ---------- Hiển thị ----------

  /** Badge đầu trang: trạng thái đăng ký nếu đã đăng ký, không thì vòng đời lớp theo lịch. */
  get badge(): string {
    return this.status !== null ? enrollStatusLabel(this.status) : classLifecycle(this.cls?.sessions);
  }

  get sessions(): ClassSessionDto[] {
    return [...(this.cls?.sessions ?? [])].sort((a, b) => a.sessionNumber - b.sessionNumber);
  }

  get info(): { k: string; v: string }[] {
    const c = this.cls;
    if (!c) return [];
    const rating = c.ratingAverage != null ? `★ ${Number(c.ratingAverage).toFixed(1)}` : '★ 0.0';
    const rows = [
      { k: 'Teacher', v: c.teacherName || '—' },
      { k: 'Country', v: c.country || '—' },
      { k: 'Rating', v: rating },
      { k: 'Price', v: money(c.price) },
      { k: 'Main Topic', v: c.mainTopic || '—' },
    ];
    if (c.mainTopic === 'Travel') {
      rows.push({ k: 'Province', v: c.province || '—' });
      if (c.specificLocation) rows.push({ k: 'Location', v: c.specificLocation });
    } else {
      rows.push({ k: 'Sub Topic', v: c.subTopic || '—' });
    }
    rows.push(
      { k: 'Students', v: `${c.currentStudents} / ${c.maxStudents}` },
      { k: 'Total Sessions', v: String(c.totalSessions) },
      { k: 'Study Time', v: timeRange(c.startTime, c.endTime) },
    );
    return rows;
  }

  get teacherAvatar(): string {
    return mediaUrl(this.cls?.teacherProfile?.avatarUrl, 'uploads');
  }

  get introVideo(): string {
    return mediaUrl(this.cls?.teacherProfile?.introVideoUrl, 'videos');
  }

  stars(rating: number | null | undefined): ('full' | 'half' | 'empty')[] {
    const r = Math.round((rating ?? 0) * 2) / 2;
    return [1, 2, 3, 4, 5].map((i) => (r >= i ? 'full' : r >= i - 0.5 ? 'half' : 'empty'));
  }

  get filteredReviews(): any[] {
    return this.ratingFilter ? this.reviews.filter((r) => r.rating === this.ratingFilter) : this.reviews;
  }

  reviewCount(star: number): number {
    return this.reviews.filter((r) => r.rating === star).length;
  }

  get averageRating(): number {
    return this.reviews.length ? this.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / this.reviews.length : 0;
  }

  reviewAvatar(r: any): string {
    return mediaUrl(r?.student?.avatarUrl, 'uploads');
  }

  /** Join Zoom Room: trong khung ±15 phút và học viên đã được xác nhận / đang học. */
  canJoin(s: ClassSessionDto): boolean {
    return (this.status === 1 || this.status === 2) && canJoinSession(s);
  }

  // ---------- Hành động ----------

  /** Giống luồng Group Classes: lớp miễn phí → xác nhận luôn; còn lại sang Payment. */
  async enroll(): Promise<void> {
    if (!this.cls || this.busy) return;
    this.busy = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.enrollSvc.enroll(this.cls.classId));
      if (res?.status === 1) {
        this.fb.toast('Enroll successfully', 'success');
        await this.loadAll(true);
      } else {
        this.router.navigate(['/payment', res.enrollmentId], { queryParams: { type: 'CLASS' } });
      }
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to enroll'), 'error');
    }
    this.busy = false;
    this.cdr.markForCheck();
  }

  pay(): void {
    if (this.enrollmentId) this.router.navigate(['/payment', this.enrollmentId], { queryParams: { type: 'CLASS' } });
  }

  async cancel(): Promise<void> {
    if (!this.enrollmentId || this.busy) return;
    const ok = await this.fb.confirm({
      header: 'Cancel Enrollment',
      message: 'Cancel this enrollment?',
      okText: 'Cancel Enrollment',
      cancelText: 'Keep',
      danger: true,
    });
    if (!ok) return;
    this.busy = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.enrollSvc.cancel(this.enrollmentId));
      this.fb.toast('Enrollment cancelled', 'success');
      await this.loadAll(true);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to cancel enrollment'), 'error');
    }
    this.busy = false;
    this.cdr.markForCheck();
  }

  async join(s: ClassSessionDto): Promise<void> {
    if (this.joiningId) return;
    this.joiningId = s.sessionId;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.roomSvc.join('CLASS', s.sessionId));
      if (res?.joinUrl) window.open(res.joinUrl, '_blank');
      else this.fb.toast('Không lấy được link phòng học', 'error');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Không thể vào phòng học'), 'error');
    }
    this.joiningId = null;
    this.cdr.markForCheck();
  }
}
