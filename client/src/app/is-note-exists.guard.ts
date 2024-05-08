import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map } from 'rxjs/internal/operators/map';
import { NotesService } from './notes.service';
import { catchError } from 'rxjs/internal/operators/catchError';
import { of } from 'rxjs/internal/observable/of';
import { switchMap } from 'rxjs';

export const isNoteExistsGuard: CanActivateFn = (route) => {
  const id = route.params['id'];
  const notesService = inject(NotesService);
  return notesService.getNotes().pipe(
    switchMap((notes) => {
      const note = notes.find((el: any) => el.id === id);
      return of(!!note);
    }),
    catchError(() => of(false))
  );
};
