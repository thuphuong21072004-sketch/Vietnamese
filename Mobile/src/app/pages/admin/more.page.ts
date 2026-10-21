import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { AuthService } from '../../core/auth.service';
import { FeedbackService } from '../../core/feedback.service';
import { DESKTOP_ICON, canSwitchToDesktop, switchToDesktopSite } from '../../core/site-switch';
import { AvatarComponent } from '../../ui/avatar.component';
import { IconComponent, ICONS } from '../../ui/icon.component';

interface MenuItem {
  label: string;
  icon: string;
  link?: string;
  action?: 'teacher' | 'logout' | 'desktop';
  danger?: boolean;
}

/** Admin "More" (chưa có design — dựng theo README §5 + kiểu menu của Profile.dc.html) */
@Component({
  standalone: true,
  imports: [IonHeader, IonContent, AvatarComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './more.page.html',
  styleUrls: ['./admin.css', './more.page.css'],
  host: { class: 'bg-admin' },
})
export class AdminMorePage {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FeedbackService);

  readonly chevron = ICONS.chevronRight;

  /** Moderator không thấy Travel Bookings (API admin/bookings chỉ cho Admin). */
  get groups(): { title: string; items: MenuItem[] }[] {
    const admin = this.auth.isAdmin();
    return this.allGroups.map((g) => ({
      ...g,
      items: g.items.filter((i) => admin || i.link !== '/admin/travel-bookings'),
    }));
  }

  private readonly allGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Admin tools',
      items: [
        { label: 'Video Management', icon: 'M23 7l-7 5 7 5V7zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', link: '/admin/videos' },
        { label: 'Placement Tests', icon: ICONS.checkSquare, link: '/admin/placements' },
        { label: 'Bank Transfers', icon: 'M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3', link: '/admin/bank-transfers' },
        { label: 'Travel Bookings', icon: ICONS.pin, link: '/admin/travel-bookings' },
      ],
    },
    {
      title: 'Teacher panel',
      items: [
        {
          label: 'Switch to Teacher panel',
          icon: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
          action: 'teacher',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Update Information', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', link: '/me/edit' },
        { label: 'Change Password', icon: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4', link: '/me/password' },
        ...(canSwitchToDesktop() ? [{ label: 'Desktop version', icon: DESKTOP_ICON, action: 'desktop' as const }] : []),
        { label: 'Log out', icon: ICONS.logout, action: 'logout', danger: true },
      ],
    },
  ];

  get subtitle(): string {
    const u = this.auth.user();
    return [u?.email, u?.country].filter(Boolean).join(' · ');
  }

  async open(item: MenuItem): Promise<void> {
    if (item.link) {
      this.router.navigateByUrl(item.link);
      return;
    }
    if (item.action === 'desktop') {
      switchToDesktopSite();
      return;
    }
    if (item.action === 'teacher') {
      this.auth.adminTeacherMode.set(true);
      this.router.navigateByUrl('/teacher/dashboard', { replaceUrl: true });
      return;
    }
    if (item.action === 'logout') {
      const ok = await this.fb.confirm({
        header: 'Log out',
        message: 'Are you sure you want to log out?',
        okText: 'Log out',
        danger: true,
      });
      if (ok) this.auth.logout();
    }
  }
}
