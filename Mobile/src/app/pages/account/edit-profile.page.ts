import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '@web/services/account.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { injectSafeBack } from '../../core/navigation';
import { mediaUrl } from '../../core/media';
import { injectCountries } from '../../core/countries';
import { NavBarComponent } from '../../ui/nav-bar.component';
import { AvatarComponent } from '../../ui/avatar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';
import { LoadingComponent } from '../../ui/states.component';

/** Update Information (chưa có design — dựng theo ui-spec §3 "Profile", logic pages/profile/profile.component.ts). */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, FormsModule, NavBarComponent, AvatarComponent, IconComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./account-form.css'],
})
export class EditProfilePage implements OnInit {
  private account = inject(AccountService);
  private auth = inject(AuthService);
  private fb = inject(FeedbackService);
  private nav = inject(NavController);
  private safeBack = injectSafeBack();
  private cdr = inject(ChangeDetectorRef);
  readonly icons = ICONS;
  readonly genders = ['Male', 'Female', 'Other'];

  loading = true;
  saving = false;
  uploading = false;
  submitted = false;

  email = '';
  name = '';
  country = '';
  dateOfBirth = '';
  gender = '';
  bio = '';
  /** Tên file avatar (gửi API) và URL hiển thị. */
  avatarFile = '';
  avatarPreview = '';
  countries: string[] = [];

  /** Tab "Me" theo vai trò (học viên /me, giáo viên /teacher/me). */
  readonly meHref = this.auth.currentGroup() === 'student' ? '/me' : '/teacher/me';

  ngOnInit(): void {
    this.loadCountries();
    this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    try {
      const res: any = await firstValueFrom(this.account.getCurrentUser());
      this.email = res.email ?? '';
      this.name = res.name ?? '';
      this.country = res.country ?? '';
      this.bio = res.bio ?? '';
      this.dateOfBirth = (res.dateOfBirth ?? '').slice(0, 10);
      this.gender = res.gender ?? '';
      this.avatarFile = res.avatarUrl ?? '';
      this.avatarPreview = mediaUrl(res.avatarUrl, 'uploads');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Failed to load profile'), 'error');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private countries$ = injectCountries();

  private loadCountries(): void {
    this.countries$().subscribe((list) => {
      this.countries = list;
      this.cdr.markForCheck();
    });
  }

  /** Giữ quốc gia hiện tại trong danh sách dù API quốc gia lỗi. */
  get countryOptions(): string[] {
    return this.country && !this.countries.includes(this.country) ? [this.country, ...this.countries] : this.countries;
  }

  /** Bấm avatar → chọn ảnh → upload ngay (lưu khi bấm Update Profile). */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const previous = this.avatarPreview;
    this.avatarPreview = URL.createObjectURL(file);
    this.uploading = true;
    this.cdr.markForCheck();
    try {
      const res: any = await firstValueFrom(this.account.uploadAvatar(file));
      this.avatarFile = res.avatarUrl;
      this.avatarPreview = mediaUrl(res.avatarUrl, 'uploads') || this.avatarPreview;
    } catch {
      this.avatarPreview = previous;
      this.fb.toast('Upload failed', 'error');
    } finally {
      this.uploading = false;
      this.cdr.markForCheck();
    }
  }

  async save(): Promise<void> {
    this.submitted = true;
    if (!this.name.trim()) {
      this.fb.toast('Please enter your name', 'error');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(
        this.account.updateProfile({
          name: this.name.trim(),
          country: this.country,
          bio: this.bio,
          avatarUrl: this.avatarFile,
          dateOfBirth: this.dateOfBirth || null,
          gender: this.gender || null,
        }),
      );
      this.fb.toast('Profile updated', 'success');
      await this.auth.refresh();
      this.safeBack(this.meHref);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Update failed'), 'error');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }
}
