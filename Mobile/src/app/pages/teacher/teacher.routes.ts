import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';

/** Nhóm 8 · Giáo viên — tab dưới /teacher (Dashboard, Classes, Schedule, Bookings). Tab 'me' do nhóm Profile làm. */
export const TEACHER_TAB_ROUTES: Routes = [
  { path: 'dashboard', loadComponent: () => import('./dashboard/teacher-dashboard.page').then((m) => m.TeacherDashboardPage) },
  { path: 'classes', loadComponent: () => import('./classes/teacher-classes.page').then((m) => m.TeacherClassesPage) },
  { path: 'schedule', loadComponent: () => import('./availability/availability.page').then((m) => m.AvailabilityPage) },
  { path: 'bookings', loadComponent: () => import('./bookings/teacher-bookings.page').then((m) => m.TeacherBookingsPage) },
];

/** Màn toàn màn hình của giáo viên (ẩn tab bar). Phải đăng ký TRƯỚC route 'teacher' (tab shell) trong app.routes. */
export const FULLSCREEN_ROUTES: Routes = [
  {
    path: 'teacher/classes/new',
    canActivate: [roleGuard('teacher')],
    loadComponent: () => import('./class-create/create-class.page').then((m) => m.CreateClassPage),
  },
  {
    path: 'teacher/classes/:id',
    canActivate: [roleGuard('teacher')],
    loadComponent: () => import('./class-detail/teacher-class-detail.page').then((m) => m.TeacherClassDetailPage),
  },
  {
    path: 'teacher/bookings/:id',
    canActivate: [roleGuard('teacher')],
    loadComponent: () => import('./booking-detail/teacher-booking-detail.page').then((m) => m.TeacherBookingDetailPage),
  },
  {
    path: 'teacher/upcoming',
    canActivate: [roleGuard('teacher')],
    loadComponent: () => import('./upcoming/teacher-upcoming.page').then((m) => m.TeacherUpcomingPage),
  },
  {
    path: 'teacher/travel',
    pathMatch: 'full',
    canActivate: [roleGuard('teacher')],
    loadComponent: () => import('./travel/travel-home.page').then((m) => m.TeacherTravelHomePage),
  },
  {
    path: 'teacher/travel/schedules',
    canActivate: [roleGuard('teacher')],
    loadComponent: () => import('./travel/travel-schedules.page').then((m) => m.TeacherTravelSchedulesPage),
  },
  {
    path: 'teacher/travel/requests',
    canActivate: [roleGuard('teacher')],
    loadComponent: () => import('./travel/travel-requests.page').then((m) => m.TeacherTravelRequestsPage),
  },
  {
    path: 'teacher/travel/open-trips',
    canActivate: [roleGuard('teacher')],
    loadComponent: () => import('./travel/open-trips.page').then((m) => m.TeacherOpenTripsPage),
  },
];
