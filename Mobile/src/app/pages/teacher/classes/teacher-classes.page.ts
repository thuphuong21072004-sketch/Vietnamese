import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonModal, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { TeacherClassService } from '@web/services/teacher-class.service';
import { TeacherClassDto } from '@web/models/teacher-class.model';
import { ClassFilterDto } from '@web/models/class-filter.model';
import { FeedbackService } from '../../../core/feedback.service';
import { errorMessage } from '../../../core/errors';
import { IconComponent, ICONS } from '../../../ui/icon.component';
import { BadgeComponent } from '../../../ui/badge.component';
import { EmptyStateComponent, LoadingComponent } from '../../../ui/states.component';
import { DESTINATIONS, MAIN_TOPICS, SUB_TOPICS, T_ICONS, WEEK_DAYS, classLifecycle, hhmm, shortDay, spotsOf } from '../teacher.utils';

interface ClassFilterForm extends ClassFilterDto {
  daysOfWeek: string[];
}

/** 26 My Group Classes — design-mobile/screens/TeacherClasses.dc.html (bộ lọc nhiều trường → bottom sheet) */
@Component({
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    IonModal,
    IonRefresher,
    IonRefresherContent,
    FormsModule,
    RouterLink,
    DatePipe,
    IconComponent,
    BadgeComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './teacher-classes.page.html',
  styleUrls: ['../teacher-shared.css', './teacher-classes.page.css'],
})
export class TeacherClassesPage implements OnInit {
  private classService = inject(TeacherClassService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = { ...ICONS, ...T_ICONS };
  readonly mainTopics = MAIN_TOPICS;
  readonly subTopics = SUB_TOPICS;
  readonly destinations = DESTINATIONS;
  readonly weekDays = WEEK_DAYS;
  readonly statusChips = [
    { value: '', label: 'All Statuses' },
    { value: 'Upcoming', label: 'Upcoming' },
    { value: 'Ongoing', label: 'Ongoing' },
    { value: 'Completed', label: 'Completed' },
  ];
  readonly hhmm = hhmm;
  readonly shortDay = shortDay;

  loading = true;
  classes: TeacherClassDto[] = [];

  filter: ClassFilterForm = this.emptyFilter();
  classStatusFilter = '';
  studyDateFilter = '';
  filterProvince = '';
  filterSpecificLocation = '';

  sheetOpen = false;

  ngOnInit(): void {
    this.search();
  }

  private emptyFilter(): ClassFilterForm {
    return {
      title: '',
      mainTopic: '',
      subTopic: '',
      startDate: undefined,
      endDate: undefined,
      startTime: undefined,
      endTime: undefined,
      daysOfWeek: [],
    };
  }

  status(item: TeacherClassDto): string {
    return classLifecycle(item.sessions);
  }

  get filtered(): TeacherClassDto[] {
    let list = this.classes;
    if (this.classStatusFilter) list = list.filter((c) => this.status(c) === this.classStatusFilter);
    if (this.studyDateFilter && this.classStatusFilter) {
      list = list.filter((c) => c.sessions?.some((s) => s.studyDate?.substring(0, 10) === this.studyDateFilter));
    }
    if (this.filterProvince) list = list.filter((c) => c.province === this.filterProvince);
    if (this.filterSpecificLocation) list = list.filter((c) => c.specificLocation === this.filterSpecificLocation);
    return list;
  }

  /** Số bộ lọc trong sheet đang bật (hiện chấm trên nút Filters). */
  get activeFilterCount(): number {
    const f = this.filter;
    return [
      f.mainTopic,
      f.subTopic,
      this.filterProvince,
      this.filterSpecificLocation,
      this.studyDateFilter,
      f.startDate,
      f.endDate,
      f.startTime,
      f.endTime,
      f.daysOfWeek.length ? 'x' : '',
    ].filter(Boolean).length;
  }

  get spots(): string[] {
    return spotsOf(this.filterProvince);
  }

  topicLine(c: TeacherClassDto): string {
    if (c.mainTopic === 'Travel') {
      return ['Travel', c.province, c.specificLocation].filter(Boolean).join(' · ');
    }
    return [c.mainTopic, c.subTopic].filter(Boolean).join(' · ');
  }

  onMainTopicChange(): void {
    this.filter.subTopic = '';
    this.filterProvince = '';
    this.filterSpecificLocation = '';
  }

  onProvinceChange(): void {
    this.filterSpecificLocation = '';
  }

  setStatus(v: string): void {
    this.classStatusFilter = v;
    if (!v) this.studyDateFilter = '';
  }

  toggleDay(day: string): void {
    const days = this.filter.daysOfWeek;
    this.filter.daysOfWeek = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
  }

  async search(event?: CustomEvent): Promise<void> {
    const request: ClassFilterDto = {
      ...this.filter,
      startDate: this.filter.startDate || undefined,
      endDate: this.filter.endDate || undefined,
      startTime: this.filter.startTime ? `${this.filter.startTime}:00` : undefined,
      endTime: this.filter.endTime ? `${this.filter.endTime}:00` : undefined,
    };
    this.loading = !event;
    this.cdr.markForCheck();
    try {
      this.classes = await firstValueFrom(this.classService.searchMyClasses(request));
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Cannot load classes'), 'error');
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  apply(): void {
    this.sheetOpen = false;
    this.search();
  }

  clear(): void {
    const title = this.filter.title;
    this.filter = { ...this.emptyFilter(), title };
    this.classStatusFilter = '';
    this.studyDateFilter = '';
    this.filterProvince = '';
    this.filterSpecificLocation = '';
    this.sheetOpen = false;
    this.search();
  }
}
