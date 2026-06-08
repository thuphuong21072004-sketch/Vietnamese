import { Component, OnInit } from '@angular/core';
import { CommonModule} from '@angular/common';

import { Router, RouterModule } from '@angular/router';

import { ClassEnrollmentService } from '../../../../services/class-enrollment.service';

import { ClassEnrollmentDto } from '../../../../models/class-enrollment.model';
import { ReviewService } from '../../../../services/review.service';
@Component({
  selector: 'app-my-classes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-classes.component.html',
  styleUrls: ['./my-classes.component.css'],
})
export class MyClassesComponent implements OnInit {
  enrollments: ClassEnrollmentDto[] = [];

  loading = false;

  constructor(
  private enrollmentService: ClassEnrollmentService,
  private reviewService: ReviewService,
  private router: Router,
) {}
reviewStatusMap: Record<number, boolean> = {};

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.enrollmentService.getMyClasses().subscribe({
      next: (res) => {
  this.enrollments = res;

  this.checkReviewedEnrollments();

  this.loading = false;
},

      error: () => {
        this.loading = false;
      },
    });
  }

  checkReviewedEnrollments(): void {
    const initialMap: Record<number, boolean> = {};
    this.enrollments
      .filter((item) => item.status === 3)
      .forEach((item) => { initialMap[item.classId] = false; });
    this.reviewStatusMap = initialMap;

    this.enrollments
      .filter((item) => item.status === 3)
      .forEach((item) => {
        this.reviewService.getByRef('CLASS', item.classId).subscribe({
          next: (review: any) => {
            this.reviewStatusMap = {
              ...this.reviewStatusMap,
              [item.classId]: !!review,
            };
          },
          error: () => {
            // keep false
          },
        });
      });
  }

  canReview(item: any): boolean {
    return (
      item.status === 3 &&
      this.reviewStatusMap[item.classId] === false
    );
  }

  hasReviewed(item: any): boolean {
    return (
      item.status === 3 &&
      this.reviewStatusMap[item.classId] === true
    );
  }

writeReview(item: ClassEnrollmentDto): void {
  this.router.navigate(['/review', item.classId], {
    queryParams: {
      type: 'CLASS',
      enrollmentId: item.enrollmentId,
    },
  });
}

viewReview(item: ClassEnrollmentDto): void {
  this.router.navigate(['/review', item.classId], {
    queryParams: {
      type: 'CLASS',
      enrollmentId: item.enrollmentId,
    },
  });
}

  viewClass(classId: number): void {
    this.router.navigate(['/user/classdetail', classId]);
  }

  cancel(enrollmentId: number): void {
    if (!confirm('Cancel this enrollment?')) {
      return;
    }

    this.enrollmentService.cancel(enrollmentId).subscribe(() => {
      this.loadData();
    });
  }
  viewSchedule(): void {
    this.router.navigate(['/user/schedule']);
  }
}
