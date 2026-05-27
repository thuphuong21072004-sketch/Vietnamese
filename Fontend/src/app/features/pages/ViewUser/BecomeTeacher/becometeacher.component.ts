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

    introVideoUrl: '',

    cvUrl: '',

    avatarUrl: '',

    specialty: '',

    experienceYears: 0,

    pricePerHour: 0,

    ratingAverage: 0,

    totalReviews: 0,

    description: '',

    /*
     * 0 = Draft
     * 1 = Submitted
     * 2 = Approved
     * 3 = Rejected
     */
    status: 0,
  };

  loading = false;

  hasProfile = false;

  userRole: string | null = null;

  isPrivilegedTeacherUser = false;

  constructor(private teacherService: TeacherProfileService) {}

  ngOnInit(): void {
    this.userRole = this.getRoleFromToken();

    this.isPrivilegedTeacherUser =
      this.userRole === 'Admin' || this.userRole === 'Moderator';

    this.loadProfile();
  }

  loadProfile() {
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

  /*
   * approved không cho edit
   */
  canEdit(): boolean {
    return this.profile.status !== 2;
  }

  saveProfile() {
    if (!this.profile.specialty) {
      alert('Please enter specialty');

      return;
    }

    if (!this.profile.description) {
      alert('Please enter description');

      return;
    }

    if (this.profile.pricePerHour <= 0) {
      alert('Price per hour must be greater than 0');

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

        alert('Failed to save teacher profile');

        this.loading = false;
      },
    });
  }

  /*
   * submit hồ sơ
   * cho admin duyệt
   */
  submitForReview() {
    this.loading = true;

    this.teacherService.submitProfile().subscribe({
      next: () => {
        alert('Submitted to admin successfully');

        this.loading = false;

        this.loadProfile();
      },

      error: (err) => {
        console.error(err);

        alert('Failed to submit profile');

        this.loading = false;
      },
    });
  }

  getStatusText(status: number): string {
    switch (status) {
      case 0:
        return 'Draft';

      case 1:
        return 'Pending Review';

      case 2:
        return 'Approved';

      case 3:
        return 'Rejected';

      default:
        return 'Unknown';
    }
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

  onTeacherFilesChange(event: any) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    Array.from(files).forEach((file: any) => {
      const reader = new FileReader();

      reader.onload = () => {
        /*
         * avatar
         */
        if (file.type.startsWith('image/')) {
          this.profile.avatarUrl = reader.result;
        } else if (file.type.startsWith('video/')) {

        /*
         * intro video
         */
          this.profile.introVideoUrl = reader.result;
        } else {

        /*
         * cv
         */
          this.profile.cvUrl = reader.result;
        }
      };

      reader.readAsDataURL(file);
    });
  }
}
