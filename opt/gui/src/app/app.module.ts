/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Required
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

// Imports: Dependents
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { RouterModalModule } from '../modal/router-modal.module';
import { RouterFocusModule } from '../focus/router-focus.module';
import { SafePipe } from './safe.pipe';
import { VarDirective } from './ngvar.directive';

// Imports: Visualisation
import { AmChartsService } from "@amcharts/amcharts3-angular";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMapboxGLModule } from 'ngx-mapbox-gl';

// Imports: Translation
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateMessageFormatCompiler, MESSAGE_FORMAT_CONFIG } from 'ngx-translate-messageformat-compiler';

// Imports: Default
import { AppComponent } from './app.component';

// Imports: Project
import * as appDefComponents from './app.def.components';
import * as appDefConfigs from './app.def.configs';
import * as appDefFunctions from './app.def.functions';
import * as appDefModals from './app.def.modals';
import * as appDefFocuses from './app.def.focuses';
import * as appDefServices from './app.def.services';
import * as appDefFormatters from './app.def.formatters';


// Module Definition
@NgModule({
  declarations: [

    // Dependents
    SafePipe,
    VarDirective,

    // Default
    AppComponent,
    ...appDefComponents.componentImportsList

  ],
  imports: [

    // Required
    AppRoutingModule,
    BrowserModule,

    // Dependents
    HttpClientModule,

    // Modals
    RouterModalModule.forRoot(appDefModals.modalImportsList),

    // Focuses
    RouterFocusModule.forRoot(appDefFocuses.focusImportsList),

    // Translation
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      compiler: {
          provide: TranslateCompiler,
          useClass: TranslateMessageFormatCompiler
      }
    }),

    // Visualisation
    BrowserAnimationsModule,
    FormsModule,
    MatSnackBarModule,
    ReactiveFormsModule,
    NgxMapboxGLModule.withConfig({
      accessToken: 'mapbox-access-token',
      geocoderAccessToken: 'mapbox-geocoder'
    })

  ],
  providers: [

    // Initialisers
    {
      provide: APP_INITIALIZER,
      useFactory: appDefFunctions.functionImportsDict['initConfig'],
      deps: [appDefConfigs.configImportsDict['AppConfig']],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appDefFunctions.functionImportsDict['initUserData'],
      deps: [appDefServices.serviceImportsDict['DataService']],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appDefFunctions.functionImportsDict['initRoutes'],
      deps: [appDefServices.serviceImportsDict['DataService']],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appDefFunctions.functionImportsDict['initTimezone'],
      deps: [appDefServices.serviceImportsDict['TimezoneService']],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appDefFunctions.functionImportsDict['initTranslation'],
      deps: [appDefServices.serviceImportsDict['TranslationService']],
      multi: true
    },

    // Dependents
    CookieService,

    // Translation
    {
      provide: MESSAGE_FORMAT_CONFIG,
      useValue: {
        biDiSupport: true,
        formatters: appDefFormatters.formatterDict
      }
    },

    // Visualisation
    AmChartsService,

    // Custom Services
    ...appDefServices.serviceImportsList,

    // Config Loaders
    ...appDefConfigs.configImportsList

  ],

  // Bootstrap
  bootstrap: [AppComponent],

  // Entry Components
  entryComponents: appDefComponents.componentImportsList

})


// Class Export Definition
export class AppModule {}


// Required for AOT Compilation
export function HttpLoaderFactory(http: HttpClient) { return new TranslateHttpLoader(http, './assets/translations/', '.json'); }
