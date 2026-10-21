import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ClassEnrollmentService } from '@web/services/class-enrollment.service';
import { VideoRoomService } from '@web/services/video-room.service';
import { ClassEnrollmentDto } from '@web/models/class-enrollment.model';
import { UpcomingScheduleDto } from '@web/models/upcoming-schedule.model';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';
import {
  STATUS_CHIPS,
  canEnrollAgain,
  canJoinSession,
  dayLabel,
  enrollStatusLabel,
  hhmm,
  money,
  timeRange,
} from './class-utils';

/**
 * Segment "My Classes" của tab Classes — design-mobile/screens/MyClasses.dc.html
 * (khối Upcoming Schedule ở đầu: logic web StudentUpcoming; danh sách: logic web MyClasses).
 */
@Component({
  selector: 'vp-my-classes',
  standalone: true,
  imports: [FormsModule, DatePipe, AvatarComponent, BadgeComponent, IconComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-classes.component.html',
  styleUrls: ['./my-classes.component.css'],
})
export class MyClassesComponent implements OnInit, OnDestroy {
  private enrollSvc = inject(ClassEnrollmentService);
  private roomSvc = inject(VideoRoomService);
  private router = inject(Router);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = ICONS;
  readonly videoIcon = 'M23 7l-7 5 7 5zM1 5h15v14H1z';
  readonly chips = STATUS_CHIPS;
  readonly statusLabel = enrollStatusLabel;
  readonly dayLabel = dayLabel;
  readonly timeRange = timeRange;
  readonly hhmm = hhmm;
  readonly money = money;
  readonly canJoin = canJoinSession;

  loading = true;
  enrollments: ClassEnrollmentDto[] = [];
  upcomingLoading = true;
  schedules: UpcomingScheduleDto[] = [];
  showAllUpcoming = false;
  busyId: number | null = null;
  joiningId: number | null = null;

  titleFilter = '';
  statusFilter: number | '' = '';
  studyDateFilter = '';

  /** Cập nhật nút Join Zoom Room theo giờ. */
  private tick = setInterval(() => this.cdr.markForCheck(), 30_000);

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    clearInterval(this.tick);
  }

  async reload(): Promise<void> {
    await Promise.all([this.loadClasses(), this.loadUpcoming()]);
  }

  private async loadClasses(): Promise<void> {
    try {
      this.enrollments = (await firstValueFrom(this.enrollSvc.getMyClasses())) ?? [];
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load classes'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  private async loadUpcoming(): Promise<void> {
    try {
      this.schedules = (await firstValueFrom(this.enrollSvc.getStudentUpcomingSchedule())) ?? [];
    } catch {
      this.schedules = [];
    }
    this.upcomingLoading = false;
    this.cdr.markForCheck();
  }

  // ---------- Lọc ----------

  get filtered(): ClassEnrollmentDto[] {
    let list = this.enrollments;
    const kw = this.titleFilter.trim().toLowerCase();
    if (kw) list = list.filter((e) => e.classTitle?.toLowerCase().includes(kw));
    if (this.statusFilter !== '') list = list.filter((e) => e.status === this.statusFilter);
    if (this.studyDateFilter) {
      list = list.filter(
        (e) =>
          e.status !== 0 &&
          e.status !== 4 &&
          e.status !== 5 &&
          !!e.sessions?.some((s) => s.studyDate?.substring(0, 10) === this.studyDateFilter),
      );
    }
    return list;
  }

  get hasFilter(): boolean {
    return !!this.titleFilter.trim() || this.statusFilter !== '' || !!this.studyDateFilter;
  }

  clearFilters(): void {
    this.titleFilter = '';
    this.statusFilter = '';
    this.studyDateFilter = '';
  }

  get nextSession(): UpcomingScheduleDto | null {
    return this.schedules[0] ?? null;
  }

  get moreSessions(): UpcomingScheduleDto[] {
    return this.schedules.slice(1);
  }

  // ---------- Card ----------

  avatar(e: ClassEnrollmentDto): string {
    return mediaUrl(e.teacherAvatarUrl, 'uploads');
  }

  showView(e: ClassEnrollmentDto): boolean {
    return !((e.status === 4 || e.status === 5) && !canEnrollAgain(e.sessions));
  }

  canEnrollAgain(e: ClassEnrollmentDto): boolean {
    return canEnrollAgain(e.sessions);
  }

  viewClass(classId: number): void {
    this.router.navigate(['/classes', classId]);
  }

  pay(e: ClassEnrollmentDto): void {
    this.router.navigate(['/payment', e.enrollmentId], { queryParams: { type: 'CLASS' } });
  }

  /** Review Teacher / View Review cùng đi tới màn Review. */
  review(e: ClassEnrollmentDto): void {
    this.router.navigate(['/review', e.classId], { queryParams: { type: 'CLASS', enrollmentId: e.enrollmentId } });
  }

  async cancel(e: ClassEnrollmentDto): Promise<void> {
    if (this.busyId) return;
    const ok = await this.fb.confirm({
      header: 'Cancel Enrollment',
      message: 'Cancel this enrollment?',
      okText: 'Cancel Enrollment',
      cancelText: 'Keep',
      danger: true,
    });
    if (!ok) return;
    this.busyId = e.enrollmentId;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.enrollSvc.cancel(e.enrollmentId));
      this.fb.toast('Enrollment cancelled', 'success');
      await this.reload();
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to cancel enrollment'), 'error');
    }
    this.busyId = null;
    this.cdr.markForCheck();
  }

  async enroll(e: ClassEnrollmentDto): Promise<void> {
    if (this.busyId) return;
    this.busyId = e.enrollmentId;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.enrollSvc.enroll(e.classId));
      if (res?.status === 1) {
        this.fb.toast('Enrolled successfully', 'success');
        await this.reload();
      } else {
        this.router.navigate(['/payment', res.enrollmentId], { queryParams: { type: 'CLASS' } });
      }
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to enroll'), 'error');
    }
    this.busyId = null;
    this.cdr.markForCheck();
  }

  // ---------- Phòng học ----------

  /** Backend tự tạo phòng nếu chưa có và trả joinUrl (chỉ học viên Confirmed/InProgress). */
  async join(s: UpcomingScheduleDto): Promise<void> {
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
