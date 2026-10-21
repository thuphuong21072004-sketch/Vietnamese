import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonModal } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TeacherClassService } from '@web/services/teacher-class.service';
import { ClassEnrollmentService } from '@web/services/class-enrollment.service';
import { ReviewService } from '@web/services/review.service';
import { TeacherClassDto } from '@web/models/teacher-class.model';
import { ClassFilterDto } from '@web/models/class-filter.model';
import { ClassEnrollmentDto } from '@web/models/class-enrollment.model';
import { VIETNAM_DESTINATIONS } from '@web/models/vietnam-destinations';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { AvatarComponent } from '../../ui/avatar.component';
import { BadgeComponent } from '../../ui/badge.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';
import { canEnrollAgain, enrollStatusLabel, hhmm, money, shortDay } from './class-utils';

const MAIN_TOPICS = ['Daily Communication', 'Work', 'Study', 'Travel', 'Exam Preparation', 'Vietnamese Culture'];

const SUB_TOPICS: Record<string, string[]> = {
  'Daily Communication': [
    'Beginner Vietnamese', 'Basic Communication', 'Intermediate Communication', 'Advanced Communication',
    'Living in Vietnam', 'Daily Life in Vietnam', 'Practical Vietnamese', 'Vietnamese for Foreigners',
    'Social Communication', 'Community Communication',
  ],
  Work: [
    'Office Vietnamese', 'Business Vietnamese', 'Vietnamese for IT Professionals', 'Vietnamese for Engineers',
    'Vietnamese for Doctors', 'Vietnamese for Nurses', 'Vietnamese for Teachers', 'Vietnamese for Office Workers',
    'Vietnamese for Hotel Staff', 'Vietnamese for Restaurant Staff', 'Vietnamese for Sales',
    'Vietnamese for Customer Service', 'Professional Vietnamese', 'Management Communication', 'Startup Communication',
  ],
  Study: [
    'Vietnamese for Children', 'Vietnamese for Teenagers', 'Vietnamese for Students',
    'Vietnamese for International Students', 'Academic Vietnamese', 'University Vietnamese', 'Research Vietnamese',
    'Reading Skills', 'Listening Skills', 'Speaking Skills', 'Writing Skills', 'Vietnamese Grammar',
    'Vietnamese Vocabulary', 'Advanced Vietnamese', 'University Preparation',
  ],
  Travel: [
    'Hanoi', 'Ha Long Bay', 'Sapa', 'Ha Giang', 'Ninh Binh', 'Moc Chau', 'Hue', 'Da Nang', 'Hoi An', 'Phong Nha',
    'Quang Binh', 'Nha Trang', 'Da Lat', 'Mui Ne', 'Phan Thiet', 'Ho Chi Minh City', 'Can Tho', 'Chau Doc',
    'An Giang', 'Phu Quoc', 'Con Dao',
  ],
  'Exam Preparation': [
    'A1 Preparation', 'A2 Preparation', 'B1 Preparation', 'B2 Preparation', 'C1 Preparation', 'C2 Preparation',
    'Listening Practice', 'Speaking Practice', 'Reading Practice', 'Writing Practice', 'Comprehensive Review',
    'Test-taking Strategies',
  ],
  'Vietnamese Culture': [
    'Vietnamese Cuisine', 'Vietnamese History', 'Customs and Traditions', 'Traditional Festivals', 'Tet Holiday',
    'Communication Etiquette', 'Vietnamese Family Culture', 'Traditional Clothing', 'Vietnamese Music',
    'Vietnamese Cinema', 'Vietnamese Literature', 'Vietnamese Lifestyle', 'Northern Culture', 'Central Culture',
    'Southern Culture',
  ],
};

const WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Bộ lọc trong bottom sheet (giờ dạng "HH:mm", backend cần "HH:mm:ss"). */
interface FilterState {
  title: string;
  country: string;
  minRating: number | null;
  mainTopic: string;
  subTopic: string;
  province: string;
  specificLocation: string;
  minPrice: number | null;
  maxPrice: number | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
}

function defaultFilter(): FilterState {
  return {
    title: '',
    country: '',
    minRating: null,
    mainTopic: '',
    subTopic: '',
    province: '',
    specificLocation: '',
    minPrice: 0,
    maxPrice: 100, // giống mặc định của web
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    daysOfWeek: [],
  };
}

