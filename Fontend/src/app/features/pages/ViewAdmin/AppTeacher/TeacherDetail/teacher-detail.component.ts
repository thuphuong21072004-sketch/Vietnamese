import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { ActivatedRoute, Router } from '@angular/router';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { TeacherProfileService } from '../../../../services/teacherProfile.service';

@Component({
  selector: 'app-teacher-detail',

  standalone: true,

  imports: [CommonModule],

  templateUrl: './teacher-detail.component.html',

  styleUrls: ['./teacher-detail.component.css'],
})
export class TeacherDetailComponent implements OnInit {
  teacher: any = null;

  loading = true;

  safeVideoUrl: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,

    private router: Router,

    private teacherService: TeacherProfileService,

    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.loadTeacher(id);
  }

  loadTeacher(id: number) {
    this.loading = true;

    this.teacherService.getTeacherDetail(id).subscribe({
      next: (res: any) => {
        this.teacher = res;

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

  backToList() {
    this.router.navigate(['/admin/teachers']);
  }

  canReview(): boolean {
    return this.teacher?.status === 1;
  }

  getStatusText(status: number): string {
    switch (status) {
      case 1:
        return 'Pending';

      case 2:
        return 'Approved';

      case 3:
        return 'Rejected';

      default:
        return 'Unknown';
    }
  }

  getStatusClass(status: number): string {
    switch (status) {
      case 1:
        return 'pending';

      case 2:
        return 'approved';

      case 3:
        return 'rejected';

      default:
        return '';
    }
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
