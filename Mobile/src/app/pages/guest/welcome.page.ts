import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LearningService } from '@web/services/learning.service';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { LoadingComponent } from '../../ui/states.component';
import {
  ANDROID_APK_URL,
  DOWNLOAD_ICON,
  canOfferAndroidApp,
  canOfferIosInstallHint,
  canSwitchToDesktop,
  switchToDesktopSite,
} from '../../core/site-switch';

interface GuestCourse {
  courseId: number;
  courseName: string;
  description?: string;
  units: string[]; // tên unit (rỗng nếu backend chưa cho khách xem unit)
}

interface GuestLevel {
  levelId: number;
  levelName: string;
  description?: string;
  courses: GuestCourse[];
}

/**
 * Trang giới thiệu cho khách (chưa đăng nhập) — chưa có design, dựng theo ui-spec §3 "Home" của web:
 * hero (nút Register / Login duy nhất trên trang), số liệu, lý do chọn, lộ trình (level → khóa học) dạng accordion,
 * lối vào Vocabulary Search (/search) không cần tài khoản.
 */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonRefresher, IonRefresherContent, RouterLink, IconComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.css'],
})
export class WelcomePage implements OnInit {
  private learning = inject(LearningService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = {
    ...ICONS,
    chevronDown: 'm6 9 6 6 6-6',
    route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h6M18 9v6a4 4 0 0 1-4 4H8',
    sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 17l.9 2.1L22 20l-2.1.9L19 23l-.9-2.1L16 20l2.1-.9z',
    chart: ICONS.chart,
  };

  readonly features = [
    { title: 'Structured learning', text: 'Move confidently from beginner basics to advanced conversation skills.', d: this.icons.route },
    { title: 'Smart practice', text: 'Review vocabulary and grammar with quizzes, videos and speaking exercises.', d: this.icons.sparkles },
    { title: 'Progress visibility', text: 'Track your courses, units, and skills so you always know what to study next.', d: this.icons.chart },
  ];

  readonly showDesktopLink = canSwitchToDesktop();
  readonly switchToDesktop = switchToDesktopSite;
  readonly offerAndroidApp = canOfferAndroidApp();
  readonly offerIosHint = canOfferIosInstallHint();
  readonly apkUrl = ANDROID_APK_URL;
  readonly downloadIcon = DOWNLOAD_ICON;
  loading = true;
  error = '';
  levels: GuestLevel[] = [];
  openLevels = new Set<number>();

  ngOnInit(): void {
    this.load();
  }

  /** true khi backend trả được unit cho khách (listUnits không còn lỗi 500 khi chưa đăng nhập). */
  unitsAvailable = false;

  get totalCourses(): number {
    return this.levels.reduce((s, l) => s + l.courses.length, 0);
  }

  get totalUnits(): number {
    return this.levels.reduce((s, l) => s + this.unitsOf(l), 0);
  }

  unitsOf(level: GuestLevel): number {
    return level.courses.reduce((s, c) => s + c.units.length, 0);
  }

  toggleLevel(id: number): void {
    this.openLevels.has(id) ? this.openLevels.delete(id) : this.openLevels.add(id);
  }

  /**
   * Levels → courses → units (giống web). Bản backend cũ trả lỗi 500 cho listUnits khi chưa đăng nhập
   * → gửi thử 1 request trước; lỗi thì chỉ hiển thị tới cấp khóa học, không gọi tiếp.
   */
  async load(event?: CustomEvent): Promise<void> {
    this.error = '';
    try {
      const levels: any[] = (await firstValueFrom(this.learning.getLevels())) ?? [];
      const courseLists: any[][] = await firstValueFrom(
        levels.length
          ? forkJoin(levels.map((l) => this.learning.getCourses(l.levelId).pipe(catchError(() => of([] as any[])))))
          : of([] as any[][]),
      );
      const allCourses = courseLists.flat();
      const unitsByCourse = new Map<number, string[]>();
      this.unitsAvailable = false;
      if (allCourses.length) {
        const probe = await firstValueFrom(this.learning.getUnits(allCourses[0].courseId).pipe(catchError(() => of(null))));
        if (probe) {
          this.unitsAvailable = true;
          unitsByCourse.set(allCourses[0].courseId, probe.map((u: any) => u.unitName));
          const rest = allCourses.slice(1);
          const lists = rest.length
            ? await firstValueFrom(forkJoin(rest.map((c: any) => this.learning.getUnits(c.courseId).pipe(catchError(() => of([] as any[]))))))
            : [];
          rest.forEach((c: any, i: number) => unitsByCourse.set(c.courseId, (lists[i] ?? []).map((u: any) => u.unitName)));
        }
      }
      this.levels = levels.map((l, i) => ({
        levelId: l.levelId,
        levelName: l.levelName,
        description: l.description,
        courses: (courseLists[i] ?? []).map((c: any) => ({
          courseId: c.courseId,
          courseName: c.courseName,
          description: c.description,
          units: unitsByCourse.get(c.courseId) ?? [],
        })),
      }));
    } catch {
      this.error = 'Unable to load learning paths right now. Please try again later.';
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }
}
