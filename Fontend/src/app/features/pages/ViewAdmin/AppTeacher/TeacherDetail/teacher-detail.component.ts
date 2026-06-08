import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { TeacherProfileService } from '../../../../services/teacherProfile.service';
import { ReviewService } from '../../../../services/review.service';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './teacher-detail.component.html',
  styleUrls: ['./teacher-detail.component.css'],
})
export class TeacherDetailComponent implements OnInit {
  teacher: any = null;

  loading = true;

  safeVideoUrl: SafeResourceUrl | null = null;

  reviews: any[] = [];

  filteredReviews: any[] = [];

  reviewLoading = false;

  reviewError = '';

  selectedRatingFilter = 0;

  approvedPrice = 0;

  adminNote = '';

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

  loadTeacher(id: number): void {
    this.loading = true;

    this.teacherService.getTeacherDetailForAdmin(id).subscribe({
      next: (res: any) => {
        this.teacher = res;

        this.approvedPrice = res.approvedPricePerHour || 0;

        this.adminNote = res.adminNote || '';

        this.loadReviews(this.teacher.userId);

        if (
          this.teacher?.introVideoUrl &&
          !this.teacher.introVideoUrl.startsWith('http')
        ) {
          this.teacher.introVideoUrl =
            'http://localhost:5108/videos/' + this.teacher.introVideoUrl;
        }

        if (this.teacher?.introVideoUrl) {
          this.safeVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            this.teacher.introVideoUrl,
          );
        }

        this.loading = false;
      },

      error: (err) => {
        console.error(err);

        this.loading = false;
      },
    });
  }

  loadReviews(teacherId: number): void {
    this.reviewLoading = true;

    this.reviewService.getByTeacherId(teacherId).subscribe({
      next: (res: any) => {
        this.reviews = res || [];

        this.filteredReviews = this.reviews;

        this.reviewLoading = false;
      },

      error: () => {
        this.reviewError = 'Failed to load reviews';

        this.reviewLoading = false;
      },
    });
  }

  approveTeacher(): void {
    if (this.approvedPrice <= 0) {
      alert('Please enter approved price');

      return;
    }

    this.teacherService
      .approveProfile(
        this.teacher.teacherProfileId,
        this.approvedPrice,
        this.adminNote,
      )
      .subscribe({
        next: () => {
          alert('Approved successfully');

          this.loadTeacher(this.teacher.teacherProfileId);
        },

        error: (err) => {
          console.error(err);

          alert(err?.error?.message || 'Approve failed');
        },
      });
  }

  rejectTeacher(): void {
    if (!this.adminNote.trim()) {
      alert('Please enter rejection note');

      return;
    }

    this.teacherService
      .rejectProfile(this.teacher.teacherProfileId, this.adminNote)
      .subscribe({
        next: () => {
          alert('Rejected successfully');

          this.loadTeacher(this.teacher.teacherProfileId);
        },

        error: (err) => {
          console.error(err);

          alert(err?.error?.message || 'Reject failed');
        },
      });
  }

  banTeacher(): void {
    const reason = prompt('Enter ban reason');

    if (!reason) {
      return;
    }

    this.teacherService
      .banTeacher(this.teacher.teacherProfileId, reason)
      .subscribe({
        next: () => {
          alert('Teacher banned');

          this.loadTeacher(this.teacher.teacherProfileId);
        },

        error: (err) => {
          console.error(err);

          alert(err?.error?.message || 'Ban failed');
        },
      });
  }

  backToList(): void {
    this.router.navigate(['/admin/teachers']);
  }

  canReview(): boolean {
    return this.teacher?.status === 1;
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Created';

      case 1:
        return 'Submitted';

      case 2:
        return 'Approved By Admin';

      case 3:
        return 'Rejected By Admin';

      case 4:
        return 'Approved Teacher';

      case 5:
        return 'Rejected Teacher';

      case 6:
        return 'Banned';

      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1:
        return 'submitted';

      case 2:
        return 'approved-admin';

      case 3:
        return 'rejected-admin';

      case 4:
        return 'approved-teacher';

      case 5:
        return 'rejected-teacher';

      case 6:
        return 'banned';

      default:
        return '';
    }
  }

  setRatingFilter(rating: number): void {
    this.selectedRatingFilter = rating;

    if (rating === 0) {
      this.filteredReviews = this.reviews;

      return;
    }

    this.filteredReviews = this.reviews.filter((x) => x.rating === rating);
  }

  getReviewCount(rating: number): number {
    return this.reviews.filter((x) => x.rating === rating).length;
  }

  getAverageRating(): number {
    if (!this.reviews.length) {
      return 0;
    }

    const total = this.reviews.reduce((sum, x) => sum + x.rating, 0);

    return total / this.reviews.length;
  }

  hasReviews(): boolean {
    return this.reviews.length > 0;
  }

  getImageUrl(url: string): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('http')) {
      return url;
    }

    return `http://localhost:5108/uploads/${url}`;
  }
}
