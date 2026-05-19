import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

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
     * 1 = Pending
     * 2 = Approved
     * 3 = Rejected
     */
    status: 0,
  };

  loading = false;

  hasProfile = false;

  constructor(private teacherService: TeacherProfileService) {}

  ngOnInit(): void {
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
   * chỉ Draft / Rejected
   * mới được sửa
   */
  canEdit(): boolean {
    return this.profile.status === 0 || this.profile.status === 3;
  }

  /*
   * Draft / Rejected
   * mới được submit
   */
  canSubmit(): boolean {
    return (
      this.hasProfile &&
      (this.profile.status === 0 || this.profile.status === 3)
    );
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

  submitProfile() {
    if (!confirm('Submit teacher profile for review?')) {
      return;
    }

    this.loading = true;

    this.teacherService.submitProfile(this.profile.teacherProfileId).subscribe({
      next: () => {
        this.profile.status = 1;

        alert('Teacher profile submitted successfully');

        this.loading = false;
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
         * cv file
         */
          this.profile.cvUrl = reader.result;
        }
      };

      reader.readAsDataURL(file);
    });
  }
}
