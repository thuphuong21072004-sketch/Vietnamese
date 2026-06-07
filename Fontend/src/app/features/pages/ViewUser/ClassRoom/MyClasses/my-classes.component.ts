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
reviewedEnrollments = new Set<number>();

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
  this.reviewedEnrollments.clear();

  this.enrollments.forEach((item) => {
    if (item.status !== 3) {
      return;
    }

    this.reviewService
      .getByRef('CLASS', item.enrollmentId)
      .subscribe({
        next: (review: any) => {
          if (review) {
            this.reviewedEnrollments.add(
              item.enrollmentId,
            );
          }
        },
      });
  });
}

canReview(item: any): boolean {
  return (
    item.status === 3 &&
    !this.reviewedEnrollments.has(
      item.enrollmentId,
    )
  );
}

hasReviewed(item: any): boolean {
  return this.reviewedEnrollments.has(
    item.enrollmentId,
  );
}

writeReview(enrollmentId: number): void {
  this.router.navigate(
    ['/review', enrollmentId],
    {
      queryParams: {
        type: 'CLASS',
      },
    },
  );
}

viewReview(enrollmentId: number): void {
  this.router.navigate(
    ['/review', enrollmentId],
    {
      queryParams: {
        type: 'CLASS',
      },
    },
  );
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
