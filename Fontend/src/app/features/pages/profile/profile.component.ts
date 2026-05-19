import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { AccountService } from '../../services/account.service';

import { BaseService } from '../../services/base.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-profile',

  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profile.component.html',

  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  name: string = '';

  email: string = '';

  roleName: string = '';

  status: number = 0;

  country: string = '';

  bio: string = '';

  avatarUrl: string = '';

  newName: string = '';

  newEmail: string = '';

  newCountry: string = '';

  newBio: string = '';

  newAvatarUrl: string = '';

  oldPassword: string = '';

  newPassword: string = '';
  selectedFile: File | null = null;
  constructor(
    private api: AccountService,

    private baseService: BaseService,
  ) {}

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.api.getCurrentUser().subscribe((res: any) => {
      this.name = res.name;

      this.email = res.email;

      this.roleName = res.roleName;

      this.status = res.status;

      this.country = res.country || '';

      this.bio = res.bio || '';

      this.avatarUrl = res.avatarUrl
        ? `http://localhost:5108/uploads/${res.avatarUrl}`
        : '';

      this.newName = this.name;

      this.newEmail = this.email;

      this.newCountry = this.country;

      this.newBio = this.bio;

      this.newAvatarUrl = this.avatarUrl;
    });
  }

  updateProfile() {
    const data = {
      name: this.newName,

      country: this.newCountry,

      bio: this.newBio,

      avatarUrl: this.newAvatarUrl,
    };

    this.api.updateProfile(data).subscribe({
      next: () => {
        alert('Profile updated');

        this.loadProfile();
      },

      error: (err) => this.baseService.handleError(err, 'Update failed'),
    });
  }

  changePassword() {
    if (this.newPassword.length < 6) {
      alert('Password must be at least 6 characters');

      return;
    }

    const data = {
      oldPassword: this.oldPassword,

      newPassword: this.newPassword,
    };

    this.api.changePassword(data).subscribe({
      next: () => {
        alert('Password changed');

        this.oldPassword = '';

        this.newPassword = '';
      },

      error: (err) =>
        this.baseService.handleError(err, 'Change password failed'),
    });
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    this.api.uploadAvatar(file).subscribe({
      next: (res: any) => {
        this.newAvatarUrl = res.avatarUrl;

        this.avatarUrl = `http://localhost:5108/uploads/${res.avatarUrl}`;
      },

      error: () => {
        alert('Upload failed');
      },
    });
  }
}
