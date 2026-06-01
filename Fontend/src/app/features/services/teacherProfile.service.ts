import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeacherProfileService {
  private apiUrl = `${environment.apiBaseUrl}/teacher-profile`;

  constructor(private http: HttpClient) {}

  private getOptions(isText: boolean = false) {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return {
      headers,

      responseType: (isText ? 'text' : 'json') as 'json',
    };
  }

  /*
   * lấy profile hiện tại
   */
  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`, this.getOptions());
  }

  /*
   * tạo hồ sơ giáo viên
   */
  createProfile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, data, this.getOptions());
  }

  /*
   * cập nhật hồ sơ giáo viên
   */
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, data, this.getOptions());
  }

  /*
   * submit hồ sơ cho admin duyệt
   */
  submitProfile(): Observable<any> {
    return this.http.put(`${this.apiUrl}/submit`, {}, this.getOptions());
  }

  /*
   * admin duyệt hồ sơ
   * status = 2
   */
  approveProfile(teacherProfileId: number): Observable<any> {
    const params = new HttpParams().set('status', 2);

    return this.http.put(
      `${this.apiUrl}/update/${teacherProfileId}/status`,

      {},

      {
        ...this.getOptions(),

        params,
      },
    );
  }

  /*
   * admin từ chối hồ sơ
   * status = 3
   */
  rejectProfile(teacherProfileId: number): Observable<any> {
    const params = new HttpParams().set('status', 3);

    return this.http.put(
      `${this.apiUrl}/update/${teacherProfileId}/status`,

      {},

      {
        ...this.getOptions(),

        params,
      },
    );
  }

  /*
   * cập nhật trạng thái chung
   */
  updateStatus(id: number, status: number): Observable<any> {
    const params = new HttpParams().set('status', status);

    return this.http.put(
      `${this.apiUrl}/update/${id}/status`,

      {},

      {
        ...this.getOptions(),

        params,
      },
    );
  }

  /*
   * danh sách teacher cho admin
   */
  getAllTeachers(status?: number): Observable<any[]> {
    let params = new HttpParams();

    if (status !== undefined) {
      params = params.set('status', status);
    }

    return this.http.get<any[]>(
      `${this.apiUrl}/admin`,

      {
        ...this.getOptions(),

        params,
      },
    );
  }

  /*
   * chi tiết giáo viên
   */
  getTeacherDetail(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${id}`,

      this.getOptions(),
    );
  }
  /*
   * khóa vĩnh viễn giáo viên
   */
  banTeacher(teacherProfileId: number): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/ban/${teacherProfileId}`,

      {},

      this.getOptions(),
    );
  }
  /*
   * upload video giới thiệu
   */
  uploadVideo(file: File): Observable<any> {
    const formData = new FormData();

    formData.append('file', file);

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(`${this.apiUrl}/upload-video`, formData, {
      headers,
    });
  }
}
