import { FormsModule } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { AccountService } from '../../../services/account.service';
import { BaseService } from '../../../services/base.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  agree: boolean = false;
  country: string = '';

  bio: string = '';

  avatarUrl: string = '';
  selectedFile: File | null = null;

  constructor(
    private api: AccountService,
    private router: Router,
    private baseService: BaseService,
  ) {}
  ngOnInit(): void {
    this.loadCountries();
  }

  register() {
    if (!this.name || !this.email || !this.password) {
      alert('All fields required');

      return;
    }

    if (this.password.length < 6) {
      alert('Password too short');

      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');

      return;
    }

    if (!this.agree) {
      alert('You must agree to terms');

      return;
    }

    const data = {
      name: this.name,

      email: this.email,

      password: this.password,

      country: this.country,

      bio: this.bio,

      avatarUrl: this.avatarUrl,
    };

    this.api.register(data).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);

        this.router.navigate(['/home']).then(() => {
          window.location.reload();
        });
      },

      error: (err) => {
        this.baseService.handleError(err, 'Register failed');
      },
    });
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    this.selectedFile = file;

    this.api.uploadAvatar(file).subscribe({
      next: (res: any) => {
        this.avatarUrl = res.avatarUrl;
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
