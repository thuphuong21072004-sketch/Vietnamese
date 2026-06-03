import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { TeacherProfileService } from '../../../services/teacherProfile.service';

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './becometeacher.component.html',
  styleUrls: ['./becometeacher.component.css'],
})
export class TeacherProfileComponent implements OnInit {
  profile: any = {
    teacherProfileId: 0,
    userId: 0,
    teacherName: '',
    country: '',
    avatarUrl: '',
    introVideoUrl: '',
    englishCertificateUrl: '',
    specialty: '',
    experienceYears: 0,
    description: '',
    desiredPricePerHour: 0,
    approvedPricePerHour: null,
    ratingAverage: 0,
    totalReviews: 0,
    status: 0,
    adminNote: '',
    approvedBy: '',
  };

  loading = false;
  hasProfile = false;
  userRole: string | null = null;
  isPrivilegedTeacherUser = false;
  videoPreviewUrl = '';

  constructor(private teacherService: TeacherProfileService) {}

  ngOnInit(): void {
    this.userRole = this.getRoleFromToken();

    this.isPrivilegedTeacherUser =
      this.userRole === 'Admin' || this.userRole === 'Moderator';

    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;

    this.teacherService.getMyProfile().subscribe({
      next: (res: any) => {
        if (res) {
          this.profile = res;
          this.hasProfile = true;
        }

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      },
    });
  }

  canEdit(): boolean {
    return (
      this.profile.status === 0 ||
      this.profile.status === 3 ||
      this.profile.status === 5
    );
  }

  canSave(): boolean {
    return (
      this.profile.status === 0 ||
      this.profile.status === 3 ||
      this.profile.status === 5
    );
  }

  canSubmit(): boolean {
    return this.profile.status === 0;
  }

  canTeacherDecision(): boolean {
    return this.profile.status === 2;
  }

  saveProfile(): void {
    if (!this.profile.specialty) {
      alert('Please enter specialty');
      return;
    }

    if (!this.profile.description) {
      alert('Please enter description');
      return;
    }

    if (
      !this.profile.desiredPricePerHour ||
      this.profile.desiredPricePerHour <= 0
    ) {
      alert('Desired price per hour must be greater than 0');
      return;
    }

    this.loading = true;

    const request = this.hasProfile
      ? this.teacherService.updateProfile(this.profile)
      : this.teacherService.createProfile(this.profile);

    request.subscribe({
      next: () => {
        alert(
          this.hasProfile
            ? 'Teacher profile updated successfully'
            : 'Teacher profile created successfully',
        );

        this.hasProfile = true;
        this.loading = false;

        this.loadProfile();
      },
      error: (err) => {
        console.error(err);

        alert(err?.error?.message || 'Failed to save teacher profile');

        this.loading = false;
      },
    });
  }

  submitForReview(): void {
    if (!this.canSubmit()) {
      return;
    }

    if (!confirm('Are you sure you want to submit your profile for review?')) {
      return;
    }

    this.loading = true;

    this.teacherService.submitProfile().subscribe({
      next: () => {
        alert('Profile submitted successfully');

        this.loading = false;

        this.loadProfile();
      },
      error: (err) => {
        console.error(err);

        alert(err?.error?.message || 'Failed to submit profile');

        this.loading = false;
      },
    });
  }

  acceptProfile(): void {
    if (!confirm('Do you accept the teaching price proposed by admin?')) {
      return;
    }

    this.loading = true;

    this.teacherService.acceptProfile().subscribe({
      next: () => {
        alert('You are now an approved teacher');

        this.loading = false;

        this.loadProfile();
      },
      error: (err) => {
        console.error(err);

        alert(err?.error?.message || 'Failed to accept');

        this.loading = false;
      },
    });
  }

  rejectProfile(): void {
    if (!confirm('Do you want to reject the proposed teaching price?')) {
      return;
    }

    this.loading = true;

    this.teacherService.rejectApprovedProfile().subscribe({
      next: () => {
        alert('Teaching offer rejected');

        this.loading = false;

        this.loadProfile();
      },
      error: (err) => {
        console.error(err);

        alert(err?.error?.message || 'Failed to reject');

        this.loading = false;
      },
    });
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Draft';

      case 1:
        return 'Submitted';

      case 2:
        return 'Approved By Admin - Waiting Teacher Decision';

      case 3:
        return 'Rejected By Admin';

      case 4:
        return 'Approved Teacher';

      case 5:
        return 'Rejected By Teacher';

      case 6:
        return 'Banned';

      default:
        return 'Unknown';
    }
  }

  onTeacherFilesChange(event: any): void {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    Array.from(files).forEach((file: any) => {
      if (file.type.startsWith('video/')) {
        this.teacherService.uploadVideo(file).subscribe({
          next: (res: any) => {
            this.profile.introVideoUrl = res.videoUrl;

            this.videoPreviewUrl = URL.createObjectURL(file);
          },
          error: (err) => {
            console.error(err);

            alert('Upload video failed');
          },
        });

        return;
      }

      this.teacherService.uploadCertificate(file).subscribe({
        next: (res: any) => {
          this.profile.englishCertificateUrl = res.fileUrl;
        },
        error: (err) => {
          console.error(err);

          alert('Upload certificate failed');
        },
      });
    });
  }

  private getRoleFromToken(): string | null {
    const token = localStorage.getItem('token');

    if (!token) {
      return null;
    }

    try {
      const payload: any = jwtDecode(token);

      const role =
        payload.role ||
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

      return this.normalizeRole(role);
    } catch {
      return null;
    }
  }

  private normalizeRole(value: any): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const raw = value.toString().trim().toLowerCase();

    if (raw === 'admin' || raw === '2') {
      return 'Admin';
    }

    if (raw === 'moderator' || raw === '3') {
      return 'Moderator';
    }

    if (raw === 'teacher' || raw === '4') {
      return 'Teacher';
    }

    if (raw === 'user' || raw === '1') {
      return 'User';
    }

    return value.toString().trim();
  }
}
