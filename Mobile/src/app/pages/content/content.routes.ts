import { Routes } from '@angular/router';
import { staffGuard } from '../../core/guards';

/** Nhóm 9B · Quản lý nội dung (Admin + Moderator). */

// Con của /admin (tab Content)
export const ADMIN_TAB_ROUTES: Routes = [
  { path: 'content', loadComponent: () => import('./content.page').then((m) => m.ContentPage) },
];

// Toàn màn hình (ẩn tab bar)
export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'admin/units/new',
    canActivate: [staffGuard],
    loadComponent: () => import('./unit-editor.page').then((m) => m.UnitEditorPage),
  },
  {
    path: 'admin/units/:id',
    canActivate: [staffGuard],
    loadComponent: () => import('./unit-editor.page').then((m) => m.UnitEditorPage),
  },
  {
    path: 'admin/quiz',
    canActivate: [staffGuard],
    loadComponent: () => import('./quiz-editor.page').then((m) => m.QuizEditorPage),
  },
  {
    path: 'admin/placements',
    canActivate: [staffGuard],
    loadComponent: () => import('./placements.page').then((m) => m.PlacementsPage),
  },
];
