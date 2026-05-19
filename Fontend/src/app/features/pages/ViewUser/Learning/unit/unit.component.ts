import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';
import { ViewChildren, QueryList, ElementRef } from '@angular/core';
import { LearningService } from '../../../../services/learning.service';

@Component({
  selector: 'app-unit',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './unit.component.html',

  styleUrls: ['./unit.component.css'],
})
export class MyProgressComponent implements OnInit {
  currentLevel: any = null;
  @ViewChildren('unitNode')
  unitNodes!: QueryList<ElementRef>;

  loading = true;

  selectedUnit: any = null;

  showQuiz = false;

  refType: string = 'UNIT';

  refId: number = 0;

  constructor(
    public router: Router,
    private learningService: LearningService,
  ) {}

  ngOnInit(): void {
    this.loadProgress();
  }

  loadProgress() {
    this.loading = true;

    this.learningService.getMyProgress().subscribe({
      next: (res: any) => {
        console.log(res);

        this.currentLevel = {
          ...res.level,
          courses: res.courses || [],
        };

        this.loading = false;
        setTimeout(() => {
          this.scrollToCurrentUnit();
        }, 200);
      },

      error: (err) => {
        console.error(err);

        alert('Failed to load progress');

        this.loading = false;
      },
    });
  }

  openUnit(unit: any) {
    if (unit.status === null) {
      return;
    }

    this.selectedUnit = unit;

    this.refType = 'UNIT';

    this.refId = unit.unitId;
  }

  getunitState(unit: any): string {
    if (unit.status === true) {
      return 'done';
    }

    if (unit.status === false) {
      return 'current';
    }

    return 'locked';
  }

  getCourseState(course: any): string {
    if (!course.units || course.units.length === 0) {
      if (course.status === true) {
        return 'done';
      }

      if (course.status === false) {
        return 'current';
      }

      return 'locked';
    }

    const states: string[] = course.units.map((u: any) => this.getunitState(u));

    if (states.every((s: string) => s === 'done')) {
      return 'done';
    }

    if (states.includes('current')) {
      return 'current';
    }

    if (states.includes('done')) {
      return 'current';
    }

    return 'locked';
  }
  getLevelState(level: any): string {
    if (!level?.courses || level.courses.length === 0) {
      if (level?.status === true) {
        return 'done';
      }

      if (level?.status === false) {
        return 'current';
      }

      return 'locked';
    }

    const states: string[] = level.courses.map((c: any) =>
      this.getCourseState(c),
    );

    if (states.every((s: string) => s === 'done')) {
      return 'done';
    }

    if (states.includes('current')) {
      return 'current';
    }

    if (states.includes('done')) {
      return 'current';
    }

    return 'locked';
  }

  openCourseQuiz(course: any) {
    if (this.getCourseState(course) !== 'current') {
      return;
    }

    const firstUnit = course.units?.[0];

    if (!firstUnit) {
      return;
    }

    this.router.navigate(['/user/quiz'], {
      queryParams: {
        unitId: firstUnit.unitId,
        refType: 'COURSE_JUMP',
        refId: course.courseId,
      },
    });
  }

  closeLesson() {
    this.selectedUnit = null;
  }
  openLevelQuiz(level: any) {
    if (!level?.courses?.length) {
      return;
    }

    let firstUnit: any = null;

    for (const course of level.courses) {
      if (course.units && course.units.length > 0) {
        firstUnit = course.units[0];

        break;
      }
    }

    if (!firstUnit) {
      alert('No unit found');

      return;
    }

    this.router.navigate(['/user/quiz'], {
      queryParams: {
        unitId: firstUnit.unitId,
        refType: 'LEVEL_JUMP',
        refId: level.levelId,
      },
    });
  }
  scrollToCurrentUnit() {
    const nodes = this.unitNodes?.toArray();

    if (!nodes?.length) {
      return;
    }

    let currentIndex = -1;

    this.currentLevel?.courses?.forEach((course: any) => {
      course.units?.forEach((unit: any) => {
        currentIndex++;

        if (this.getunitState(unit) === 'current') {
          const element = nodes[currentIndex]?.nativeElement;

          if (element) {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }
      });
    });
  }
}
