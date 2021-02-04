/*
  Link: https://github.com/angular-patterns/ng-bootstrap-modal
  License: Open Source (Undefined)
  Modified: Thomas D'haenens
  Company: Neatly (https://neatly.be/)
*/


// Imports: Default
import { NgModule, InjectionToken, ANALYZE_FOR_ENTRY_COMPONENTS, ModuleWithProviders } from '@angular/core';
import { Router, Routes, RouterModule } from '@angular/router';

// Imports: Custom Services
import { Focus } from './models/focus.model';
import { DataResolver } from './services/data.resolver';
import { FocusService } from './services/focus.service';
import { CommonModule } from '@angular/common';
import { CommonFocusModule } from './common-focus.module';


// Define Variables
export const Focuses = new InjectionToken<Focus[]>('focuses');

// Init Focus Function
export function InitFocusService(router: Router, focuses: Focus[], resolver: DataResolver) {
  var routes:Routes = focuses.map(t => {return { path: t.name, component: t.component, outlet: 'focus', resolve: { value: DataResolver }}});
  var r = router.config.concat(routes);
  router.resetConfig(r);
  return new FocusService(router, resolver);
}


// Module Definition
@NgModule({imports: [CommonModule, CommonFocusModule, RouterModule.forRoot([])], exports: [CommonFocusModule], providers: []})


// Module Export Definition
export class FocusModule {

  // Define Required Modules and Providers
  static forRoot(focuses: Focus[]): ModuleWithProviders {
    return {
      ngModule: FocusModule,
      providers: [
        {provide: Focuses, useValue: focuses},
        {provide: ANALYZE_FOR_ENTRY_COMPONENTS, multi: true, useValue: focuses},
        {provide: FocusService, useFactory: InitFocusService, deps: [Router, Focuses, DataResolver]},
        DataResolver
      ]
    }
  }

}
