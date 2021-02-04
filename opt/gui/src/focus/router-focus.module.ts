/*
  Link: https://github.com/angular-patterns/ng-bootstrap-modal
  License: Open Source (Undefined)
  Modified: Thomas D'haenens
  Company: Neatly (https://neatly.be/)
*/


// Imports: Default
import { CommonModule } from '@angular/common';
import { NgModule, ANALYZE_FOR_ENTRY_COMPONENTS, ModuleWithProviders } from '@angular/core';

// Imports: Custom Services
import { Focuses, InitFocusService } from './focus.module';
import { FocusService } from './services/focus.service';
import { Router } from '@angular/router';
import { DataResolver } from './services/data.resolver';
import { Focus } from './models/focus.model';
import { CommonFocusModule } from './common-focus.module';


// Module Definition
@NgModule({imports: [CommonModule, CommonFocusModule], exports: [CommonFocusModule]})


// Module Export Definition
export class RouterFocusModule {

  // Define Required Modules and Providers
  static forRoot(focuses: Focus[]): ModuleWithProviders {
    return {
      ngModule: RouterFocusModule,
      providers: [
        {provide: Focuses, useValue: focuses},
        {provide: ANALYZE_FOR_ENTRY_COMPONENTS, multi: true, useValue: focuses},
        {provide: FocusService, useFactory: InitFocusService, deps: [Router, Focuses, DataResolver]},
        DataResolver
      ]
    }
  }

}
