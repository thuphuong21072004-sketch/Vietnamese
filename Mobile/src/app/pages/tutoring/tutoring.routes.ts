import { Routes } from '@angular/router';
import { authGuard, roleGuard } from '../../core/guards';

/** Nhóm 4 · Gia sư 1-1. */

// Con của tab shell học viên
export const STUDENT_TAB_ROUTES: Routes = [
  {
    path: 'tutoring',
    loadComponent: () => import('./tutoring.page').then((m) => m.TutoringPage),
  },
];

// Toàn màn hình (ẩn tab bar) — đặt TRƯỚC route tab shell học viên trong app.routes.ts
const guard = [authGuard, roleGuard('student')];

export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'tutoring/slot/:id',
    canActivate: guard,
    loadComponent: () => import('./tutor-detail.page').then((m) => m.TutorDetailPage),
  },
  {
    path: 'payment/:id',
    canActivate: guard,
    loadComponent: () => import('./payment.page').then((m) => m.PaymentPage),
  },
  {
    path: 'booking/:id',
    canActivate: guard,
    loadComponent: () => import('./booking-detail.page').then((m) => m.BookingDetailPage),
  },
  {
    path: 'review/:id',
    canActivate: guard,
    loadComponent: () => import('./review.page').then((m) => m.ReviewPage),
  },
  {
    path: 'room/:id',
    canActivate: guard,
    loadComponent: () => import('./video-room.page').then((m) => m.VideoRoomPage),
  },
];
