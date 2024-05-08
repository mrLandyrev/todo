import { Component, Inject, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Observable,
  Subject,
  combineLatest,
  forkJoin,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { NoteEditComponent } from '../note-edit/note-edit.component';
import { Note, NotesService } from '../notes.service';

@Component({
  selector: 'app-note-view',
  templateUrl: './note-view.component.html',
  styleUrls: ['./note-view.component.scss'],
})
export class NoteViewComponent {
  constructor(
    private router: Router,
    private readonly route: ActivatedRoute,
    @Inject(TuiDialogService) private readonly dialog: TuiDialogService,
    @Inject(Injector) private readonly injector: Injector,
    private readonly notesService: NotesService
  ) {}

  destroy$ = new Subject();

  ngOnInit(): void {
    combineLatest([this.note$, this.route.queryParams])
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res[1]['openModal']) {
          this.edit(res[0]);
        }
      });
  }

  note$: Observable<Note> = combineLatest([
    this.route.params,
    this.notesService.notes$,
  ]).pipe(
    takeUntil(this.destroy$),
    map(([params]) => params['id']),
    switchMap((routeId) =>
      this.notesService
        .getNotes()
        .pipe(
          map(
            (notes: Array<Note>) =>
              notes.find((note: Note) => note.id === routeId) as Note
          )
        )
    )
  );

  remove(noteId?: string) {
    this.notesService.removeNote(noteId as string);
    this.router.navigate(['']);
  }

  edit(note: Note) {
    this.dialog
      .open(new PolymorpheusComponent(NoteEditComponent, this.injector), {
        data: note,
        size: 'l',
      })
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
