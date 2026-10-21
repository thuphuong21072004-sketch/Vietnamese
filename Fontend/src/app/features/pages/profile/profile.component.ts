import { FormsModule } from '@angular/forms';

import { AccountService } from '../../services/account.service';

import { BaseService } from '../../services/base.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-profile',

  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profile.component.html',

  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  name: string = '';
  email: string = '';
  roleName: string = '';
  status: number = 0;
  country: string = '';
  bio: string = '';
  avatarUrl: string = '';
  dateOfBirth: string = '';
  gender: string = '';

  newName: string = '';
  newEmail: string = '';
  newCountry: string = '';
  newBio: string = '';
  newAvatarUrl: string = '';
  newDateOfBirth: string = '';
  newGender: string = '';

  oldPassword: string = '';

  newPassword: string = '';
  selectedFile: File | null = null;
  constructor(
    private api: AccountService,

    private baseService: BaseService,
  ) {}

  ngOnInit() {
    this.loadProfile();
    this.loadCountries();
  }

  loadProfile() {
    this.api.getCurrentUser().subscribe((res: any) => {
      this.name = res.name;

      this.email = res.email;

      this.roleName = res.roleName;

      this.status = res.status;

      this.country = res.country || '';
      this.bio = res.bio || '';
      this.avatarUrl = res.avatarUrl ? `${environment.serverUrl}/uploads/${res.avatarUrl}` : '';
      this.dateOfBirth = res.dateOfBirth || '';
      this.gender = res.gender || '';

      this.newName = this.name;
      this.newEmail = this.email;
      this.newCountry = this.country;
      this.newBio = this.bio;
      this.newAvatarUrl = this.avatarUrl;
      this.newDateOfBirth = this.dateOfBirth;
      this.newGender = this.gender;
    });
  }

  updateProfile() {
    const data = {
      name: this.newName,
      country: this.newCountry,
      bio: this.newBio,
      avatarUrl: this.newAvatarUrl,
      dateOfBirth: this.newDateOfBirth || null,
      gender: this.newGender || null,
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

        this.avatarUrl = `${environment.serverUrl}/uploads/${res.avatarUrl}`;
      },

      error: () => {
        alert('Upload failed');
      },
    });
  }

  countries: string[] = [];
  loadCountries(): void {
    this.api.getCountries().subscribe((res) => {
      this.countries = res.map((x) => x.name.common).sort();

      const vietnamIndex = this.countries.indexOf('Vietnam');

      if (vietnamIndex >= 0) {
        this.countries.splice(vietnamIndex, 1);

        this.countries.unshift('Vietnam');
      }
    });
  }
}
