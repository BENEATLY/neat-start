/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


import { ModuleWithProviders, APP_INITIALIZER, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { RouteFetchService } from './routing.service';

// Imports: Required
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';


// Module Definition
@NgModule({
  imports: [RouterModule.forRoot([])],
  exports: [RouterModule],
    providers: [
        RouteFetchService,
        { provide: APP_INITIALIZER, useFactory: routeFetchFactory, deps: [Injector, RouteFetchService], multi: true }
    ]
})

// Component Export Definition
export class AppRoutingModule {
  constructor(private routeFetch: RouteFetchService) {}
}

// Fetch Routes
export function routeFetchFactory(injector: Injector, routeFetchService: RouteFetchService) {
  return () => {
    return routeFetchService.loadRoutes().then(
      res => {
        var router: Router = injector.get(Router);
        router.resetConfig(routeFetchService.routes);
      }
    );
  }
}
