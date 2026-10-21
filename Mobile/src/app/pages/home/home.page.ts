import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LearningService } from '@web/services/learning.service';
import { ClassEnrollmentService } from '@web/services/class-enrollment.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { AvatarComponent } from '../../ui/avatar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';

interface ContinueCard {
  levelLine: string;
  unitTitle: string;
  done: number;
  total: number;
}

/** 03 Home (đã đăng nhập) — design-mobile/screens/Home.dc.html */
@Component({
  standalone: true,
  imports: [IonContent, IonRefresher, IonRefresherContent, RouterLink, DatePipe, UpperCasePipe, AvatarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.css'],
})
export class HomePage implements OnInit {
  private learning = inject(LearningService);
  private enrollments = inject(ClassEnrollmentService);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);
  readonly auth = inject(AuthService);
  readonly icons = ICONS;

  readonly quick = [
    { label: 'Practice Speaking', link: '/learn/speaking', d: ICONS.mic },
    { label: 'Vocabulary Search', link: '/learn/vocab', d: ICONS.search },
    { label: 'Practice Tests', link: '/learn/tests', d: ICONS.checkSquare },
    { label: 'Travel Plans', link: '/travel/trips', d: ICONS.pin },
  ];

  loading = true;
  progress: ContinueCard | null = null;
  counts = { levels: 0, courses: 0, units: 0 };
  next: any = null;

  ngOnInit(): void {
    this.load();
  }

  get firstName(): string {
    const name = this.auth.user()?.name?.trim() ?? '';
    return name.split(/\s+/).pop() || name;
  }

  async load(event?: CustomEvent): Promise<void> {
    await Promise.all([this.loadProgress(), this.loadCounts(), this.loadNext()]);
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  notifications(): void {
    this.fb.toast('No new notifications');
  }

  get percent(): number {
    return this.progress?.total ? Math.round((this.progress.done / this.progress.total) * 100) : 0;
  }

  /** "Continue learning": level hiện tại, unit đang học (status=false), số unit đã xong (status=true). */
  private async loadProgress(): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.learning.getMyProgress());
      const level = res?.level;
      const courses: any[] = res?.courses ?? [];
      if (!level || !courses.length) {
        this.progress = null;
        return;
      }
      let done = 0;
      let total = 0;
      let current: { course: any; unit: any; index: number } | null = null;
      for (const course of courses) {
        (course.units ?? []).forEach((unit: any, i: number) => {
          total++;
          if (unit.status === true) done++;
          if (unit.status === false && !current) current = { course, unit, index: i };
        });
      }
      const cur = current as { course: any; unit: any; index: number } | null;
      this.progress = {
        levelLine: cur ? `${level.levelName} · ${cur.course.courseName}` : level.levelName,
        unitTitle: cur ? `Unit ${cur.index + 1} · ${cur.unit.unitName}` : 'All units completed',
        done,
        total,
      };
    } catch {
      this.progress = null;
    }
  }

  private async loadCounts(): Promise<void> {
    try {
      const levels = await firstValueFrom(this.learning.getLevels());
      const courseLists = await firstValueFrom(
        levels.length
          ? forkJoin(levels.map((l) => this.learning.getCourses(l.levelId).pipe(catchError(() => of([])))))
          : of([] as any[][]),
      );
      const courses = courseLists.flat();
      const unitLists = await firstValueFrom(
        courses.length
          ? forkJoin(courses.map((c: any) => this.learning.getUnits(c.courseId).pipe(catchError(() => of([])))))
          : of([] as any[][]),
      );
      this.counts = { levels: levels.length, courses: courses.length, units: unitLists.flat().length };
    } catch {
      // giữ 0
    }
  }

  private async loadNext(): Promise<void> {
    try {
      const list = await firstValueFrom(this.enrollments.getStudentUpcomingSchedule());
      this.next = list?.[0] ?? null;
    } catch {
      this.next = null;
    }
  }

  time(t: string | null | undefined): string {
    return (t ?? '').slice(0, 5);
  }
}
