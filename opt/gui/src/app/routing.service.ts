/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Required
import { Injectable } from '@angular/core';

// Imports: Default
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DashboardComponent } from './dashboard/dashboard.component';

// Imports: Project
import * as appDefComponents from './app.def.components';


// Class Export Definition
@Injectable()
export class RouteFetchService {

  // Define Properties
  public routes = [];


  // Constructor
  constructor(private http: HttpClient) { }


  // Create Item Parameter Nav Path
  createItemParameterNavPath(path, nrs, id, prev = null, fixedRef = null) {
    let newPath = path;
    for (let nr of [...Array(nrs).keys()]) {
      newPath = ':item' + (nr+1).toString() + '/:id' + (nr+1).toString() + '/' + newPath;
    }
    if (id) { newPath = newPath + '/:id0'; }
    return (prev?(prev + '/:id999999/'): '') + newPath;
    if (prev) { return (prev + '/:id999999/' + newPath); }
    else if (fixedRef) { return (fixedRef + '/' + newPath); }
    else { return newPath; }
  }

  // Load Routes
  loadRoutes() {
    return new Promise(
      (resolve, reject) => {

        // Get Route Config
        this.http.get('./assets/routes/routes.json').subscribe(
          (config: any) => {

            // Empty Routes
            let routes = [];

            // Iterate over Routes
            for (let route of config.routes.sort(function(a, b) { return (b.path.split('/').length - 1) - (a.path.split('/').length - 1); })) {

              // Fixed Type
              if (route.type == 'fixed') {

                routes.push({ path: route.path, component: appDefComponents.componentImportsDict[route.component] });
                routes.push({ path: route.path + '/:id0', redirectTo: route.path, pathMatch: 'full' });

              }

              // Fixed Reference Type
              else if (route.type == 'fixed-ref') {

                routes.push({ path: route.path, component: appDefComponents.componentImportsDict[route.component] });

              }

              // Item Type
              else if (route.type == 'item') {

                routes.push({ path: route.path, component: appDefComponents.componentImportsDict[route.component] });
                routes.push({ path: route.path + '/:id0', component: appDefComponents.componentImportsDict[route.component] });

                // Exotic Path
                let specialRoutes = config.routes.filter(rout => ((rout.type == 'item') && (rout.path != route.path) && (rout.path.includes('/')) && (!route.path.includes('/')))).map(rout => rout.path);
                for (var i=0; i<=config.options.maxSubNav; i++) {
                  for (let specialRoute of specialRoutes) {
                    routes.push({ path: this.createItemParameterNavPath(route.path, i, false, specialRoute, null), component: appDefComponents.componentImportsDict[route.component] });
                    routes.push({ path: this.createItemParameterNavPath(route.path, i, true, specialRoute, null), component: appDefComponents.componentImportsDict[route.component] });
                  }
                }

                // Fixed Reference Routes
                let fixedRefRoutes = config.routes.filter(rout => (rout.type == 'fixed-ref') && (!route.path.includes('/'))).map(rout => rout.path);
                for (var i=0; i<=config.options.maxSubNav; i++) {
                  for (let fixedRefRoute of fixedRefRoutes) {
                    routes.push({ path: this.createItemParameterNavPath(route.path, i, false, null, fixedRefRoute), component: appDefComponents.componentImportsDict[route.component] });
                    routes.push({ path: this.createItemParameterNavPath(route.path, i, true, null, fixedRefRoute), component: appDefComponents.componentImportsDict[route.component] });
                  }
                }

                // Simple Path
                if (!route.path.includes('/')) {
                  for (var i=1; i<=config.options.maxSubNav; i++) {
                    routes.push({ path: this.createItemParameterNavPath(route.path, i, false, null, null), component: appDefComponents.componentImportsDict[route.component] });
                    routes.push({ path: this.createItemParameterNavPath(route.path, i, true, null, null), component: appDefComponents.componentImportsDict[route.component] });
                  }
                }

              }

              // Item List Type
              else if (route.type == 'item-list') {

                routes.push({ path: route.path, component: appDefComponents.componentImportsDict[route.component] });

                // Exotic Path
                let specialRoutes = config.routes.filter(rout => ((rout.type == 'item-list') && (rout.path != route.path) && (rout.path.includes('/')) && (!route.path.includes('/')))).map(rout => rout.path);
                for (var i=0; i<=config.options.maxSubNav; i++) {
                  for (let specialRoute of specialRoutes) {
                    routes.push({ path: this.createItemParameterNavPath(route.path, i, false, specialRoute, null), component: appDefComponents.componentImportsDict[route.component] });
                  }
                }

                // Simple Path
                if (!route.path.includes('/')) {
                  for (var i=1; i<=config.options.maxSubNav; i++) { routes.push({ path: this.createItemParameterNavPath(route.path, i, false, null, null), component: appDefComponents.componentImportsDict[route.component] }); }
                }

              }

              // Item Id Type
              else if (route.type == 'item-id') {

                routes.push({ path: route.path + '/:id0', component: appDefComponents.componentImportsDict[route.component] });

                // Exotic Path
                let specialRoutes = config.routes.filter(rout => ((rout.type == 'item-id') && (rout.path != route.path) && (rout.path.includes('/')) && (!route.path.includes('/')))).map(rout => rout.path);
                for (var i=0; i<=config.options.maxSubNav; i++) {
                  for (let specialRoute of specialRoutes) {
                    routes.push({ path: this.createItemParameterNavPath(route.path, i, true, specialRoute, null), component: appDefComponents.componentImportsDict[route.component] });
                  }
                }

                // Simple Path
                if (!route.path.includes('/')) {
                  for (var i=1; i<=config.options.maxSubNav; i++) { routes.push({ path: this.createItemParameterNavPath(route.path, i, true, null, null), component: appDefComponents.componentImportsDict[route.component] }); }
                }

              }

              // Custom Type
              if (route.type == 'custom') { routes.push({ path: route.path, component: appDefComponents.componentImportsDict[route.component] }); }

            }

            // Iterate over Redirects
            for (let key in config.options.redirects) {

              // Empty Path
              if (key == 'empty') { routes.push({ path: '', redirectTo: config.options.redirects[key], pathMatch: 'full' }); }

              // Unknown Path
              else if (key == 'unknown') { routes.push({ path: '**', redirectTo: config.options.redirects[key] }); }

            }

            // Store Route Info
            this.routes = routes;

            // Resolve
            resolve(true);

          },
          err => {

            // No User Data
            this.routes = [];

            // Resolve
            resolve(true);

          }
        );

      }
    );
  }

}
