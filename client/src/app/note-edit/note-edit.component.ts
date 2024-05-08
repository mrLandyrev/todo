import { Component, Inject } from '@angular/core';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Note, NotesService } from '../notes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-note-edit',
  templateUrl: './note-edit.component.html',
  styleUrls: ['./note-edit.component.scss'],
})
export class NoteEditComponent {
  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<Note>,
    private readonly notesService: NotesService,
    private readonly router: Router
  ) {}

  noteData: FormGroup<{
    title: FormControl<string>;
    description: FormControl<string>;
    fileData: FormControl<null>;
  }> = new FormGroup({
    title: new FormControl('', Validators.required) as FormControl<string>,
    description: new FormControl(
      '',
      Validators.required
    ) as FormControl<string>,
    fileData: new FormControl(null),
  });

  file!: File | null;

  note!: any;

  ngOnInit(): void {
    this.noteData.controls.title.setValue((this.context.data as any).title);
    this.noteData.controls.description.setValue(
      (this.context.data as any).description
    );
    this.noteData.controls.fileData.setValue(
      (this.context.data as any).fileData
    );
    this.file = (this.context.data as any).file;
    this.note = this.context.data;
  }

  saveEdit() {
    const { title, description } = this.noteData.value;
    const id = this.note.id;
    const created = this.note.created;
    const file = this.file;
    const fileData = this.noteData.controls.fileData.value;
    const data = { id, title, description, created, file, fileData };
    this.notesService.editNote(data);
    this.context.completeWith(this.note);
  }

  onFileChange() {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent) => {
      this.file = (event.target as any).result;
    };

    reader.readAsDataURL(this.noteData.controls.fileData.value as any);
  }

  removeFile() {
    this.noteData.controls.fileData.setValue(null);
    this.file = null;
  }

  ngOnDestroy(): void {
    this.router.navigate([this.note.id]);
    this.context.completeWith(this.note);
  }
}
