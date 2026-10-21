import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard, staffGuard } from './core/guards';
import { AuthService } from './core/auth.service';
import { ADMIN_TABS, MODERATOR_ADMIN_TABS, STUDENT_TABS, TEACHER_TABS, TabsShellComponent } from './shells/tabs-shell.component';
import * as LEARN from './pages/learn/learn.routes';
import * as ACCOUNT from './pages/account/account.routes';
import * as CLASSES from './pages/classes/classes.routes';
import * as ADMIN from './pages/admin/admin.routes';
import * as TUTORING from './pages/tutoring/tutoring.routes';
import * as PRACTICE from './pages/practice/practice.routes';
import * as TRAVEL from './pages/travel/travel.routes';
import * as CONTENT from './pages/content/content.routes';
import * as TEACHER from './pages/teacher/teacher.routes';
import * as GUEST from './pages/guest/guest.routes';
import { LEGACY_WEB_ROUTES } from './legacy.routes';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: () => inject(AuthService).landingPath(),
  },

  // 1 · Đăng nhập & bắt đầu
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login.page').then((m) => m.LoginPage) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register.page').then((m) => m.RegisterPage) },

  // Stripe quay về theo đường dẫn của web (StripeService.cs) → chuyển sang tab tương ứng, giữ ?payment=
  {
    path: 'my-bookings',
    redirectTo: ({ queryParams }) => {
      const router = inject(Router);
      return router.createUrlTree(['/tutoring'], { queryParams: { ...queryParams, seg: 'bookings' } });
    },
  },
  {
    path: 'user/myclass',
    redirectTo: ({ queryParams }) => {
      const router = inject(Router);
      return router.createUrlTree(['/classes'], { queryParams: { ...queryParams, seg: 'mine' } });
    },
  },

  // Đường dẫn của web cũ → màn mobile (phải đứng trước user/:id và các tab shell)
  ...LEGACY_WEB_ROUTES,

  // Khách (chưa đăng nhập)
  ...GUEST.FULLSCREEN_ROUTES,

  // Màn toàn màn hình (ẩn tab bar)
  ...LEARN.FULLSCREEN_ROUTES,
  ...PRACTICE.FULLSCREEN_ROUTES,
  ...TRAVEL.FULLSCREEN_ROUTES,
  ...CONTENT.FULLSCREEN_ROUTES,
  ...TEACHER.FULLSCREEN_ROUTES,
  ...ACCOUNT.FULLSCREEN_ROUTES,
  ...CLASSES.FULLSCREEN_ROUTES,
  ...ADMIN.FULLSCREEN_ROUTES,
  ...TUTORING.FULLSCREEN_ROUTES,

  // Giáo viên (Moderator / Teacher; Admin khi chuyển sang Teacher panel)
  {
    path: 'teacher',
    component: TabsShellComponent,
    canActivate: [roleGuard('teacher')],
    data: { tabs: TEACHER_TABS },
    children: [
      ...TEACHER.TEACHER_TAB_ROUTES,
      ...ACCOUNT.TEACHER_TAB_ROUTES,
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ],
  },

  // Admin
  {
    path: 'admin',
    component: TabsShellComponent,
    canActivate: [staffGuard],
    data: { tabs: ADMIN_TABS, moderatorTabs: MODERATOR_ADMIN_TABS },
    children: [
      ...CONTENT.ADMIN_TAB_ROUTES,
      ...ADMIN.ADMIN_TAB_ROUTES,
      { path: '', pathMatch: 'full', redirectTo: 'finance' },
    ],
  },

  // Học viên — tab shell ở gốc: /home, /learn, /tutoring, /classes, /me
  {
    path: '',
    component: TabsShellComponent,
    canActivate: [authGuard, roleGuard('student')],
    data: { tabs: STUDENT_TABS },
    children: [
      { path: 'home', loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage) },
      ...PRACTICE.STUDENT_TAB_ROUTES,
      ...LEARN.STUDENT_TAB_ROUTES,
      ...TUTORING.STUDENT_TAB_ROUTES,
      ...CLASSES.STUDENT_TAB_ROUTES,
      ...ACCOUNT.STUDENT_TAB_ROUTES,
    ],
  },

  { path: '**', redirectTo: '' },
];
