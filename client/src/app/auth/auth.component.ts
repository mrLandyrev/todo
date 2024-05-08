import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Subject } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { TuiDialogContext } from '@taiga-ui/core/interfaces/dialog-context';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { NotesService } from '../notes.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent {
  constructor(
    private authService: AuthService,
    private readonly cookieService: CookieService,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext,
    private readonly notesService: NotesService
  ) {}
  message$ = new Subject();
  authForm = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[a-zA-Z0-9.%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/),
    ]),
    password: new FormControl('', [
      Validators.required,
      // Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\W_]).{8,}$'),
    ]),
    aclKey: new FormControl(''),
  });

  login() {
    if (!this.keyId && !this.authForm.controls.aclKey.value) {
      this.message$.next('u need to enter acl key from authorised device');
      return;
    }
    this.authService.login(this.authForm.value).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.message) {
          this.message$.next(res.message);
        }
        if (res.accessToken) {
          this.cookieService.set('accessToken', res.accessToken);
          this.cookieService.set('refreshToken', res.refreshToken);

          this.authService.isUserLoggedIn$.next(true);
          this.context.completeWith();
          this.notesService.getNotes();
        }
      },
      error: (res: any) => {
        if (res.status === 401) {
          this.authService.refresh();
          this.message$.next('incorrect data');
        }

        if (res.status === 404) {
          this.message$.next('user is not exists');
        }
      },
    });
  }

  get keyId() {
    return !!localStorage.getItem('keyId');
  }

  register() {
    this.authService.register(this.authForm.value).subscribe({
      next: (res: any) => {
        console.log(res);
        if (res.accessToken) {
          this.cookieService.set('accessToken', res.accessToken);
          this.cookieService.set('refreshToken', res.refreshToken);
          localStorage.setItem('keyId', res.keyId);
          this.authService.isUserLoggedIn$.next(true);
          this.context.completeWith();
          this.notesService.getNotes();
        }
      },
      error: (res: any) => {
        this.message$.next('user with this username still exists');
      },
    });
  }
}
