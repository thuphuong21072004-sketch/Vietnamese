import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter, IonHeader, IonRefresher, IonRefresherContent, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TeacherClassService } from '@web/services/teacher-class.service';
import { ClassEnrollmentService } from '@web/services/class-enrollment.service';
import { ReviewService } from '@web/services/review.service';
import { TeacherProfileService } from '@web/services/teacherProfile.service';
import { ClassSessionDto, TeacherClassDto } from '@web/models/teacher-class.model';
import { ClassEnrollmentDto } from '@web/models/class-enrollment.model';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { mediaUrl } from '../../../core/media';
import { NavBarComponent } from '../../../ui/nav-bar.component';
import { AvatarComponent } from '../../../ui/avatar.component';
import { BadgeComponent } from '../../../ui/badge.component';
import { IconComponent } from '../../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { T_ICONS, classLifecycle, hhmm, shortDay, vnSessionTime } from '../teacher.utils';

/** Class Detail (GV) — chưa có design, dựng theo ui-spec §3.3 */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonFooter,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    DatePipe,
    DecimalPipe,
    NavBarComponent,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-class-detail.page.html',
  styleUrls: ['../teacher-shared.css', './teacher-class-detail.page.css'],
})
export class TeacherClassDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private nav = inject(NavController);
  private classService = inject(TeacherClassService);
  private enrollmentService = inject(ClassEnrollmentService);
  private reviewService = inject(ReviewService);
  private profileService = inject(TeacherProfileService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = T_ICONS;
  readonly hhmm = hhmm;
  readonly shortDay = shortDay;
  readonly ratingOptions = [5, 4, 3, 2, 1];
  readonly stars = [1, 2, 3, 4, 5];

  classId = 0;
  loading = true;
  saving = false;
  teacherClass?: TeacherClassDto;
  myTeacherProfileId: number | null = null;
  students: ClassEnrollmentDto[] = [];
  reviews: any[] = [];
  reviewLoading = true;
  selectedRating = 0;

  ngOnInit(): void {
    this.classId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.classId) {
      this.nav.navigateRoot('/teacher/classes');
      return;
    }
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    this.loading = !event;
    this.cdr.markForCheck();
    const [cls, profile, students, reviews] = await Promise.all([
      firstValueFrom(this.classService.getClassById(this.classId)).catch((err) => {
        this.fb.toast(errorMessage(err, 'Cannot load class detail'), 'error');
        return undefined;
      }),
      firstValueFrom(this.profileService.getMyProfile()).catch(() => null),
      firstValueFrom(this.enrollmentService.getClassStudents(this.classId)).catch(() => [] as any[]),
      firstValueFrom(this.reviewService.getByClassId(this.classId)).catch(() => [] as any[]),
    ]);
    this.teacherClass = cls;
    this.myTeacherProfileId = profile?.teacherProfileId ?? null;
    this.students = students ?? [];
    this.reviews = reviews ?? [];
    this.reviewLoading = false;
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  /** Chỉ chủ lớp mới sửa topic / xóa lớp. */
  get isOwner(): boolean {
    return !!this.teacherClass && this.myTeacherProfileId !== null && this.teacherClass.teacherProfileId === this.myTeacherProfileId;
  }

  get status(): string {
    return classLifecycle(this.teacherClass?.sessions);
  }

  get isTravel(): boolean {
    return this.teacherClass?.mainTopic === 'Travel';
  }

  isPast(s: ClassSessionDto): boolean {
    return new Date() > vnSessionTime(s.studyDate, s.startTime);
  }

  studentAvatar(s: ClassEnrollmentDto): string {
    return mediaUrl(s.studentAvatarUrl, 'uploads');
  }

  reviewAvatar(r: any): string {
    return mediaUrl(r.student?.avatarUrl, 'uploads');
  }

  get filteredReviews(): any[] {
    return this.selectedRating === 0 ? this.reviews : this.reviews.filter((r) => r.rating === this.selectedRating);
  }

  reviewCount(rating: number): number {
    return this.reviews.filter((r) => r.rating === rating).length;
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
  }

  async saveAll(): Promise<void> {
    if (!this.teacherClass) return;
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.classService.updateSessions(this.teacherClass.classId, this.teacherClass.sessions));
      this.fb.toast('All sessions updated', 'success');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Update failed'), 'error');
    }
    this.saving = false;
    this.cdr.markForCheck();
  }

  async deleteClass(): Promise<void> {
    const ok = await this.fb.confirm({
      header: 'Delete Class',
      message: 'Are you sure you want to delete this class?',
      okText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.classService.deleteClass(this.classId));
      this.fb.toast('Class deleted successfully', 'success');
      this.nav.navigateRoot('/teacher/classes');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Delete class failed'), 'error');
    }
  }
}
