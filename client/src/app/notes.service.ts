import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable, Subject, filter, map, tap } from 'rxjs';
import { AuthService } from './auth.service';

export interface Note {
  title: string;
  description: string;
  createdAt: number;
  id: string;
  fileData: any;
  file: File | null;
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  notes$ = new BehaviorSubject<Array<any>>([]);

  private readonly _isDarkMode$ = new BehaviorSubject<boolean>(
    !!localStorage.getItem('isDarkMode')
  );

  get isDarkMode$(): BehaviorSubject<boolean> {
    return this._isDarkMode$;
  }

  set isDarkMode$(val: boolean) {
    this._isDarkMode$.next(val);
    localStorage.setItem('isDarkMode', val.toString());
  }

  constructor(
    private readonly http: HttpClient,
    private readonly cookieService: CookieService,
    private auth: AuthService
  ) {}

  private encode(content: string) {
    const keyContent = localStorage.getItem('key') as string;
    return content
      .split('')
      .map((x, i) => x + keyContent[i % keyContent.length])
      .join('');
  }

  private decode(content: string) {
    return content
      .split('')
      .map((x, i) => (i % 2 ? '' : x))
      .join('');
  }

  getNotes(): Observable<Array<Note>> {
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + this.cookieService.get('accessToken'),
    });

    return this.http
      .get<Array<Note>>('http://localhost/todo', {
        headers: headers,
      })
      .pipe(
        map((notes) => {
          return notes.map((note) => {
            note.title = this.decode(note.title);
            note.description = this.decode(note.description);
            return note;
          });
        })
      );
  }

  addNote(note: Partial<Note>): Observable<Note> {
    const { description, title } = note;

    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + this.cookieService.get('accessToken'),
    });
    return this.http.post<Note>(
      'http://localhost/todo/',
      {
        title: this.encode(title as string),
        description: this.encode(description as string),
      },
      { headers: headers }
    );
  }

  removeNote(noteId: string) {
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + this.cookieService.get('accessToken'),
    });
    const currentNotes = this.notes$.value;
    const updatedNotes = currentNotes.filter(
      (note: Note) => note.id !== noteId
    );

    this.http
      .delete(`http://localhost/todo/${noteId}`, { headers: headers })
      .subscribe(console.log, (err) => {
        if (err.status === 401) {
          this.auth.refresh();
        }
      });
    this.notes$.next(updatedNotes);
  }

  editNote(updatedNote: Partial<Note>) {
    const { description, id, title } = updatedNote;

    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + this.cookieService.get('accessToken'),
    });
    this.http
      .patch(
        `http://localhost/todo/${updatedNote.id}`,
        {
          title: this.encode(title as string),
          description: this.encode(description as string),
          id,
        },
        { headers: headers }
      )
      .subscribe(console.log, (err) => {
        if (err.status === 401) {
          this.auth.refresh();
        }
      });
  }

  getSingleNote(noteId: string): Observable<any> {
    return this.notes$.pipe(
      map((notes: Array<Note>) =>
        notes.find((note: Note) => note.id === noteId)
      )
    );
  }
}
