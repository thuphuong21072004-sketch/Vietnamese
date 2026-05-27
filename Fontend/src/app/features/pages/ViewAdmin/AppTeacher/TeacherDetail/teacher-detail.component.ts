import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { TeacherProfileService } from '../../../../services/teacherProfile.service';

import { ReviewService } from '../../../../services/review.service';

import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-teacher-detail',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './teacher-detail.component.html',

  styleUrls: ['./teacher-detail.component.css'],
})
export class TeacherDetailComponent implements OnInit {
  /*
   * teacher detail
   */
  teacher: any = null;

  /*
   * loading
   */
  loading = true;

  /*
   * safe video
   */
  safeVideoUrl: SafeResourceUrl | null = null;

  /*
   * reviews
   */
  reviews: any[] = [];

  filteredReviews: any[] = [];

  reviewLoading = false;

  reviewError = '';

  /*
   * filter rating
   */
  selectedRatingFilter = 0;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    private teacherService: TeacherProfileService,

    private reviewService: ReviewService,

    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadTeacher(id);
  }

  /*
   * load teacher detail
   */
  loadTeacher(id: number) {
    this.loading = true;

    this.teacherService.getTeacherDetail(id).subscribe({
      next: (res: any) => {
        this.teacher = res;

        /*
         * load reviews
         */
        this.loadReviews(this.teacher.teacherProfileId);

        /*
         * convert local video
         */
        if (
          this.teacher?.introVideoUrl &&
          !this.teacher.introVideoUrl.startsWith('http')
        ) {
          const baseUrl = environment.apiBaseUrl.replace('/api', '');

          this.teacher.introVideoUrl = `${baseUrl}/uploads/${this.teacher.introVideoUrl}`;
        }

        /*
         * safe video
         */
        if (this.teacher?.introVideoUrl) {
          this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.teacher.introVideoUrl,
          );
        }

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        alert('Failed to load teacher detail');

        this.loading = false;
      },
    });
  }

  /*
   * load reviews
   */
  loadReviews(teacherId: number) {
    this.reviewLoading = true;

    this.reviewError = '';

    this.reviewService.getByTeacherId(teacherId).subscribe({
      next: (res: any) => {
        this.reviews = res || [];

        this.filteredReviews = this.reviews;

        this.reviewLoading = false;
      },

      error: (err) => {
        console.log(err);

        this.reviewError = 'Failed to load reviews';

        this.reviewLoading = false;
      },
    });
  }

  /*
   * has reviews
   */
  hasReviews(): boolean {
    return this.reviews.length > 0;
  }

  /*
   * average rating
   */
  getAverageRating(): number {
    if (!this.reviews.length) {
      return 0;
    }

    const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);

    return total / this.reviews.length;
  }

  /*
   * review count
   */
  getReviewCount(rating: number): number {
    return this.reviews.filter((review) => review.rating === rating).length;
  }

  /*
   * filter reviews
   */
  setRatingFilter(rating: number) {
    this.selectedRatingFilter = rating;

    /*
     * all
     */
    if (rating === 0) {
      this.filteredReviews = this.reviews;

      return;
    }

    this.filteredReviews = this.reviews.filter(
      (review) => review.rating === rating,
    );
  }

  /*
   * approve teacher
   */
  approveTeacher() {
    if (!confirm('Approve this teacher profile?')) {
      return;
    }

    this.teacherService
      .approveProfile(this.teacher.teacherProfileId)
      .subscribe({
        next: () => {
          this.teacher.status = 2;

          alert('Teacher approved successfully');
        },

        error: (err) => {
          console.error(err);

          alert('Failed to approve teacher');
        },
      });
  }

  /*
   * reject teacher
   */
  rejectTeacher() {
    if (!confirm('Reject this teacher profile?')) {
      return;
    }

    this.teacherService.rejectProfile(this.teacher.teacherProfileId).subscribe({
      next: () => {
        this.teacher.status = 3;

        alert('Teacher rejected successfully');
      },

      error: (err) => {
        console.error(err);

        alert('Failed to reject teacher');
      },
    });
  }

  /*
   * ban teacher
   */
  banTeacher() {
    if (!confirm('Bạn có chắc muốn khóa giáo viên này?')) {
      return;
    }

    this.teacherService.banTeacher(this.teacher.teacherProfileId).subscribe({
      next: () => {
        this.teacher.status = 4;

        alert('Khóa giáo viên thành công');
      },

      error: (err) => {
        console.log(err);

        alert('Có lỗi xảy ra');
      },
    });
  }

  /*
   * back
   */
  backToList() {
    this.router.navigate(['/admin/teachers']);
  }

  /*
   * can review
   */
  canReview(): boolean {
    return this.teacher?.status === 1;
  }

  /*
   * status text
   */
  getStatusText(status: number): string {
    switch (status) {
      case 1:
        return 'Pending';

      case 2:
        return 'Approved';

      case 3:
        return 'Rejected';

      case 4:
        return 'Banned';

      default:
        return 'Unknown';
    }
  }

  /*
   * status class
   */
  getStatusClass(status: number): string {
    switch (status) {
      case 1:
        return 'pending';

      case 2:
        return 'approved';

      case 3:
        return 'rejected';

      case 4:
        return 'banned';

      default:
        return '';
    }
  }

  /*
   * image url
   */
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

    const baseUrl = environment.apiBaseUrl.replace('/api', '');

    return `${baseUrl}/uploads/${url}`;
  }
}
