import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent, ViewWillEnter } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { LearningService } from '@web/services/learning.service';
import { IconComponent } from '../../ui/icon.component';
import { EmptyStateComponent, LoadingComponent } from '../../ui/states.component';

type NodeState = 'done' | 'current' | 'locked';

interface PathNode {
  unit: any;
  index: number; // thứ tự trong course (1-based)
  state: NodeState;
  x: number; // lệch ngang kiểu zig-zag
}

interface PathCourse {
  course: any;
  order: number;
  done: number;
  total: number;
  state: NodeState;
  nodes: PathNode[];
}

/** Lệch ngang của node — lặp lại nhịp trong design (0, 56, 84, 40, -30, -70). */
const ZIGZAG = [0, 56, 84, 40, -30, -70];

/** 05 Learning Path — design-mobile/screens/LearningPath.dc.html */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonRefresher, IonRefresherContent, RouterLink, IconComponent, LoadingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './learning-path.page.html',
  styleUrls: ['./learning-path.page.css'],
})
export class LearningPathPage implements ViewWillEnter {
  private learning = inject(LearningService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private host = inject(ElementRef<HTMLElement>);
  @ViewChild(IonContent) content?: IonContent;

  readonly icons = {
    done: 'M20 6 9 17l-5-5',
    current: 'M8 5v14l11-7z',
    locked: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
    star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
    trophy: 'M6 9H4a2 2 0 0 1 0-4h2M18 9h2a2 2 0 0 0 0-4h-2M6 3h12v7a6 6 0 0 1-12 0zM12 16v4M8 21h8',
  };

  loading = true;
  level: any = null;
  courses: PathCourse[] = [];
  levelState: NodeState = 'locked';
  private scrolled = false;

  ionViewWillEnter(): void {
    // Tải lại mỗi lần vào tab (sau khi làm bài, unit tiếp theo được mở khóa)
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.learning.getMyProgress());
      this.level = res?.level ?? null;
      this.courses = (res?.courses ?? []).map((c: any, ci: number) => this.toCourse(c, ci));
      this.levelState = this.combine(this.courses.map((c) => c.state), this.level?.status);
    } catch {
      this.level = null;
      this.courses = [];
    }
    this.loading = false;
    this.cdr.markForCheck();
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
    if (!this.scrolled) setTimeout(() => this.scrollToCurrent(), 250);
  }

  private toCourse(course: any, ci: number): PathCourse {
    let k = 0;
    const nodes: PathNode[] = (course.units ?? []).map((unit: any, i: number) => ({
      unit,
      index: i + 1,
      state: this.unitState(unit),
      x: ZIGZAG[(ci * 3 + k++) % ZIGZAG.length],
    }));
    return {
      course,
      order: ci + 1,
      done: nodes.filter((n) => n.state === 'done').length,
      total: nodes.length,
      state: this.combine(nodes.map((n) => n.state), course.status),
      nodes,
    };
  }

  // Cùng quy tắc với web (unit.component.ts): status true = xong, false = đang học, null = khóa
  private unitState(unit: any): NodeState {
    if (unit.status === true) return 'done';
    if (unit.status === false) return 'current';
    return 'locked';
  }

  private combine(states: NodeState[], ownStatus: any): NodeState {
    if (!states.length) {
      if (ownStatus === true) return 'done';
      if (ownStatus === false) return 'current';
      return 'locked';
    }
    if (states.every((s) => s === 'done')) return 'done';
    if (states.includes('current') || states.includes('done')) return 'current';
    return 'locked';
  }

  openUnit(node: PathNode): void {
    if (node.state === 'locked') return;
    this.router.navigate(['/lesson', node.unit.unitId], { queryParams: { n: node.index } });
  }

  openCourseQuiz(c: PathCourse): void {
    if (c.state !== 'current') return;
    const first = c.course.units?.[0];
    if (!first) return;
    this.router.navigate(['/quiz'], {
      queryParams: { unitId: first.unitId, refType: 'COURSE_JUMP', refId: c.course.courseId },
    });
  }

  openLevelQuiz(): void {
    if (this.levelState !== 'current' || !this.level) return;
    const first = this.courses.find((c) => c.course.units?.length)?.course.units[0];
    this.router.navigate(['/quiz'], {
      queryParams: { unitId: first?.unitId, refType: 'LEVEL_JUMP', refId: this.level.levelId },
    });
  }

  private scrollToCurrent(): void {
    const el = (this.host.nativeElement as HTMLElement).querySelector('.node.is-current') as HTMLElement | null;
    if (!el || !this.content) return;
    this.scrolled = true;
    this.content.scrollToPoint(0, Math.max(0, el.offsetTop - 160), 400);
  }
}
