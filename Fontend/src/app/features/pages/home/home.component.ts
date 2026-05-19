import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { LearningService } from '../../services/learning.service';
import { CourseDTO } from '../../models/course.model';
import { LevelDTO } from '../../models/level.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  heroTitle = 'Master Vietnamese with a modern study path';

  heroDescription =
    'Learn naturally through interactive lessons, pronunciation drills, quizzes, and a clear course progression.';

  features = [
    {
      title: 'Structured learning',
      description:
        'Move confidently from beginner basics to advanced conversation skills.',
    },
    {
      title: 'Smart practice',
      description:
        'Review vocabulary and grammar with quizzes, videos and speaking exercises.',
    },
    {
      title: 'Progress visibility',
      description:
        'Track your courses, units, and skills so you always know what to study next.',
    },
  ];

  levels: LevelDTO[] = [];
  isLoading = false;
  errorMessage = '';
  expandedLevels = new Set<number>();
  expandedCourses = new Set<number>();

  constructor(private learningService: LearningService) {}

  ngOnInit(): void {
    this.loadLevels();
  }

  toggleLevel(levelId: number): void {
    if (this.expandedLevels.has(levelId)) {
      this.expandedLevels.delete(levelId);
    } else {
      this.expandedLevels.add(levelId);
    }
  }

  isLevelExpanded(levelId: number): boolean {
    return this.expandedLevels.has(levelId);
  }

  toggleCourse(courseId: number): void {
    if (this.expandedCourses.has(courseId)) {
      this.expandedCourses.delete(courseId);
    } else {
      this.expandedCourses.add(courseId);
    }
  }

  isCourseExpanded(courseId: number): boolean {
    return this.expandedCourses.has(courseId);
  }

  get totalCourses(): number {
    return this.levels.reduce(
      (sum, level) => sum + (level.courses?.length || 0),
      0,
    );
  }

  get totalUnits(): number {
    return this.levels.reduce(
      (sum, level) =>
        sum +
        (level.courses?.reduce(
          (courseSum, course) => courseSum + (course.units?.length || 0),
          0,
        ) || 0),
      0,
    );
  }

  getUnitsCount(level: LevelDTO): number {
    return (
      level.courses?.reduce(
        (sum, course) => sum + (course.units?.length || 0),
        0,
      ) || 0
    );
  }

  private loadLevels(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.learningService
      .getLevels()
      .pipe(
        switchMap((levels) => {
          this.levels = levels || [];
          if (!this.levels.length) {
            return of(this.levels);
          }

          const levelRequests = this.levels.map((level) =>
            this.learningService.getCourses(level.levelId).pipe(
              switchMap((courses) => {
                const unitRequests = courses.map((course) =>
                  this.learningService
                    .getUnits(course.courseId)
                    .pipe(map((units) => ({ ...course, units }))),
                );

                return unitRequests.length
                  ? forkJoin(unitRequests)
                  : of([] as CourseDTO[]);
              }),
              map((coursesWithUnits) => ({
                ...level,
                courses: coursesWithUnits,
              })),
            ),
          );

          return levelRequests.length
            ? forkJoin(levelRequests)
            : of(this.levels);
        }),
      )
      .subscribe({
        next: (fullLevels) => {
          this.levels = fullLevels || [];
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage =
            'Unable to load learning paths right now. Please try again later.';
          this.isLoading = false;
        },
      });
  }
  getImageUrl(url: string): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('data:')) {
      return url;
    }

    if (url.startsWith('http')) {
      return url;
    }

    return `http://localhost:5108/uploads/${url}`;
  }
}