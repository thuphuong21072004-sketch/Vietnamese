import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../../core/guards';

/** Nhóm 5 · Lớp nhóm. */
export const STUDENT_TAB_ROUTES: Routes = [
  // /classes?seg=browse|mine (&payment=success|cancel khi Stripe quay về)
  { path: 'classes', loadComponent: () => import('./classes.page').then((m) => m.ClassesPage) },
];

export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'classes/:id',
    canActivate: [authGuard, roleGuard('student')],
    loadComponent: () => import('./class-detail.page').then((m) => m.ClassDetailPage),
  },
];
