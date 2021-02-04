/*
  Link: https://github.com/angular-patterns/ng-bootstrap-modal
  License: Open Source (Undefined)
  Modified: Thomas D'haenens
  Company: Neatly (https://neatly.be/)
*/


// Imports: Default
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

// Imports: Custom Services
import { FocusDialogComponent } from './focus-dialog/focus-dialog.component';
import { FocusOutletComponent } from './focus-outlet/focus-outlet.component';


// Module Definition
@NgModule({imports: [CommonModule, BrowserAnimationsModule, RouterModule.forChild([])], declarations: [FocusDialogComponent, FocusOutletComponent], exports: [FocusDialogComponent, FocusOutletComponent], providers: []})


// Module Export Definition
export class CommonFocusModule { }
