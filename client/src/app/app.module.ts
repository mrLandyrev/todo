import {
  TuiRootModule,
  TuiDialogModule,
  TuiAlertModule,
  TuiSvgModule,
  TuiButtonModule,
  TuiTextfieldControllerModule,
  TuiThemeNightModule,
  TuiErrorModule,
} from '@taiga-ui/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { NoteViewComponent } from './note-view/note-view.component';
import {
  TuiActionModule,
  TuiInputComponent,
  TuiInputFilesModule,
  TuiInputModule,
  TuiInputPasswordModule,
  TuiIslandModule,
  TuiMarkerIconModule,
  TuiTagModule,
  TuiTextAreaModule,
} from '@taiga-ui/kit';
import { TuiLetModule } from '@taiga-ui/cdk';
import { NoteNewComponent } from './note-new/note-new.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoteEditComponent } from './note-edit/note-edit.component';
import { HttpClientModule } from '@angular/common/http';
import { AuthComponent } from './auth/auth.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MenuComponent,
    NoteViewComponent,
    NoteNewComponent,
    NoteEditComponent,
    AuthComponent,
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    TuiRootModule,
    TuiDialogModule,
    TuiAlertModule,
    TuiSvgModule,
    TuiButtonModule,
    TuiActionModule,
    TuiLetModule,
    TuiIslandModule,
    FormsModule,
    ReactiveFormsModule,
    TuiTextAreaModule,
    TuiInputModule,
    TuiTextfieldControllerModule,
    TuiInputFilesModule,
    TuiDialogModule,
    TuiThemeNightModule,
    TuiMarkerIconModule,
    TuiTagModule,
    TuiInputPasswordModule,
    TuiErrorModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
