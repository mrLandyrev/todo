import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private readonly http: HttpClient,
    private readonly cookieService: CookieService
  ) {}

  isUserLoggedIn$ = new BehaviorSubject(
    !!this.cookieService.get('accessToken')
  );

  login(
    data: Partial<{
      username: string | null;
      password: string | null;
      aclKey: string | null;
    }>
  ) {
    const keyId = localStorage.getItem('keyId');

    if (!keyId) {
      const key = Math.floor(Math.random() * 10000 + 10000).toString();
      localStorage.setItem('key', key.toString());

      return this.http.post('http://localhost/auth/login', {
        login: data.username,
        password: data.password,
        keyContent: key,
        code: data.aclKey,
      });
    } else {
      return this.http.post('http://localhost/auth/login', {
        login: data.username,
        password: data.password,
        keyId,
      });
    }
  }

  register(
    data: Partial<{ username: string | null; password: string | null }>
  ) {
    const key = Math.floor(Math.random() * 10000 + 10000).toString();
    localStorage.setItem('key', key.toString());
    return this.http.post('http://localhost/auth/register', {
      login: data.username,
      password: data.password,
      key,
    });
  }

  logout() {
    this.cookieService.delete('accessToken');
    this.cookieService.delete('refreshToken');
    localStorage.removeItem('keyId');
    this.isUserLoggedIn$.next(false);
  }

  refresh() {
    return this.http
      .post('http://localhost/auth/refresh', {
        refreshToken: this.cookieService.get('refreshToken'),
      })
      .subscribe((res: any) => {
        this.cookieService.set('refreshToken', res.refreshToken);
        this.cookieService.set('accessToken', res.accessToken);
      });
  }

  acl() {
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + this.cookieService.get('accessToken'),
    });
    return this.http.get('http://localhost/acl/code', { headers: headers });
  }
}
