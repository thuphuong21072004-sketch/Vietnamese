import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '@web/services/account.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { mediaUrl } from '../../core/media';
import { injectCountries } from '../../core/countries';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';

/** 02 Register — design-mobile/screens/Register.dc.html (bấm vòng tròn avatar để chọn ảnh). */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, FormsModule, RouterLink, NavBarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register.page.html',
  styleUrls: ['./auth.css'],
  host: { class: 'bg-auth' },
})
export class RegisterPage implements OnInit {
  private account = inject(AccountService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FeedbackService);
  private cdr = inject(ChangeDetectorRef);

  readonly icons = ICONS;
  name = '';
  email = '';
  country = '';
  bio = '';
  password = '';
  confirmPassword = '';
  agree = false;
  avatarUrl = '';
  avatarPreview = '';
  uploading = false;
  loading = false;
  submitted = false;
  countries: string[] = [];

  private loadCountries = injectCountries();

  ngOnInit(): void {
    this.loadCountries().subscribe((list) => {
      this.countries = list;
      this.cdr.markForCheck();
    });
  }

  get passwordMismatch(): boolean {
    return !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  get passwordTooShort(): boolean {
    return this.submitted && !!this.password && this.password.length < 6;
  }

  async onFileSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.avatarPreview = URL.createObjectURL(file);
    this.uploading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.account.uploadAvatar(file));
      this.avatarUrl = res.avatarUrl;
      this.avatarPreview = mediaUrl(res.avatarUrl, 'uploads') || this.avatarPreview;
    } catch {
      this.avatarPreview = '';
      this.fb.toast('Upload failed', 'error');
    } finally {
      this.uploading = false;
      this.cdr.markForCheck();
    }
  }

  async register(): Promise<void> {
    this.submitted = true;
    if (!this.name || !this.email || !this.password) {
      this.fb.toast('All fields required', 'error');
      return;
    }
    if (this.password.length < 6) {
      this.fb.toast('Password too short', 'error');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.fb.toast('Passwords do not match', 'error');
      return;
    }
    if (!this.agree) {
      this.fb.toast('You must agree to terms', 'error');
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(
        this.account.register({
          name: this.name,
          email: this.email,
          password: this.password,
          country: this.country,
          bio: this.bio,
          avatarUrl: this.avatarUrl,
        }),
      );
      await this.auth.setToken(res.token);
      this.router.navigateByUrl(this.auth.landingPath(), { replaceUrl: true });
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Register failed'), 'error');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
