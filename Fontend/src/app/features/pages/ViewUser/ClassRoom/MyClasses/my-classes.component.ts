import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { ClassEnrollmentService } from '../../../../services/class-enrollment.service';
import { ClassEnrollmentDto } from '../../../../models/class-enrollment.model';

import { vnSessionTime } from '../../../../../core/utils/vn-time';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-my-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './my-classes.component.html',
  styleUrls: ['./my-classes.component.css'],
})
export class MyClassesComponent implements OnInit {
  serverUrl = environment.serverUrl;

  enrollments: ClassEnrollmentDto[] = [];
  loading = false;

  titleFilter: string = '';
  statusFilter: number | '' = '';
  studyDateFilter: string = '';

  get filteredEnrollments(): ClassEnrollmentDto[] {
    let list = this.enrollments;

    if (this.titleFilter.trim()) {
      const kw = this.titleFilter.trim().toLowerCase();
      list = list.filter(e => e.classTitle?.toLowerCase().includes(kw));
    }

    if (this.statusFilter !== '') {
      list = list.filter(e => e.status === Number(this.statusFilter));
    }

    if (this.studyDateFilter) {
      list = list.filter(e =>
        e.status !== 0 && e.status !== 4 && e.status !== 5 &&
        e.sessions?.some(s => s.studyDate === this.studyDateFilter)
      );
    }

    return list;
  }

  clearFilters(): void {
    this.titleFilter = '';
    this.statusFilter = '';
    this.studyDateFilter = '';
  }

  constructor(
    private enrollmentService: ClassEnrollmentService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.enrollmentService.getMyClasses().subscribe({
      next: (res) => {
        this.enrollments = res;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  canReview(item: ClassEnrollmentDto): boolean {
    return item.status === 3 && item.hasReview === false;
  }

  hasReviewed(item: ClassEnrollmentDto): boolean {
    return item.status === 3 && item.hasReview === true;
  }

  canEnrollAgain(item: ClassEnrollmentDto): boolean {
    if (!item.sessions?.length) return true;
    const first = item.sessions.reduce((a, b) =>
      a.sessionNumber < b.sessionNumber ? a : b
    );
    const firstStart = vnSessionTime(first.studyDate, first.startTime);
    return new Date() < firstStart;
  }

  writeReview(item: ClassEnrollmentDto): void {
    this.router.navigate(['/review', item.classId], {
      queryParams: { type: 'CLASS', enrollmentId: item.enrollmentId },
    });
  }

  viewReview(item: ClassEnrollmentDto): void {
    this.router.navigate(['/review', item.classId], {
      queryParams: { type: 'CLASS', enrollmentId: item.enrollmentId },
    });
  }

  viewClass(classId: number): void {
    this.router.navigate(['/user/classdetail', classId]);
  }

  cancel(enrollmentId: number): void {
    if (!confirm('Cancel this enrollment?')) return;
    this.enrollmentService.cancel(enrollmentId).subscribe(() => {
      this.loadData();
    });
  }

  enroll(classId: number): void {
    this.enrollmentService.enroll(classId).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.loadData();
          return;
        }
        this.router.navigate(['/payment', res.enrollmentId], {
          queryParams: { type: 'CLASS' },
        });
      },
      error: (err: any) => {
        alert(err.error?.message || 'Failed to enroll');
      },
    });
  }

  viewSchedule(): void {
    this.router.navigate(['/user/schedule']);
  }
}
