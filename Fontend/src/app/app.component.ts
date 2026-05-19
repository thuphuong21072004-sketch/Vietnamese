import { Component } from '@angular/core';
import { NavigationEnd, RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AccountService } from './features/services/account.service';
import { filter } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

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
  isLogin: boolean = false;
  showAccountMenu = false;
  private lastToken: string | null = null;

  constructor(
  private router: Router,
  private api: AccountService
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
  const token = localStorage.getItem("token");
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

  this.api.getCurrentUser().subscribe({
    next: (res: any) => {
      this.userId = res.userId ?? res.id ?? this.userId;
      const apiRole = res.role ?? res.roleName;
      this.role = apiRole ? this.normalizeRole(apiRole) : (this.role ?? this.normalizeRole(res.roleId));
      this.name = res.name ?? this.name;
      this.isLogin = true;

    },
    error: () => {
      this.resetUser();
    }
  });
}

  resetUser() {
    this.role = null;
    this.userId = null;
    this.name = null;
    this.isLogin = false;
    this.showAccountMenu = false;
  }

  toggleMenu() {
    this.showAccountMenu = !this.showAccountMenu;
  }

  logout() {
    localStorage.removeItem('token');
    this.resetUser();
    this.router.navigate(['/home']);
  }

  get userInitial(): string {
    return (this.name || 'U').trim().charAt(0).toUpperCase();
  }

  private getUserFromToken(token: string) {
    try {
      const payload: any = jwtDecode(token);
      return {
        role: this.normalizeRole(
          payload.role ||
          payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
        ),
        name:
          payload.name ||
          payload.unique_name ||
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
          null,
        userId: Number(
          payload.nameid ||
          payload.sub ||
          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
          0,
        ) || null,
      };
    } catch {
      return { role: null, name: null, userId: null };
    }
  }

  private normalizeRole(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;

    const raw = value.toString().trim().toLowerCase();
    if (raw === 'admin' || raw === '2') return 'Admin';
    if (raw === 'moderator' || raw === '3') return 'Moderator';
    if (raw === 'user' || raw === '1') return 'User';

    return value.toString().trim();
  }
}
