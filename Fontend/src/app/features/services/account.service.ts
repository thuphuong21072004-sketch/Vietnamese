import { Injectable } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { LoginResult } from '../models/login-result.model';

import { UserResult } from '../models/user-result.model';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private apiUrl = `${environment.apiBaseUrl}/account`;

  constructor(private http: HttpClient) {}
  //token
  private getOptions(isText: boolean = false) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return {
      headers: headers,
      responseType: (isText ? 'text' : 'json') as 'json',
    };
  }

  login(data: any): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${this.apiUrl}/login`, data);
  }

  register(data: any): Observable<LoginResult> {
    return this.http.post<LoginResult>(`${this.apiUrl}/register`, data);
  }

  getCurrentUser(): Observable<UserResult> {
    return this.http.get<UserResult>(`${this.apiUrl}/me`);
  }

  changePassword(data: any) {
    return this.http.put(`${this.apiUrl}/change-password`, data, {
      responseType: 'text',
    });
  }

  updateProfile(data: any) {
    return this.http.put(`${this.apiUrl}/update-profile`, data);
  }

  getUsers(
    email?: string,
    status?: number,
    roleId?: number,
    page: number = 1,
    pageSize: number = 10,
  ) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    
    if (email) {
      params = params.set('email', email);
    }
    if (status !== null && status !== undefined) {
      params = params.set('status', status.toString());
    }
    if (roleId !== null && roleId !== undefined) {
      params = params.set('roleId', roleId.toString());
    }
    
    return this.http.get(`${this.apiUrl}/users`, { params, headers });
  }

  updateUserStatus(email: string, status: number) {
    if (!email) {
      console.error('email undefined');
      return new Observable();
    }

    return this.http.put(`${this.apiUrl}/users/${email}/status`, null, {
      ...this.getOptions(),
      params: {
        status: status,
      },
    });
  }

  updateUserRole(email: string, roleName: string) {
    if (!email) {
      console.error('email undefined');
      return new Observable();
    }

    return this.http.put(`${this.apiUrl}/users/${email}/role`, null, {
      ...this.getOptions(),
      params: {
        roleName: roleName,
      },
    });
  }

  uploadAvatar(file: File) {
    const formData = new FormData();

    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload-avatar`, formData);
  }
}
