import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TeacherClassService } from '@web/services/teacher-class.service';
import { TravelService } from '@web/services/travel.service';
import { ClassSessionDto, TeacherClassDto } from '@web/models/teacher-class.model';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { IconComponent } from '../../../ui/icon.component';
import { DESTINATIONS, MAIN_TOPICS, SUB_TOPICS, T_ICONS, WEEK_DAYS, shortDay, spotsOf } from '../teacher.utils';

/** 27 Create Class — design-mobile/screens/CreateClass.dc.html */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, FormsModule, DatePipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './create-class.page.html',
  styleUrls: ['../teacher-shared.css', './create-class.page.css'],
})
export class CreateClassPage implements OnInit {
  private classService = inject(TeacherClassService);
  private travelService = inject(TravelService);
  private fb = inject(FeedbackService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nav = inject(NavController);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = T_ICONS;
  readonly mainTopics = MAIN_TOPICS;
  readonly subTopics = SUB_TOPICS;
  readonly destinations = DESTINATIONS;
  readonly weekDays = WEEK_DAYS;
  readonly shortDay = shortDay;

  loading = false;
  generating = false;
  maxPrice = 0;
  selectedProvince = '';
  private travelMatchRequestId: string | null = null;
  private tripStartDate: string | null = null;
  private tripId: string | null = null;

  teacherClass: TeacherClassDto = {
    classId: 0,
    teacherProfileId: 0,
    title: '',
    description: '',
    mainTopic: '',
    subTopic: '',
    price: 0,
    maxStudents: 10,
    currentStudents: 0,
    status: 1,
    totalSessions: 10,
    startDate: '',
    startTime: '19:00',
    endTime: '20:00',
    scheduleDays: [],
    sessions: [],
  };

  ngOnInit(): void {
    // Nhận query từ màn Travel (Travel Requests / Open Trips)
    const p = this.route.snapshot.queryParamMap;
    const province = p.get('province');
    if (province) {
      this.teacherClass.mainTopic = 'Travel';
      this.selectedProvince = province;
      this.teacherClass.province = province;
    }
    if (p.get('specificLocation')) this.teacherClass.specificLocation = p.get('specificLocation') ?? '';
    this.travelMatchRequestId = p.get('matchRequestId');
    this.tripStartDate = p.get('tripStartDate');
    this.tripId = p.get('tripId');
    this.loadMaxPrice();
  }

  get spots(): string[] {
    return spotsOf(this.selectedProvince);
  }

  get isTravelClass(): boolean {
    return !!this.tripStartDate;
  }

  close(): void {
    this.nav.navigateRoot('/teacher/classes');
  }

  onMainTopicChange(): void {
    this.teacherClass.subTopic = '';
    if (this.teacherClass.mainTopic !== 'Travel') {
      this.selectedProvince = '';
      this.teacherClass.province = '';
      this.teacherClass.specificLocation = '';
    }
  }

  onProvinceChange(): void {
    this.teacherClass.province = this.selectedProvince;
    this.teacherClass.specificLocation = '';
  }

  isDayOn(day: string): boolean {
    return this.teacherClass.scheduleDays.some((x) => x.dayOfWeek === day);
  }

  toggleDay(day: string): void {
    if (this.isDayOn(day)) {
      this.teacherClass.scheduleDays = this.teacherClass.scheduleDays.filter((x) => x.dayOfWeek !== day);
    } else {
      this.teacherClass.scheduleDays = [...this.teacherClass.scheduleDays, { id: 0, classId: 0, dayOfWeek: day }];
    }
  }

  private buildRequest(): TeacherClassDto {
    const t = this.teacherClass;
    return {
      ...t,
      startTime: t.startTime?.length === 5 ? `${t.startTime}:00` : t.startTime,
      endTime: t.endTime?.length === 5 ? `${t.endTime}:00` : t.endTime,
    };
  }

  async loadMaxPrice(): Promise<void> {
    const t = this.teacherClass;
    if (!t.startTime || !t.endTime || t.maxStudents <= 0 || t.totalSessions <= 0) return;
    try {
      this.maxPrice = await firstValueFrom(this.classService.getMaxPrice(this.buildRequest()));
      this.cdr.markForCheck();
    } catch {
      // giữ giá trị cũ
    }
  }

  get priceTooHigh(): boolean {
    return this.maxPrice > 0 && this.teacherClass.price > this.maxPrice;
  }

  async generateSchedule(): Promise<void> {
    if (!this.teacherClass.startDate) {
      this.fb.toast('Please select start date', 'error');
      return;
    }
    if (this.teacherClass.scheduleDays.length === 0) {
      this.fb.toast('Please select at least one study day', 'error');
      return;
    }
    this.generating = true;
    this.cdr.markForCheck();
    try {
      this.teacherClass.sessions = await firstValueFrom(this.classService.generateSchedule(this.buildRequest()));
      if (this.travelDeadlineError) this.fb.toast(this.travelDeadlineError, 'error');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Generate schedule failed'), 'error');
    }
    this.generating = false;
    this.cdr.markForCheck();
  }

  /** Lớp gắn chuyến du lịch: buổi cuối phải trước ngày khởi hành ít nhất 3 ngày. */
  get travelDeadlineError(): string | null {
    if (!this.tripStartDate || this.teacherClass.sessions.length === 0) return null;
    const sorted = [...this.teacherClass.sessions].sort((a, b) =>
      a.studyDate.substring(0, 10).localeCompare(b.studyDate.substring(0, 10)),
    );
    const lastDateStr = sorted[sorted.length - 1].studyDate.substring(0, 10);
    const s = this.tripStartDate;
    const tripMs = Date.UTC(+s.substring(0, 4), +s.substring(5, 7) - 1, +s.substring(8, 10));
    const d = new Date(tripMs - 3 * 86400000);
    const deadlineStr =
      d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
    if (lastDateStr > deadlineStr) {
      const [y, m, day] = deadlineStr.split('-');
      return `Travel class: The last session must be at least 3 days before the departure date (before ${day}/${m}/${y}). Please adjust the class start date.`;
    }
    return null;
  }

  trackSession(_: number, s: ClassSessionDto): number {
    return s.sessionNumber;
  }

  async saveClass(): Promise<void> {
    if (this.teacherClass.sessions.length === 0) {
      this.fb.toast('Please generate schedule first', 'error');
      return;
    }
    if (this.travelDeadlineError) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.classService.createClass(this.buildRequest()));
      if (this.travelMatchRequestId) {
        this.travelService.linkClassToRequest(Number(this.travelMatchRequestId), res.classId).subscribe();
      }
      if (this.tripId) {
        this.travelService.reserveTripInClass(Number(this.tripId), res.classId).subscribe();
      }
      this.fb.toast('Create class successfully', 'success');
      this.router.navigate(['/teacher/classes', res.classId], { replaceUrl: true });
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Create class failed'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }
}
