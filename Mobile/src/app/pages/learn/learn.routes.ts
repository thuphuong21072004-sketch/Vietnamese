import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../../core/guards';

/** Nhóm 2 · Tự học */
export const STUDENT_TAB_ROUTES: Routes = [
  { path: 'learn', loadComponent: () => import('./learning-path.page').then((m) => m.LearningPathPage) },
  { path: 'learn/tests', loadComponent: () => import('./practice-tests.page').then((m) => m.PracticeTestsPage) },
];

export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'lesson/:unitId',
    canActivate: [authGuard, roleGuard('student')],
    loadComponent: () => import('./lesson.page').then((m) => m.LessonPage),
  },
  {
    path: 'quiz',
    canActivate: [authGuard, roleGuard('student')],
    loadComponent: () => import('./quiz.page').then((m) => m.QuizPage),
  },
];
