/*
  Author:     Thomas D'haenens
  Created:    19/01/2020 12:22
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
import * as valLib from '../../../library/functions/validate';
import * as strLib from '../../../library/functions/string';
import * as navigationLib from '../../../library/functions/navigation';
import * as presentLib from '../../../library/functions/presentation';
import * as sortLib from '../../../library/functions/sort';
import * as fileLib from '../../../library/functions/file';
import * as focusLib from '../../../library/functions/focus';
import * as modalLib from '../../../library/functions/modal';
import * as translateLib from '../../../library/functions/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-info-modal', templateUrl: 'info.component.html'})


// Component Export Definition
export class InfoModalComponent implements OnInit {

  // Libraries
  objLib = objLib;
  valLib = valLib;
  strLib = strLib;
  navigationLib = navigationLib;
  presentLib = presentLib;
  sortLib = sortLib;
  fileLib = fileLib;
  focusLib = focusLib;
  modalLib = modalLib;
  translateLib = translateLib;

  // jQuery
  jquery = $;

  // Constants: Modal Default
  properties;
  meta;
  item;

  // Custom Modal Libraries (Non-Configurable)
  modalLibs = {};

  // Non-Configurable
  activeTab = 0;
  maximizedProperty = null;
  infoProperty = null;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, public focusService: FocusService, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Get the Passed Values
    let properties = this.modalService.getValue()[0];
    let meta = this.modalService.getValue()[1];

    // Construct Item
    let item = objLib.createItemByProperties(properties);

    // Ignore Properties Defined in Meta
    if (objLib.lookUpKey(meta, 'ignore')) {
      if (valLib.isArray(properties) && valLib.isArray(properties[0])) { properties = properties.map(prop => prop.filter(obj => !meta.ignore.includes(obj.property))); }
      else { properties = properties.filter(obj => !meta.ignore.includes(obj.property)); }
    }

    // Assign to Variables
    this.properties = properties;
    this.meta = meta;
    this.item = item;

  }


  // Page Initialisation
  ngOnInit() {}


}
