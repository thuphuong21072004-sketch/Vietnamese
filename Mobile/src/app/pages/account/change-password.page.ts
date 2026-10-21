import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFooter, IonHeader, NavController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '@web/services/account.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { injectSafeBack } from '../../core/navigation';
import { NavBarComponent } from '../../ui/nav-bar.component';

/** Change Password (chưa có design — dựng theo ui-spec §3 "Profile", logic pages/profile/profile.component.ts). */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonFooter, FormsModule, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password.page.html',
  styleUrls: ['./account-form.css'],
})
export class ChangePasswordPage {
  private account = inject(AccountService);
  private auth = inject(AuthService);
  private fb = inject(FeedbackService);
  private nav = inject(NavController);
  private safeBack = injectSafeBack();
  private cdr = inject(ChangeDetectorRef);

  readonly meHref = this.auth.currentGroup() === 'student' ? '/me' : '/teacher/me';

  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  submitted = false;
  saving = false;

  get tooShort(): boolean {
    return !!this.newPassword && this.newPassword.length < 6;
  }

  get mismatch(): boolean {
    return !!this.confirmPassword && this.newPassword !== this.confirmPassword;
  }

  async save(): Promise<void> {
    this.submitted = true;
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.fb.toast('All fields required', 'error');
      return;
    }
    if (this.newPassword.length < 6) {
      this.fb.toast('Password must be at least 6 characters', 'error');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.fb.toast('Passwords do not match', 'error');
      return;
    }
    this.saving = true;
    this.cdr.markForCheck();
    try {
      await firstValueFrom(this.account.changePassword({ oldPassword: this.oldPassword, newPassword: this.newPassword }));
      this.fb.toast('Password changed', 'success');
      this.oldPassword = this.newPassword = this.confirmPassword = '';
      this.safeBack(this.meHref);
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Change password failed'), 'error');
    } finally {
      this.saving = false;
      this.cdr.markForCheck();
    }
  }
}
