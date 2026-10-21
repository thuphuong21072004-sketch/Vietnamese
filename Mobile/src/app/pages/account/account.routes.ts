import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards';

const profile = () => import('./profile.page').then((m) => m.ProfilePage);

/** 7 · Tài khoản */
export const STUDENT_TAB_ROUTES: Routes = [{ path: 'me', loadComponent: profile }];

export const TEACHER_TAB_ROUTES: Routes = [{ path: 'me', loadComponent: profile }];

export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'me/become-teacher',
    canActivate: [authGuard],
    loadComponent: () => import('./become-teacher.page').then((m) => m.BecomeTeacherPage),
  },
  {
    path: 'me/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./edit-profile.page').then((m) => m.EditProfilePage),
  },
  {
    path: 'me/password',
    canActivate: [authGuard],
    loadComponent: () => import('./change-password.page').then((m) => m.ChangePasswordPage),
  },
  {
    path: 'user/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./public-profile.page').then((m) => m.PublicProfilePage),
  },
];
