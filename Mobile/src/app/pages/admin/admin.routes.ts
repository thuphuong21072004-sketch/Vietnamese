import { Routes } from '@angular/router';
import { roleGuard, staffGuard } from '../../core/guards';

/** Nhóm 9 (phần A) · Admin tools — tab con của /admin (shell có staffGuard: Admin + Moderator). */
export const ADMIN_TAB_ROUTES: Routes = [
  { path: 'finance', loadComponent: () => import('./finance.page').then((m) => m.AdminFinancePage) },
  { path: 'users', loadComponent: () => import('./users.page').then((m) => m.AdminUsersPage) },
  { path: 'teachers', canActivate: [roleGuard('admin')], loadComponent: () => import('./teacher-apps.page').then((m) => m.TeacherAppsPage) },
  { path: 'more', loadComponent: () => import('./more.page').then((m) => m.AdminMorePage) },
];

/** Màn toàn màn hình (ẩn tab bar) — phải khai báo TRƯỚC route 'admin' (tab shell) trong app.routes.ts. */
export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'admin/teachers/:id',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./teacher-detail.page').then((m) => m.TeacherDetailPage),
  },
  {
    path: 'admin/videos',
    canActivate: [staffGuard],
    loadComponent: () => import('./videos.page').then((m) => m.AdminVideosPage),
  },
  {
    path: 'admin/bank-transfers',
    canActivate: [staffGuard],
    loadComponent: () => import('./bank-transfers.page').then((m) => m.BankTransfersPage),
  },
  {
    path: 'admin/travel-bookings',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./travel-bookings.page').then((m) => m.TravelBookingsPage),
  },
];
