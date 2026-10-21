import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { firstValueFrom } from 'rxjs';
import { AccountService } from '@web/services/account.service';
import { mediaUrl } from './media';

export type RoleGroup = 'student' | 'teacher' | 'admin';

export interface CurrentUser {
  userId: number | null;
  name: string;
  email: string;
  role: string; // Admin | Moderator | Teacher | User
  avatarUrl: string | null;
  country?: string;
  bio?: string;
}

const TOKEN_KEY = 'token'; // cùng key với web — các service dùng chung đọc key này
const PANEL_KEY = 'vp-panel'; // 'admin' | 'teacher' — panel đang xem của Admin / Moderator

/** Trạng thái đăng nhập (thay cho phần auth trong app.component.ts của web). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private account = inject(AccountService);
  private router = inject(Router);

  readonly user = signal<CurrentUser | null>(null);
  readonly roleGroup = computed<RoleGroup | null>(() => groupOf(this.user()?.role));
  /**
   * Admin / Moderator đang xem Teacher panel (true) hay Admin tools (false).
   * Mặc định: Admin → Admin tools, Moderator → Teacher panel. Lưu trong phiên (sessionStorage).
   */
  readonly adminTeacherMode = signal(sessionStorage.getItem(PANEL_KEY) === 'teacher');

  constructor() {
    effect(() => {
      if (this.isStaff()) sessionStorage.setItem(PANEL_KEY, this.adminTeacherMode() ? 'teacher' : 'admin');
    });
  }

  /** Admin hoặc Moderator — được vào Admin tools (backend cho phép cả hai ở phần lớn API quản trị). */
  isStaff(): boolean {
    const role = (this.user() ?? this.userFromToken())?.role;
    return role === 'Admin' || role === 'Moderator';
  }

  isAdmin(): boolean {
    return (this.user() ?? this.userFromToken())?.role === 'Admin';
  }

  /** Đặt panel mặc định theo role (khi đăng nhập mới, hoặc chưa chọn trong phiên này). */
  private applyDefaultPanel(force: boolean): void {
    if (!force && sessionStorage.getItem(PANEL_KEY)) return;
    const role = (this.user() ?? this.userFromToken())?.role;
    if (role === 'Admin' || role === 'Moderator') this.adminTeacherMode.set(role === 'Moderator');
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  /** Đọc nhanh từ JWT (không chờ API) — dùng cho guard và landing. */
  userFromToken(): CurrentUser | null {
    const token = this.token;
    if (!token) return null;
    try {
      const p: any = jwtDecode(token);
      return {
        userId:
          Number(
            p.nameid || p.sub || p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || 0,
          ) || null,
        name: p.name || p.unique_name || p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
        email: p.email || '',
        role: normalizeRole(p.role || p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) ?? 'User',
        avatarUrl: null,
      };
    } catch {
      return null;
    }
  }

  currentGroup(): RoleGroup | null {
    return groupOf((this.user() ?? this.userFromToken())?.role);
  }

  async setToken(token: string): Promise<void> {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(PANEL_KEY);
    this.user.set(this.userFromToken());
    await this.refresh();
    this.applyDefaultPanel(true);
  }

  /** Lấy role / tên / avatar mới nhất từ /account/me. */
  async refresh(): Promise<void> {
    if (!this.token) {
      this.user.set(null);
      return;
    }
    const base = this.user() ?? this.userFromToken();
    this.user.set(base);
    try {
      const res: any = await firstValueFrom(this.account.getCurrentUser());
      const apiRole = res.role ?? res.roleName ?? res.roleId;
      this.user.set({
        userId: res.userId ?? res.id ?? base?.userId ?? null,
        name: res.name ?? base?.name ?? '',
        email: res.email ?? base?.email ?? '',
        role: normalizeRole(apiRole) ?? base?.role ?? 'User',
        avatarUrl: res.avatarUrl ? mediaUrl(res.avatarUrl, 'uploads') : null,
        country: res.country,
        bio: res.bio,
      });
    } catch {
      // interceptor đã xử lý 401; lỗi mạng thì giữ thông tin từ token
    }
    this.applyDefaultPanel(false);
  }

  landingPath(): string {
    if (!this.isLoggedIn) return '/welcome';
    if (this.isStaff()) return this.adminTeacherMode() ? '/teacher/dashboard' : '/admin/finance';
    if (this.currentGroup() === 'teacher') return '/teacher/dashboard';
    return '/home';
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(PANEL_KEY);
    this.user.set(null);
    this.adminTeacherMode.set(false);
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}

export function normalizeRole(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const raw = String(value).trim().toLowerCase();
  if (raw === 'admin' || raw === '2') return 'Admin';
  if (raw === 'moderator' || raw === '3') return 'Moderator';
  if (raw === 'teacher' || raw === '5') return 'Teacher';
  if (raw === 'user' || raw === '1') return 'User';
  return String(value).trim();
}

export function groupOf(role: string | null | undefined): RoleGroup | null {
  if (!role) return null;
  if (role === 'Admin') return 'admin';
  if (role === 'Moderator' || role === 'Teacher') return 'teacher';
  return 'student';
}