/** Segment "Find classes" của tab Classes — design-mobile/screens/GroupClasses.dc.html (logic web ClassList). */
@Component({
  selector: 'vp-class-browse',
  standalone: true,
  imports: [
    FormsModule,
    DecimalPipe,
    IonModal,
    IonContent,
    AvatarComponent,
    BadgeComponent,
    IconComponent,
    LoadingComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './class-browse.component.html',
  styleUrls: ['./class-browse.component.css'],
})
export class ClassBrowseComponent implements OnInit, OnDestroy {
  private classSvc = inject(TeacherClassService);
  private enrollSvc = inject(ClassEnrollmentService);
  private reviewSvc = inject(ReviewService);
  private router = inject(Router);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = ICONS;
  readonly slidersIcon = 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6';
  readonly mainTopics = MAIN_TOPICS;
  readonly subTopics = SUB_TOPICS;
  readonly weekDays = WEEK_DAYS;
  readonly destinations = VIETNAM_DESTINATIONS;
  readonly ratings = [
    { value: 1, label: '1★+' },
    { value: 2, label: '2★+' },
    { value: 3, label: '3★+' },
    { value: 4, label: '4★+' },
    { value: 4.5, label: '4.5★+' },
  ];
  readonly money = money;
  readonly hhmm = hhmm;
  readonly shortDay = shortDay;
  readonly statusLabel = enrollStatusLabel;

  loading = true;
  classes: TeacherClassDto[] = [];
  enrollments: ClassEnrollmentDto[] = [];
  reviewed: Record<number, boolean> = {};
  countries: string[] = [];
  busyId: number | null = null;

  filter: FilterState = defaultFilter();
  /** Bản nháp đang sửa trong sheet; chỉ áp dụng khi bấm Apply. */
  draft: FilterState = defaultFilter();
  sheetOpen = false;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private searchSeq = 0;

  ngOnInit(): void {
    this.classSvc.getCountries().subscribe((res) => {
      const list = res.map((x) => x.name.common).sort();
      const vn = list.indexOf('Vietnam');
      if (vn >= 0) list.splice(vn, 1);
      this.countries = ['Vietnam', ...list];
      this.cdr.markForCheck();
    });
    this.reload();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  /** Tải lại enrollment + kết quả tìm kiếm (pull-to-refresh, quay lại tab). */
  async reload(): Promise<void> {
    await Promise.all([this.loadEnrollments(), this.search()]);
  }

  // ---------- Danh sách ----------

  get visibleClasses(): TeacherClassDto[] {
    let list = this.classes;
    if (this.filter.mainTopic === 'Travel') {
      if (this.filter.province) list = list.filter((c) => c.province === this.filter.province);
      if (this.filter.specificLocation) list = list.filter((c) => c.specificLocation === this.filter.specificLocation);
    }
    return list;
  }

  async search(): Promise<void> {
    const f = this.filter;
    const isTravel = f.mainTopic === 'Travel';
    const request: ClassFilterDto = {
      title: f.title.trim(),
      country: f.country,
      minRating: f.minRating ?? undefined,
      mainTopic: f.mainTopic,
      subTopic: isTravel ? '' : f.subTopic,
      minPrice: f.minPrice ?? undefined,
      maxPrice: f.maxPrice ?? undefined,
      startDate: f.startDate || undefined,
      endDate: f.endDate || undefined,
      startTime: f.startTime ? `${f.startTime}:00` : undefined,
      endTime: f.endTime ? `${f.endTime}:00` : undefined,
      daysOfWeek: [...f.daysOfWeek],
    };
    const seq = ++this.searchSeq;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res = await firstValueFrom(this.classSvc.searchClasses(request));
      if (seq !== this.searchSeq) return;
      this.classes = res ?? [];
    } catch (err) {
      if (seq !== this.searchSeq) return;
      this.classes = [];
      this.fb.toast(errorMessage(err, 'Failed to load classes'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
  }

  private async loadEnrollments(): Promise<void> {
    try {
      this.enrollments = (await firstValueFrom(this.enrollSvc.getMyClasses())) ?? [];
    } catch {
      this.enrollments = [];
    }
    this.cdr.markForCheck();
    this.checkReviewed();
  }

  /** Lớp đã hoàn thành: đã đánh giá chưa (ưu tiên hasReview, thiếu thì hỏi /reviews/my/CLASS/:id). */
  private checkReviewed(): void {
    const map: Record<number, boolean> = {};
    for (const e of this.enrollments.filter((x) => x.status === 3)) {
      if (typeof e.hasReview === 'boolean') {
        map[e.classId] = e.hasReview;
        continue;
      }
      map[e.classId] = false;
      this.reviewSvc.getByRef('CLASS', e.classId).subscribe({
        next: (review) => {
          this.reviewed = { ...this.reviewed, [e.classId]: !!review };
          this.cdr.markForCheck();
        },
        error: () => {},
      });
    }
    this.reviewed = map;
    this.cdr.markForCheck();
  }

  enrollmentOf(classId: number): ClassEnrollmentDto | undefined {
    return this.enrollments.find((x) => x.classId === classId);
  }

  statusOf(classId: number): number | null {
    return this.enrollmentOf(classId)?.status ?? null;
  }

  avatar(c: TeacherClassDto): string {
    return mediaUrl(c.avatarUrl, 'uploads');
  }

  /** Ẩn View Details khi lớp đã hủy / hoàn tiền và đã quá buổi đầu (giống web). */
  showDetails(c: TeacherClassDto): boolean {
    const st = this.statusOf(c.classId);
    return !((st === 4 || st === 5) && !canEnrollAgain(c.sessions));
  }

  canEnrollAgain(c: TeacherClassDto): boolean {
    return canEnrollAgain(c.sessions);
  }

  canReview(classId: number): boolean {
    return this.statusOf(classId) === 3 && this.reviewed[classId] === false;
  }

  hasReviewed(classId: number): boolean {
    return this.statusOf(classId) === 3 && this.reviewed[classId] === true;
  }

  // ---------- Hành động ----------

  viewClass(classId: number): void {
    this.router.navigate(['/classes', classId]);
  }

  pay(classId: number): void {
    const e = this.enrollmentOf(classId);
    if (e) this.router.navigate(['/payment', e.enrollmentId], { queryParams: { type: 'CLASS' } });
  }

  review(classId: number): void {
    const e = this.enrollmentOf(classId);
    if (!e) return;
    this.router.navigate(['/review', classId], { queryParams: { type: 'CLASS', enrollmentId: e.enrollmentId } });
  }

  /** Lớp miễn phí → status 1 (xong luôn); còn lại sang màn thanh toán. */
  async enroll(classId: number): Promise<void> {
    if (this.busyId) return;
    this.busyId = classId;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.enrollSvc.enroll(classId));
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

  async cancel(classId: number): Promise<void> {
    const e = this.enrollmentOf(classId);
    if (!e || this.busyId) return;
    const ok = await this.fb.confirm({
      header: 'Cancel Enrollment',
      message: 'Cancel this enrollment?',
      okText: 'Cancel Enrollment',
      cancelText: 'Keep',
      danger: true,
    });
    if (!ok) return;
    this.busyId = classId;
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

  // ---------- Tìm theo tên + chip chủ đề ----------

  onTitleInput(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search(), 400);
  }

  submitTitle(ev: Event): void {
    ev.preventDefault();
    if (this.searchTimer) clearTimeout(this.searchTimer);
    (document.activeElement as HTMLElement | null)?.blur();
    this.search();
  }

  pickTopic(topic: string): void {
    if (this.filter.mainTopic === topic) return;
    this.filter = { ...this.filter, mainTopic: topic, subTopic: '', province: '', specificLocation: '' };
    this.search();
  }

  // ---------- Bottom sheet Filters ----------

  /** Số bộ lọc đang bật (trừ ô tên) — hiển thị trên nút Filters. */
  get activeCount(): number {
    const f = this.filter;
    const d = defaultFilter();
    let n = 0;
    if (f.country) n++;
    if (f.minRating !== null) n++;
    if (f.mainTopic) n++;
    if (f.mainTopic === 'Travel') {
      if (f.province) n++;
      if (f.specificLocation) n++;
    } else if (f.subTopic) n++;
    if ((f.minPrice ?? 0) !== d.minPrice) n++;
    if (f.maxPrice !== d.maxPrice) n++;
    if (f.startDate) n++;
    if (f.endDate) n++;
    if (f.startTime) n++;
    if (f.endTime) n++;
    if (f.daysOfWeek.length) n++;
    return n;
  }

  openSheet(): void {
    this.draft = { ...this.filter, daysOfWeek: [...this.filter.daysOfWeek] };
    this.sheetOpen = true;
  }

  closeSheet(): void {
    this.sheetOpen = false;
    this.cdr.markForCheck();
  }

  get draftSubTopics(): string[] {
    return this.subTopics[this.draft.mainTopic] ?? [];
  }

  get draftSpots(): string[] {
    return this.destinations.find((g) => g.province === this.draft.province)?.spots ?? [];
  }

  onDraftMainTopic(): void {
    this.draft.subTopic = '';
    this.draft.province = '';
    this.draft.specificLocation = '';
  }

  onDraftProvince(): void {
    this.draft.specificLocation = '';
  }

  toggleDay(day: string): void {
    const days = this.draft.daysOfWeek;
    this.draft.daysOfWeek = days.includes(day) ? days.filter((x) => x !== day) : [...days, day];
  }

  apply(): void {
    this.filter = { ...this.draft, title: this.filter.title, daysOfWeek: [...this.draft.daysOfWeek] };
    this.sheetOpen = false;
    this.search();
  }

  clear(): void {
    this.filter = { ...defaultFilter(), title: this.filter.title };
    this.draft = defaultFilter();
    this.sheetOpen = false;
    this.search();
  }
}
