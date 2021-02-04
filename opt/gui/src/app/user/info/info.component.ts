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
import * as definitionsLib from '../../../library/functions/definitions';
import * as rightLib from '../../../library/functions/right';
import * as formatLib from '../../../library/functions/format';
import * as fileLib from '../../../library/functions/file';
import * as presentLib from '../../../library/functions/presentation';
import * as valLib from '../../../library/functions/validate';
import * as mapLib from '../../../library/functions/map';
import * as dataLib from '../../../library/functions/data';
import * as modalLib from '../../../library/functions/modal';
import * as focusLib from '../../../library/functions/focus';
import * as objLib from '../../../library/functions/object';
import * as timeLib from '../../../library/functions/time';
import * as routeLib from '../../../library/functions/route';
import * as navigationLib from '../../../library/functions/navigation';
import * as translateLib from '../../../library/functions/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-user-info', templateUrl: './info.component.html', styleUrls: ['./info.component.css']})


// Component Export Definition
export class UserInfoComponent implements OnInit {

  // Libraries
  definitionsLib = definitionsLib;
  rightLib = rightLib;
  formatLib = formatLib;
  fileLib = fileLib;
  presentLib = presentLib;
  valLib = valLib;
  mapLib = mapLib;
  dataLib = dataLib;
  modalLib = modalLib;
  focusLib = focusLib;
  objLib = objLib;
  timeLib = timeLib;
  routeLib = routeLib;
  navigationLib = navigationLib;
  translateLib = translateLib;

  // jQuery
  jquery = $;

  // Object Definitions (Non-Configurable)
  objectName = 'User';
  objectDefinition = 'User';

  // Results (Non-Configurable)
  resultInfo = {'activesession': null};

  // Display Options (Non-Configurable)
  displayOptions = {'model': {'level': 'own'}};

  // Custom Modal Libraries (Non-Configurable)
  modalLibs = {};

  // Translation Properties (Configurable)
  translationProperties = [];

  // Greeting Properties
  greetingType = 'polite';
  greetingTitle = '';

  // MapBox Map (Non-Configurable)
  map = null;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public modalService: ModalService, public focusService: FocusService, public appConfig: AppConfig, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Route Allowed?
    if (!rightLib.sufficientRights(this.data.userData.right, 'User', 'Get List', 'own')) { this.router.navigate([`dashboard`]); }

  }


  // Page Initialisation
  async ngOnInit() {

    // Generate Greeting Title
    this.greetingTitle = this.translate.instant(presentLib.generateGreeting(this.greetingType, this.translation, timeLib.getNow()), {'info': this.data.userData.info});

    // Construct Translation Properties
    this.translationProperties = translateLib.constructTranslationProperties(this.appConfig.config, this.data.userData.right, this.objectDefinition, this.objectDefinition, 'Get List', 'model', this.displayOptions, this.translate);

    // Update Hook
    $('#update-required').on("update", () => { this.reloadConfig(); });

    // Get Page Info
    dataLib.getPageInfo(this.appConfig.config, this.data.userData, 'activesession', 'ActiveSession', dataLib.defaultColumns('activesession'), dataLib.defaultPageInfo('activesession', 21), this.resultInfo, null, dataLib.defaultSortingArray('activesession'), dataLib.defaultFilterArray('activesession', this.objectDefinition), dataLib.defaultFilterState(), {'activesession': {'level': 'own'}}, this.timezone, this.snackBar, this.cookieService, this.http);

    // Initialise Map
    let map = {
      "style": "mapbox://styles/tdha/ckc29zf7o25yg1imnuaqzhsq5",
      "zoom": 2,
      "center": await mapLib.findLocationCenterPoint(this.timezone.location, this.http),
      "minzoom": 1,
      "maxzoom": 10,
      "layer": [
        {
          "name": "timezone",
          "type": "fill",
          "layout": {},
          "paint": {"fill-color": "#222", "fill-opacity": 0.5},
          "source": {
            "type": "geojson",
            "data": await mapLib.determineTimezoneContoursByLocation(this.timezone.location, this.http, true)
          }
        },
        {
          "name": "current-location",
          "type": "fill",
          "layout": {},
          "paint": {"fill-color": "#272e64", "fill-opacity": 0.8},
          "source": {
            "type": "geojson",
            "data": await mapLib.determineTimezoneContoursByLocation(this.timezone.location, this.http, false)
          }
        }
      ]
    };

    // Assign to Map & Add Map Load
    this.map = mapLib.addMapLoad(map);

    // Map Load Listener
    let listener = setInterval(
      () => {

        // Verify Map Loading Progress
        mapLib.verifyMapLoad(this.map, listener);

      }
    , 500);

  }

  // Reload Config
  async reloadConfig() {

    // Load New Config
    await this.appConfig.load();

    // Reload
    location.reload(true);

  }

}
