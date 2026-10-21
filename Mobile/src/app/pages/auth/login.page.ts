import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '@web/services/account.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';

/** 01 Login — design-mobile/screens/Main.dc.html */
@Component({
  standalone: true,
  imports: [IonContent, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrls: ['./auth.css'],
  host: { class: 'bg-auth' },
})
export class LoginPage {
  private account = inject(AccountService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  password = '';
  remember = true;
  submitted = false;
  loading = false;

  async login(): Promise<void> {
    this.submitted = true;
    if (!this.email || !this.password) {
      this.fb.toast('Email and password required', 'error');
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.account.login({ email: this.email, password: this.password }));
      // Backend trả về null khi sai email hoặc mật khẩu
      if (!res?.token) {
        this.fb.toast('Sai email hoặc mật khẩu', 'error');
        return;
      }
      await this.auth.setToken(res.token);
      this.router.navigateByUrl(this.auth.landingPath(), { replaceUrl: true });
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Login failed'), 'error');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  forgot(): void {
    this.fb.toast('Please contact the administrator to reset your password.');
  }
}
