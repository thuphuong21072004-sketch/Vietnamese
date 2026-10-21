import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '@web/services/account.service';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { errorMessage } from '../../core/errors';
import { DESKTOP_ICON, canSwitchToDesktop, switchToDesktopSite } from '../../core/site-switch';
import { mediaUrl } from '../../core/media';
import { AvatarComponent } from '../../ui/avatar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';

interface MenuItem {
  label: string;
  d: string;
  link?: string;
  action?: () => void;
  danger?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const I = {
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  award: 'M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89 7 23l5-3 5 3-1.21-9.12',
};

/** 23 Profile (tab "Me") — design-mobile/screens/Profile.dc.html (học viên & giáo viên dùng chung). */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, IonRefresher, IonRefresherContent, RouterLink, AvatarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.css'],
})
export class ProfilePage {
  private account = inject(AccountService);
  private router = inject(Router);
  private fb = inject(FeedbackService);
  readonly auth = inject(AuthService);
  readonly icons = ICONS;

  /** Dữ liệu /account/me (country, roleName…) — bổ sung cho AuthService.user(). */
  readonly me = signal<any>(null);
  readonly uploading = signal(false);

  readonly group = computed(() => this.auth.roleGroup() ?? this.auth.currentGroup());
  readonly isStudent = computed(() => this.group() === 'student');

  readonly name = computed(() => this.auth.user()?.name || this.me()?.name || '');
  readonly email = computed(() => this.auth.user()?.email || this.me()?.email || '');
  readonly country = computed(() => this.me()?.country || this.auth.user()?.country || '');
  readonly avatar = computed(
    () => this.auth.user()?.avatarUrl || (this.me()?.avatarUrl ? mediaUrl(this.me().avatarUrl, 'uploads') : ''),
  );
  readonly roleLabel = computed(() => {
    const role = this.auth.user()?.role ?? this.me()?.roleName;
    if (role === 'Admin') return 'Admin';
    if (role === 'Moderator' || role === 'Teacher') return 'Teacher';
    return 'Student';
  });

  readonly groups = computed<MenuGroup[]>(() => {
    const account: MenuGroup = {
      title: 'Account',
      items: [
        { label: 'Update Information', d: I.edit, link: '/me/edit' },
        { label: 'Change Password', d: I.lock, link: '/me/password' },
        // Bản web ở /m: chuyển sang giao diện máy tính (web cũ)
        ...(canSwitchToDesktop() ? [{ label: 'Desktop version', d: DESKTOP_ICON, action: () => switchToDesktopSite() }] : []),
        { label: 'Log out', d: ICONS.logout, action: () => this.logout(), danger: true },
      ],
    };
    if (this.isStudent()) {
      return [
        {
          title: 'Learning',
          items: [
            { label: 'Dashboard', d: ICONS.chart, link: '/me/dashboard' },
            { label: 'Practice Speaking', d: ICONS.mic, link: '/learn/speaking' },
            { label: 'Vocabulary Search', d: ICONS.search, link: '/learn/vocab' },
          ],
        },
        {
          title: 'Travel',
          items: [
            { label: 'Travel Plans', d: ICONS.pin, link: '/travel/trips' },
            { label: 'Invites & Requests', d: I.mail, link: '/travel/requests' },
          ],
        },
        account,
      ];
    }
    const list: MenuGroup[] = [
      {
        title: 'Teaching',
        items: [
          { label: 'Teacher Profile', d: I.award, link: '/me/become-teacher' },
          { label: 'Upcoming Teaching Schedule', d: ICONS.calendar, link: '/teacher/upcoming' },
        ],
      },
      { title: 'Travel', items: [{ label: 'Travel', d: ICONS.pin, link: '/teacher/travel' }] },
    ];
    // Admin / Moderator đang ở Teacher panel → cho chuyển sang Admin tools
    if (this.auth.isStaff() && this.auth.adminTeacherMode()) {
      list.push({
        title: 'Admin',
        items: [{ label: 'Switch to Admin tools', d: ICONS.shield, action: () => this.switchToAdmin() }],
      });
    }
    list.push(account);
    return list;
  });

  ionViewWillEnter(): void {
    this.load();
  }

  async load(event?: CustomEvent): Promise<void> {
    try {
      this.me.set(await firstValueFrom(this.account.getCurrentUser()));
    } catch {
      // giữ thông tin từ AuthService
    }
    (event?.target as HTMLIonRefresherElement | undefined)?.complete();
  }

  /** Bấm avatar → chọn ảnh → upload → lưu ngay vào hồ sơ. */
  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true);
    try {
      const res: any = await firstValueFrom(this.account.uploadAvatar(file));
      await firstValueFrom(this.account.updateProfile({ avatarUrl: res.avatarUrl }));
      await this.auth.refresh();
      await this.load();
      this.fb.toast('Avatar updated', 'success');
    } catch (err) {
      this.fb.toast(errorMessage(err, 'Upload failed'), 'error');
    } finally {
      this.uploading.set(false);
    }
  }

  async logout(): Promise<void> {
    const ok = await this.fb.confirm({ header: 'Log out', message: 'Are you sure you want to log out?', okText: 'Log out', danger: true });
    if (ok) this.auth.logout();
  }

  switchToAdmin(): void {
    this.auth.adminTeacherMode.set(false);
    this.router.navigateByUrl('/admin/finance', { replaceUrl: true });
  }
}
