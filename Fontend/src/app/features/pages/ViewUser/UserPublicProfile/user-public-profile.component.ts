import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { ReviewService } from '../../../services/review.service';

@Component({
  selector: 'app-user-public-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-public-profile.component.html',
  styleUrls: ['./user-public-profile.component.css'],
})
export class UserPublicProfileComponent implements OnInit {
  profile: any = null;
  loading = true;

  reviews: any[] = [];
  reviewsLoading = false;
  ratingFilter = 0;

  get filteredReviews(): any[] {
    return this.ratingFilter === 0
      ? this.reviews
      : this.reviews.filter(r => r.rating === this.ratingFilter);
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
  }

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.accountService.getUserPublicProfile(id).subscribe({
      next: (data) => {
        this.profile = data;
        this.loading = false;
        if (data.teacherProfile) {
          this.loadReviews(data.userId);
        }
      },
      error: () => { this.loading = false; },
    });
  }

  loadReviews(userId: number): void {
    this.reviewsLoading = true;
    this.reviewService.getByTeacherId(userId).subscribe({
      next: (data) => { this.reviews = data ?? []; this.reviewsLoading = false; },
      error: () => { this.reviewsLoading = false; },
    });
  }

  setFilter(rating: number): void {
    this.ratingFilter = rating;
  }

  countByRating(rating: number): number {
    return this.reviews.filter(r => r.rating === rating).length;
  }

  goBack(): void {
    window.history.back();
  }

  avatarUrl(url: string | null): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:5108/uploads/${url}`;
  }

  videoUrl(url: string | null): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:5108/videos/${url}`;
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = { User: 'Student', Admin: 'Admin', Moderator: 'Teacher' };
    return map[role] ?? role ?? 'User';
  }

  starArray(): number[] {
    return [1, 2, 3, 4, 5];
  }
}
