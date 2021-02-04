/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Required
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Imports: Default
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';


// Determine if Production Build is Required
if (environment.production) {
  enableProdMode();
}


// Bootstrap Project
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
