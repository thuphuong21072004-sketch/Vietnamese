import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { BaseService } from '../../services/base.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(
    private api: AccountService,
    private router: Router,
    private baseService: BaseService,
  ) {}

  login() {
    if (!this.email || !this.password) {
      alert('Email and password required');

      return;
    }

    const data = {
      email: this.email,

      password: this.password,
    };

    this.api.login(data).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);

        this.router.navigate(['/home']).then(() => {
          window.location.reload();
        });
      },

      error: (err) => {
        this.baseService.handleError(err, 'Login failed');
      },
    });
  }
}
