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
import * as presentLib from '../../../library/functions/presentation';
import * as rightLib from '../../../library/functions/right';
import * as sortLib from '../../../library/functions/sort';
import * as valLib from '../../../library/functions/validate';
import * as listLib from '../../../library/functions/list';
import * as formLib from '../../../library/functions/form';
import * as formatLib from '../../../library/functions/format';
import * as fileLib from '../../../library/functions/file';
import * as pageLib from '../../../library/functions/page';
import * as filterLib from '../../../library/functions/filter';
import * as dataLib from '../../../library/functions/data';
import * as timeLib from '../../../library/functions/time';
import * as routeLib from '../../../library/functions/route';
import * as navigationLib from '../../../library/functions/navigation';
import * as translateLib from '../../../library/functions/translate';
import * as definitionsLib from '../../../library/functions/definitions';
import * as modalLib from '../../../library/functions/modal';
import * as focusLib from '../../../library/functions/focus';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-settings-right', templateUrl: './right.component.html', styleUrls: ['./right.component.css']})


// Component Export Definition
export class SettingsRightComponent implements OnInit {

  // Libraries
  objLib = objLib;
  presentLib = presentLib;
  rightLib = rightLib;
  sortLib = sortLib;
  valLib = valLib;
  listLib = listLib;
  formLib = formLib;
  formatLib = formatLib;
  fileLib = fileLib;
  pageLib = pageLib;
  filterLib = filterLib;
  dataLib = dataLib;
  timeLib = timeLib;
  routeLib = routeLib;
  navigationLib = navigationLib;
  translateLib = translateLib;
  definitionsLib = definitionsLib;
  modalLib = modalLib;
  focusLib = focusLib;

  // jQuery
  jquery = $;

  // Object Definitions (Non-Configurable)
  objectName = 'Right';
  objectDefinition = 'Right';

  // Results (Non-Configurable)
  resultInfo = {'model': null};

  // Table Columns (Non-Configurable)
  columns = {'model': {}};

  // Access Level (Non-Configurable)
  accessLevel = {'selected': null, 'options': []};
  disabledLevel = [];

  // Sorting (Non-Configurable)
  sortingArray = {'model': {'attr': null, 'order': true}};

  // Filtering (Non-Configurable)
  filterArray = {
    'model': [
      {
        'property': [null],
        'comparator': null,
        'ref': null,
        'object': [this.objectDefinition],
        'lastProperty': null
      }
    ]
  };
  filterState = {'applied': true, 'lastFilter': null};
  filterPanel = {'model': false};

  // Pages (Non-Configurable)
  pageInfo = {'model': {'page': 1, 'perPage': 50, 'maxPage': 1, 'total': null}};

  // Display Options (Non-Configurable)
  displayOptions = {};

  // Passed Parameters
  passedParameters = [];

  // CRUD Options (Non-Configurable)
  crudOptions = {};

  // Custom Modal Libraries (Non-Configurable)
  modalLibs = {};

  // Selected Right (Non-Configurable)
  selected = {'model': null};


  // Component Definition
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, public focusService: FocusService, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Route Allowed?
    if (!rightLib.sufficientRights(this.data.userData.right, 'Right', 'Edit', 'all')) { this.router.navigate([`dashboard`]); }

    // Set Access Level
    this.accessLevel = definitionsLib.createViewList(this.appConfig.config, this.data.userData.right, 'Get List', this.objectDefinition, this.disabledLevel);

    // Get Result ID
    this.route.params.subscribe( params => { this.passedParameters = routeLib.getRouteParameters(params); });

  }


  // Page Initialisation
  ngOnInit() {

    // Add Filtering for Passed Parameters
    routeLib.addPassedParameterFiltering(this.appConfig.config, this.data.userData.right, 'Get List', this.objectDefinition, this.passedParameters, this.filterArray, 'model');

    // Update Results
    this.update();

    // Update Hook
    $('#update-required').on("update", () => { this.update(); });

  }

  // Update Results
  async update() {

    // Get Page Info
    dataLib.getPageInfo(this.appConfig.config, this.data.userData, 'model', this.objectDefinition, this.columns, this.pageInfo, this.resultInfo, this.accessLevel, this.sortingArray, this.filterArray, this.filterState, this.displayOptions, this.timezone, this.snackBar, this.cookieService, this.http);

  }

}
