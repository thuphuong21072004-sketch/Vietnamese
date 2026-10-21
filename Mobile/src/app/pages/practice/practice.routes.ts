import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';

/** Nhóm 3 · Luyện tập & thống kê. */

// Speaking / Vocabulary: design có tab bar (tab Learn đang chọn) → con của tab shell học viên
export const STUDENT_TAB_ROUTES: Routes = [
  { path: 'learn/speaking', loadComponent: () => import('./speaking.page').then((m) => m.SpeakingPage) },
  { path: 'learn/vocab', loadComponent: () => import('./vocab-search.page').then((m) => m.VocabSearchPage) },
];

// Student Dashboard: toàn màn, ẩn tab bar
export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'me/dashboard',
    canActivate: [roleGuard('student')],
    loadComponent: () => import('./student-dashboard.page').then((m) => m.StudentDashboardPage),
  },
];
