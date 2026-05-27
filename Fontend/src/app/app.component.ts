import { Component } from '@angular/core';
import { NavigationEnd, RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccountService } from './features/services/account.service';
import { filter } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { TestService } from './features/services/test.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  role: string | null = null;
  userId: number | null = null;
  name: string | null = null;
  avatarUrl: string | null = null;
  isLogin: boolean = false;
  showAccountMenu = false;
  adminMode: 'management' | 'teacher' = 'management';
  private lastToken: string | null = null;

  constructor(
    private router: Router,
    private api: AccountService,
    private testService: TestService,
  ) {}

  ngOnInit() {
    this.loadCurrentUser();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const token = localStorage.getItem('token');
        if (token !== this.lastToken) {
          this.loadCurrentUser();
        }
      });
  }

  loadCurrentUser() {
    const token = localStorage.getItem('token');
    this.lastToken = token;

    if (!token) {
      this.resetUser();
      return;
    }

    const tokenData = this.getUserFromToken(token);
    this.role = tokenData.role;
    this.name = tokenData.name;
    this.userId = tokenData.userId;
    this.isLogin = true;
    this.adminMode = this.role === 'Moderator' ? 'teacher' : 'management';

    this.api.getCurrentUser().subscribe({
      next: (res: any) => {
        this.userId = res.userId ?? res.id ?? this.userId;
        const apiRole = res.role ?? res.roleName;
        const oldRole = this.role;
        this.role = apiRole
          ? this.normalizeRole(apiRole)
          : (this.role ?? this.normalizeRole(res.roleId));

        if (this.role === 'Moderator') {
          this.adminMode = 'teacher';
        } else if (this.role === 'Admin') {
          this.adminMode = 'management';
        }

        console.log('Role update:', {
          oldRole,
          apiRole,
          normalizedRole: this.role,
          adminMode: this.adminMode,
        });
        this.name = res.name ?? this.name;
        this.avatarUrl = res.avatarUrl
          ? this.resolveAvatarUrl(res.avatarUrl)
          : null;
        this.isLogin = true;
      },
      error: () => {
        this.resetUser();
      },
    });
  }

  resetUser() {
    this.role = null;
    this.userId = null;
    this.name = null;
    this.avatarUrl = null;
    this.isLogin = false;
    this.showAccountMenu = false;
    this.adminMode = 'management';
  }

  toggleMenu() {
    this.showAccountMenu = !this.showAccountMenu;
  }

  setAdminMode(mode: 'management' | 'teacher') {
    this.adminMode = mode;
  }

  get isAdmin() {
    return this.role === 'Admin';
  }

  get isTeacherPanelVisible() {
    return this.role === 'Moderator' || this.adminMode === 'teacher';
  }

  logout() {
    localStorage.removeItem('token');
    this.resetUser();
    this.router.navigate(['/home']);
  }

  get userInitial(): string {
    return (this.name || 'U').trim().charAt(0).toUpperCase();
  }

  get debugInfo(): string {
    return `Role: ${this.role} | AdminMode: ${this.adminMode} | IsLogin: ${this.isLogin}`;
  }

  private getUserFromToken(token: string) {
    try {
      const payload: any = jwtDecode(token);
      return {
        role: this.normalizeRole(
          payload.role ||
            payload[
              'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
            ],
        ),
        name:
          payload.name ||
          payload.unique_name ||
          payload[
            'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
          ] ||
          null,
        userId:
          Number(
            payload.nameid ||
              payload.sub ||
              payload[
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'
              ] ||
              0,
          ) || null,
      };
    } catch {
      return { role: null, name: null, userId: null };
    }
  }

  private resolveAvatarUrl(url: string): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('http')) {
      return url;
    }

    return `http://localhost:5108/uploads/${url}`;
  }

  private normalizeRole(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    const raw = value.toString().trim().toLowerCase();
    if (raw === 'admin' || raw === '2') return 'Admin';
    if (raw === 'moderator' || raw === '3') return 'Moderator';
    if (raw === 'user' || raw === '1') return 'User';

    return value.toString().trim();
  }
  openRandomPlacement() {
    this.testService.getPlacements().subscribe({
      next: (res) => {
        if (!res || !res.length) {
          alert('No placement tests available');
          return;
        }

        const random = res[Math.floor(Math.random() * res.length)];

        this.router.navigate(['/user/quiz'], {
          queryParams: {
            refType: 'PLACEMENT',
            refId: random.placementId,
          },
        });
      },

      error: () => {
        alert('Failed to load placement tests');
      },
    });
  }
}
