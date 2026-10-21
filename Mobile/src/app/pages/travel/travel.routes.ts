import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards';

/** Nhóm 6 · Du lịch cùng gia sư — toàn màn (ẩn tab bar). */
export const FULLSCREEN_ROUTES: Routes = [
  { path: 'travel', pathMatch: 'full', redirectTo: 'travel/trips' },
  {
    path: 'travel/trips',
    canActivate: [roleGuard('student')],
    loadComponent: () => import('./travel-trips.page').then((m) => m.TravelTripsPage),
  },
  {
    path: 'travel/requests',
    canActivate: [roleGuard('student')],
    loadComponent: () => import('./travel-requests.page').then((m) => m.TravelRequestsPage),
  },
];
