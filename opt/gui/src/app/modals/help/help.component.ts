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
import { ModalService } from '../../../modal/services/modal.service';
import { FocusService } from '../../../focus/services/focus.service';

// Imports: Config Loaders
import { AppConfig } from '../../app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '../../../library/functions/object';
import * as fileLib from '../../../library/functions/file';
import * as focusLib from '../../../library/functions/focus';
import * as presentLib from '../../../library/functions/presentation';
import * as translateLib from '../../../library/functions/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-help-modal', templateUrl: 'help.component.html'})


// Component Export Definition
export class HelpModalComponent implements OnInit {

  // Libraries
  objLib = objLib;
  fileLib = fileLib;
  focusLib = focusLib;
  presentLib = presentLib;
  translateLib = translateLib;

  // Constants: Modal Default
  meta;


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, public focusService: FocusService, private snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Get the Passed Values
    let meta = this.modalService.getValue();

    // Is Object
    if (objLib.getKeys(meta).includes('object')) {
      meta.title = translate.instant('common.label.help', {'propertyName': translate.instant(translateLib.constructSP(meta.object.name, 1))});
    }

    // Assign to Variables
    this.meta = meta;

  }

  // Page Initialisation
  ngOnInit() { }

}
