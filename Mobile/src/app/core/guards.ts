import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, RoleGroup } from './auth.service';

/** Bắt buộc đăng nhập. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn ? true : inject(Router).parseUrl('/login');
};

/** Màn Login / Register: đã đăng nhập thì vào thẳng màn chính theo vai trò. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn ? inject(Router).parseUrl(auth.landingPath()) : true;
};

/** Admin tools: Admin + Moderator (khớp [Authorize(Roles = "Admin,Moderator")] của backend). */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn) return router.parseUrl('/login');
  return auth.isStaff() ? true : router.parseUrl(auth.landingPath());
};

/** Giới hạn theo nhóm vai trò. Admin được vào Teacher panel. */
export function roleGuard(...groups: RoleGroup[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn) return router.parseUrl('/login');
    const group = auth.currentGroup();
    if (group && groups.includes(group)) return true;
    if (group === 'admin' && groups.includes('teacher')) return true;
    return router.parseUrl(auth.landingPath());
  };
}
