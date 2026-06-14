import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BaseService {

  public handleError(err: any, defaultMsg: string) {
    console.error(err);
    let message = defaultMsg;

    if (err) {
      try {
        const parsed =
          typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
        message = parsed?.message || message;
      } catch {
        message = err.error || message;
      }
    }

    alert(message);
  }
}
