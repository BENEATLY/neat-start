/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Default
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

// Imports: Custom Services
import { DataService } from '../../data.service';
import { TimezoneService } from '../../timezone.service';
import { TranslationService } from '../../translation.service';
import { SnackBarService } from '../../snackbar.service';
import { FocusService } from '../../../focus/services/focus.service';

// Imports: Config Loaders
import { AppConfig } from '../../app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '../../../library/functions/object';
import * as valLib from '../../../library/functions/validate';
import * as presentLib from '../../../library/functions/presentation';
import * as fileLib from '../../../library/functions/file';
import * as translateLib from '../../../library/functions/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-image-focus', templateUrl: 'image.component.html'})


// Component Export Definition
export class ImageFocusComponent implements OnInit {

  // Libraries
  objLib = objLib;
  valLib = valLib;
  presentLib = presentLib;
  fileLib = fileLib;
  translateLib = translateLib;

  // Constants: Focus Default
  meta;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public focusService: FocusService, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Get the Passed Values
    this.meta = this.focusService.getValue();

  }

  // Page Initialisation
  ngOnInit() { }

}
