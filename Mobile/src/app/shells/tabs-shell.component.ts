import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonTabBar, IonTabButton, IonTabs } from '@ionic/angular/standalone';
import { IconComponent, ICONS } from '../ui/icon.component';
import { AuthService } from '../core/auth.service';

export interface TabDef {
  tab: string; // segment con của route (vd 'home')
  label: string;
  icon: string; // path Lucide
}

/** Tab bar 5 mục theo vai trò (README §5). Danh sách tab lấy từ route data `tabs`. */
@Component({
  selector: 'vp-tabs-shell',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom" class="vp-tabbar" aria-label="Main">
        @for (t of tabs; track t.tab) {
          <ion-tab-button [tab]="t.tab">
            <span class="vp-tab">
              <span class="vp-tab__icon"><vp-icon [d]="t.icon" [size]="22" /></span>
              <span>{{ t.label }}</span>
            </span>
          </ion-tab-button>
        }
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsShellComponent {
  private data = inject(ActivatedRoute).snapshot.data;
  private auth = inject(AuthService);
  /** Moderator ở Admin tools dùng bộ tab riêng (không có Teacher Applications — API chỉ cho Admin). */
  tabs: TabDef[] =
    (this.auth.isStaff() && !this.auth.isAdmin() && this.data['moderatorTabs']) || this.data['tabs'] || [];
}

export const STUDENT_TABS: TabDef[] = [
  { tab: 'home', label: 'Home', icon: ICONS.home },
  { tab: 'learn', label: 'Learn', icon: ICONS.learn },
  { tab: 'tutoring', label: 'Tutoring', icon: ICONS.calendar },
  { tab: 'classes', label: 'Classes', icon: ICONS.users },
  { tab: 'me', label: 'Me', icon: ICONS.user },
];

export const TEACHER_TABS: TabDef[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: ICONS.chart },
  { tab: 'classes', label: 'Classes', icon: ICONS.users },
  { tab: 'schedule', label: 'Schedule', icon: ICONS.calendar },
  { tab: 'bookings', label: 'Bookings', icon: ICONS.clipboard },
  { tab: 'me', label: 'Me', icon: ICONS.user },
];

export const ADMIN_TABS: TabDef[] = [
  { tab: 'finance', label: 'Finance', icon: ICONS.dollar },
  { tab: 'users', label: 'Users', icon: ICONS.users },
  { tab: 'content', label: 'Content', icon: ICONS.layers },
  { tab: 'teachers', label: 'Teachers', icon: ICONS.shield },
  { tab: 'more', label: 'More', icon: ICONS.menu },
];

export const MODERATOR_ADMIN_TABS: TabDef[] = ADMIN_TABS.filter((t) => t.tab !== 'teachers');
