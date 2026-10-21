import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader } from '@ionic/angular/standalone';
import { TeacherProfileService } from '@web/services/teacherProfile.service';
import { ReviewService } from '@web/services/review.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';
import { teacherStatusText } from './teacher-status';

/** Teacher Application Detail (chưa có design — dựng theo ui-spec §3.4) */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonFooter,
    FormsModule,
    DecimalPipe,
    NavBarComponent,
    AvatarComponent,
    BadgeComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-detail.page.html',
  styleUrls: ['./admin.css', './teacher-detail.page.css'],
  host: { class: 'bg-admin' },
})
export class TeacherDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private teacherService = inject(TeacherProfileService);
  private reviewService = inject(ReviewService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly statusText = teacherStatusText;
  readonly stars = [5, 4, 3, 2, 1];

  teacher: any = null;
  loading = true;
  busy = false;
  videoUrl = '';

  reviews: any[] = [];
  reviewLoading = false;
  reviewError = '';
  selectedRating = 0;

  approvedPrice: number | null = null;
  adminNote = '';

  ngOnInit(): void {
    this.loadTeacher(Number(this.route.snapshot.paramMap.get('id')));
  }

  get id(): number {
    return this.teacher?.teacherProfileId;
  }

  /** Chỉ duyệt / từ chối khi hồ sơ đang Submitted. */
  get canReview(): boolean {
    return this.teacher?.status === 1;
  }

  get canBan(): boolean {
    return !!this.teacher && this.teacher.status !== 6;
  }

  loadTeacher(id: number): void {
    this.teacherService.getTeacherDetailForAdmin(id).subscribe({
      next: (res: any) => {
        this.teacher = res;
        this.approvedPrice = res?.approvedPricePerHour || null;
        this.adminNote = res?.adminNote || '';
        this.videoUrl = mediaUrl(res?.introVideoUrl, 'videos');
        this.loading = false;
        this.cdr.markForCheck();
        if (res?.userId) this.loadReviews(res.userId);
      },
      error: (err) => {
        this.loading = false;
        this.fb.toast(errorMessage(err, 'Could not load teacher detail'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  loadReviews(teacherUserId: number): void {
    this.reviewLoading = true;
    this.reviewError = '';
    this.reviewService.getByTeacherId(teacherUserId).subscribe({
      next: (res) => {
        this.reviews = res || [];
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

  get filteredReviews(): any[] {
    return this.selectedRating ? this.reviews.filter((r) => r.rating === this.selectedRating) : this.reviews;
  }

  reviewCount(rating: number): number {
    return this.reviews.filter((r) => r.rating === rating).length;
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + (r.rating || 0), 0) / this.reviews.length;
  }

  avatar(url: string | null | undefined): string {
    return mediaUrl(url, 'uploads');
  }

  openCertificate(): void {
    const url = mediaUrl(this.teacher?.englishCertificateUrl, 'certificates');
    if (url) window.open(url, '_blank');
  }

  approve(): void {
    if (this.busy) return;
    if (!this.approvedPrice || this.approvedPrice <= 0) {
      this.fb.toast('Please enter approved price', 'error');
      return;
    }
    this.busy = true;
    this.teacherService.approveProfile(this.id, this.approvedPrice, this.adminNote).subscribe({
      next: () => this.done('Approved successfully'),
      error: (err) => this.fail(err, 'Approve failed'),
    });
  }

  reject(): void {
    if (this.busy) return;
    if (!this.adminNote.trim()) {
      this.fb.toast('Please enter rejection note', 'error');
      return;
    }
    this.busy = true;
    this.teacherService.rejectProfile(this.id, this.adminNote).subscribe({
      next: () => this.done('Rejected successfully'),
      error: (err) => this.fail(err, 'Reject failed'),
    });
  }

  async ban(): Promise<void> {
    if (this.busy) return;
    const reason = await this.fb.prompt({
      header: 'Ban Teacher',
      message: 'Enter ban reason',
      placeholder: 'Reason',
      okText: 'Ban',
      danger: true,
    });
    if (!reason || !reason.trim()) return;
    this.busy = true;
    this.cdr.markForCheck();
    this.teacherService.banTeacher(this.id, reason.trim()).subscribe({
      next: () => this.done('Teacher banned'),
      error: (err) => this.fail(err, 'Ban failed'),
    });
  }

  private done(msg: string): void {
    this.busy = false;
    this.fb.toast(msg, 'success');
    this.loadTeacher(this.id);
  }

  private fail(err: any, fallback: string): void {
    this.busy = false;
    this.fb.toast(errorMessage(err, fallback), 'error');
    this.cdr.markForCheck();
  }
}
