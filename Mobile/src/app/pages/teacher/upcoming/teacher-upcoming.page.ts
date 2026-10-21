import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { ClassEnrollmentService } from '@web/services/class-enrollment.service';
import { VideoRoomService } from '@web/services/video-room.service';
import { UpcomingScheduleDto } from '@web/models/upcoming-schedule.model';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { NavBarComponent } from '../../../ui/nav-bar.component';
import { IconComponent } from '../../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { T_ICONS, hhmm, vnSessionTime } from '../teacher.utils';

/** Upcoming Teaching Schedule — chưa có design, dựng theo ui-spec §3.3 */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    RouterLink,
    DatePipe,
    UpperCasePipe,
    NavBarComponent,
    IconComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-upcoming.page.html',
  styleUrls: ['../teacher-shared.css', './teacher-upcoming.page.css'],
})
export class TeacherUpcomingPage implements OnInit, OnDestroy {
  private enrollmentService = inject(ClassEnrollmentService);
  private roomService = inject(VideoRoomService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);
  private timer?: ReturnType<typeof setInterval>;

  readonly icons = T_ICONS;
  readonly hhmm = hhmm;

  loading = true;
  schedules: UpcomingScheduleDto[] = [];

  ngOnInit(): void {
    this.load();
    // cập nhật nút Join theo thời gian thực
    this.timer = setInterval(() => this.cdr.markForCheck(), 30000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async load(event?: CustomEvent): Promise<void> {
    this.loading = !event;
    this.cdr.markForCheck();
    try {
      this.schedules = (await firstValueFrom(this.enrollmentService.getTeacherUpcomingSchedule())) ?? [];
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load schedule'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  /** Mở 15' trước buổi học, đóng 15' sau khi kết thúc. */
  canJoin(item: UpcomingScheduleDto): boolean {
    const now = Date.now();
    const start = vnSessionTime(item.studyDate, item.startTime).getTime();
    const end = vnSessionTime(item.studyDate, item.endTime).getTime();
    return now >= start - 15 * 60000 && now <= end + 15 * 60000;
  }

  async join(item: UpcomingScheduleDto): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.roomService.join('CLASS', item.sessionId));
      if (res?.joinUrl) window.open(res.joinUrl, '_blank');
      else this.fb.toast('Không lấy được link phòng học', 'error');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Không thể vào phòng học'), 'error');
    }
  }
}
