import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards';

/** Chế độ khách (chưa đăng nhập): trang giới thiệu + tra từ. */
export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'welcome',
    canActivate: [guestGuard],
    loadComponent: () => import('./welcome.page').then((m) => m.WelcomePage),
  },
  {
    // Ai cũng vào được (khách hoặc đã đăng nhập) — cùng component với /learn/vocab
    path: 'search',
    loadComponent: () => import('../practice/vocab-search.page').then((m) => m.VocabSearchPage),
  },
];
