import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { SearchResult } from '../models/search-result.model';
import { Video } from '../models/video.model';

import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private apiUrl = 'http://localhost:5108/api/videos';
  // token
  constructor(private http: HttpClient) {}
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
  /*
  tra từ trong video
  thuphuong21072004
  */
  searchVideo(
    keyword: string,
    page: number = 1,
    pageSize: number = 10,
  ): Observable<SearchResult[]> {
    const params = new HttpParams()
      .set('keyword', keyword)
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http.get<SearchResult[]>(`${this.apiUrl}/searchVideo`, {
      params,
    });
  }
  /*
  danh sách video
  thuphuong21072004
  */
  listVideo(
    status?: number,
    page: number = 1,
    pageSize: number = 10,
  ): Observable<{ total: number; data: Video[] }> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (status !== undefined && status !== null) {
      params = params.set('status', status);
    }

    return this.http.get<{ total: number; data: Video[] }>(
      `${this.apiUrl}/listVideo`,
      { params },
    );
  }
  /*
  thêm video mới
  thuphuong21072004
  */
  insertVideo(youtubeId: string): Observable<string> {
    return this.http.post<string>(
      `${this.apiUrl}/insertVideo`,
      { youtubeId: youtubeId },
      this.getOptions(true),
    );
  }
  /* 
  sửa trạng thái video
  thuphuong21072004
  */
  updateVideo(videoId: number, status: number): Observable<string> {
    const params = new HttpParams()
      .set('videoId', videoId)
      .set('status', status);

    return this.http.put<string>(
      `${this.apiUrl}/updateVideo`,
      {}, // Body trống
      {
        ...this.getOptions(true),
        params,
      },
    );
  }
  /*
  lấy video theo id
  thuphuong21072004
  */
  getVideoById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/${id}`);
  }
  /*
  lấy nghĩa từ vựng 
  thuphuong21072004
  */
  getDefinition(keyword: string): Observable<any> {
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&dt=bd&dt=ex&q=${encodeURIComponent(keyword)}`;

    return from(fetch(translateUrl).then((res) => res.json())).pipe(
      map((res: any) => {
        
        return {
          word: keyword,
          translation: res[0][0][0],
          meanings: res[1] || [], 
          examples: res[12] ? res[12][0] : [],
        };
      }),
    );
  }
}
