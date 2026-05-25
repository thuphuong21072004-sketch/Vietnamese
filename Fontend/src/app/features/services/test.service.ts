import { HttpClient, HttpHeaders } from '@angular/common/http';
import { QuizDTO } from '../models/quiz.model';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { SubmitQuizDTO } from '../models/submit-quiz.model';
import { PlacementDTO } from '../models/placement.model';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class TestService {
  private apiUrl = `${environment.apiBaseUrl}/tests`;

  constructor(private http: HttpClient) {}

  // token
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

  // QUIZ

  getQuiz(refId: number, refType: string): Observable<QuizDTO> {
    return this.http
      .get<QuizDTO>(`${this.apiUrl}/allQuiz?refId=${refId}&refType=${refType}`)
      .pipe(map((quiz: any) => this.normalizeKeys<QuizDTO>(quiz)));
  }

  saveQuiz(dto: QuizDTO): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/quiz/full`,
      dto,
      this.getOptions(true),
    ) as Observable<string>;
  }

  deleteQuiz(quizId: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/deleteQuiz?id=${quizId}`,
      this.getOptions(true),
    ) as Observable<string>;
  }

  // SUBMIT QUIZ
  submitQuiz(dto: SubmitQuizDTO): Observable<string> {
    return this.http.post(
      `${this.apiUrl}/submitQuiz`,
      dto,
      this.getOptions(true),
    ) as Observable<string>;
  }

  // RESULT
  getMyQuizResult(quizId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/my-quiz-result?quizId=${quizId}`,
      this.getOptions(),
    );
  }

  getUserAnswersRaw(quizId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/review-raw/${quizId}`,
      this.getOptions(),
    );
  }

  // PLACEMENT

  getPlacements(): Observable<PlacementDTO[]> {
    return this.http.get<PlacementDTO[]>(`${this.apiUrl}/listplacements`);
  }

  private normalizeKeys<T>(value: any): T {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeKeys(item)) as any;
    }

    if (value && typeof value === 'object') {
      return Object.keys(value).reduce((result: any, key) => {
        const normalizedKey = /^[A-Z]/.test(key)
          ? key[0].toLowerCase() + key.slice(1)
          : key;

        result[normalizedKey] = this.normalizeKeys(value[key]);
        return result;
      }, {});
    }

    return value;
  }

  savePlacement(dto: PlacementDTO): Observable<PlacementDTO> {
    return this.http.post<PlacementDTO>(
      `${this.apiUrl}/savePlacements`,
      dto,
      this.getOptions(),
    );
  }

  deletePlacement(id: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/deletePlacements/${id}`,
      this.getOptions(true),
    ) as Observable<string>;
  }
}
