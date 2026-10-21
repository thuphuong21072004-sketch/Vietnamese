import { inject } from '@angular/core';
import { Params, Route, Router, Routes } from '@angular/router';

/**
 * Đường dẫn của web cũ (Fontend/app.routes.ts) → màn tương ứng của mobile.
 * Điện thoại mở link cũ / bookmark (web tự chuyển sang /m + cùng đường dẫn) vẫn vào đúng màn.
 * Phải đứng TRƯỚC các route `user/:id`, tab shell `teacher` / `admin` trong app.routes.ts.
 * Không đổi: các đường dẫn web trùng với mobile (/home, /login, /payment/:id, /booking/:id, /review/:id,
 * /room/:id, /teacher/dashboard, /teacher/bookings, /teacher/travel/*, /admin/users, /admin/teachers…).
 * /teacher/schedule giữ nguyên là tab My Availability của mobile (web dùng đường dẫn này cho lịch dạy).
 */
type Target = string | ((p: Params, q: Params) => [string, Params?]);

function to(path: string, target: Target, keepQuery = true): Route {
  return {
    path,
    pathMatch: 'full',
    redirectTo: ({ params, queryParams }) => {
      const router = inject(Router);
      const [url, query] = typeof target === 'string' ? [target, undefined] : target(params, queryParams);
      return router.createUrlTree([url], { queryParams: query ?? (keepQuery ? queryParams : {}) });
    },
  };
}

export const LEGACY_WEB_ROUTES: Routes = [
  // Tự học
  to('user/units', '/learn'),
  to('user/tests', '/learn/tests'),
  to('user/speaking', '/learn/speaking'),
  to('user/search', '/search'),
  to('user/quiz', '/quiz'),
  // Gia sư 1-1
  to('user/learnOnline', '/tutoring'),
  to('schedule/:id', (p) => [`/tutoring/slot/${p['id']}`]),
  to('user/schedule/:id', (p) => [`/tutoring/slot/${p['id']}`]),
  to('user/booking/:id', (p) => [`/booking/${p['id']}`]),
  to('user/review/:id', (p) => [`/review/${p['id']}`]),
  // Lớp nhóm
  to('teacher/class', '/classes'),
  to('user/classdetail/:id', (p) => [`/classes/${p['id']}`]),
  to('user/schedule', '/classes', false),
  // Tài khoản
  to('user/register', '/register'),
  to('profile', '/me'),
  to('user/dashboard', '/me/dashboard'),
  to('user/become-teacher', '/me/become-teacher'),
  to('user/profile/:id', (p) => [`/user/${p['id']}`]),
  // Du lịch
  to('user/travel', '/travel/trips'),
  to('user/travel/trips', '/travel/trips'),
  to('user/travel/requests', '/travel/requests'),
  // Giáo viên
  to('teacher/listclass', '/teacher/classes'),
  to('teacher/detail/:id', (p) => [`/teacher/classes/${p['id']}`]),
  to('class/create', '/teacher/classes/new'),
  to('admin/schedule', '/teacher/schedule'),
  to('admin/classrooms', '/teacher/bookings'),
  to('admin/bookings/:id', (p) => [`/teacher/bookings/${p['id']}`]),
  // Admin
  to('admin/dashboard', '/admin/finance'),
  to('admin/levels', '/admin/content', false),
  to('admin/courses', (_p, q) => ['/admin/content', { seg: 'courses', ...(q['levelId'] ? { levelId: q['levelId'] } : {}) }]),
  to('admin/units', (_p, q) => ['/admin/content', { seg: 'units', ...(q['courseId'] ? { courseId: q['courseId'] } : {}) }]),
  to('admin/unitDetail', (_p, q) =>
    q['unitId'] ? [`/admin/units/${q['unitId']}`, {}] : ['/admin/units/new', q['courseId'] ? { courseId: q['courseId'] } : {}],
  ),
  to('admin/tests', '/admin/content', false),
  to('admin/travel/bookings', '/admin/travel-bookings'),
];
