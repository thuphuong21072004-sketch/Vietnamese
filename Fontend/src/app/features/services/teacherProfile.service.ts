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
   * nộp hồ sơ
   */
  submitProfile(): Observable<any> {
    return this.http.put(`${this.apiUrl}/submit`, {}, this.getOptions());
  }

  /*
   * admin duyệt hồ sơ
   */
  approveProfile(
    teacherProfileId: number,
    approvedPrice: number,
    note?: string,
  ): Observable<any> {
    let params = new HttpParams().set('approvedPrice', approvedPrice);

    if (note) {
      params = params.set('note', note);
    }

    return this.http.put(
      `${this.apiUrl}/admin/${teacherProfileId}/approve`,
      {},
      {
        ...this.getOptions(),
        params,
      },
    );
  }

  /*
   * admin từ chối hồ sơ
   */
  rejectProfile(teacherProfileId: number, note: string): Observable<any> {
    const params = new HttpParams().set('note', note);

    return this.http.put(
      `${this.apiUrl}/admin/${teacherProfileId}/reject`,
      {},
      {
        ...this.getOptions(),
        params,
      },
    );
  }

  /*
   * giáo viên chấp nhận
   */
  acceptProfile(): Observable<any> {
    return this.http.put(`${this.apiUrl}/accept`, {}, this.getOptions());
  }

  /*
   * giáo viên từ chối
   */
  rejectApprovedProfile(): Observable<any> {
    return this.http.put(`${this.apiUrl}/reject`, {}, this.getOptions());
  }

  /*
   * danh sách giáo viên cho admin
   */
  getAllTeachers(status?: number): Observable<any[]> {
    let params = new HttpParams();

    if (status !== undefined) {
      params = params.set('status', status);
    }

    return this.http.get<any[]>(`${this.apiUrl}/admin`, {
      ...this.getOptions(),
      params,
    });
  }

  /*
   * admin xem chi tiết hồ sơ
   */
  getTeacherDetailForAdmin(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/${id}`, this.getOptions());
  }

  /*
   * học viên xem chi tiết giáo viên
   */
  getTeacherDetailForStudent(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/student/${id}`,
      this.getOptions(),
    );
  }

  /*
   * khóa vĩnh viễn giáo viên
   */
  banTeacher(teacherProfileId: number, reason: string): Observable<any> {
    const params = new HttpParams().set('reason', reason);

    return this.http.put(
      `${this.apiUrl}/ban/${teacherProfileId}`,
      {},
      {
        ...this.getOptions(),
        params,
      },
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
  uploadCertificate(file: File): Observable<any> {
    const formData = new FormData();

    formData.append('file', file);

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.post(`${this.apiUrl}/upload-certificate`, formData, {
      headers,
    });
  }
}
