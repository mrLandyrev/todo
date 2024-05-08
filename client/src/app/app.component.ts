import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { NotesService } from './notes.service';
import { CookieService } from 'ngx-cookie-service';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'notes';

  theme$ = this.notesService.isDarkMode$;

  isUserLoggedIn$ = this.authService.isUserLoggedIn$;

  constructor(
    private readonly router: Router,
    private notesService: NotesService,
    private readonly authService: AuthService
  ) {}

  addNote() {
    this.router.navigate(['/new']);
  }
}
