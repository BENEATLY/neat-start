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
import * as mapLib from "../../../library/functions/map";
import * as presentLib from '../../../library/functions/presentation';
import * as objLib from '../../../library/functions/object';
import * as fileLib from '../../../library/functions/file';
import * as focusLib from '../../../library/functions/focus';
import * as timeLib from '../../../library/functions/time';
import * as routeLib from '../../../library/functions/route';
import * as navigationLib from '../../../library/functions/navigation';


// Component Definition
@Component({selector: 'app-user-timezone', templateUrl: './timezone.component.html', styleUrls: ['./timezone.component.css']})


// Component Export Definition
export class UserTimezoneComponent implements OnInit {

  // Libraries
  presentLib = presentLib;
  objLib = objLib;
  mapLib = mapLib;
  fileLib = fileLib;
  focusLib = focusLib;
  timeLib = timeLib;
  routeLib = routeLib;
  navigationLib = navigationLib;

  // Translation Properties (Configurable)
  translationProperties = ['user.timezone.location', 'user.timezone.timezone', 'user.timezone.time', 'user.timezone.locale'];
  valueProperties = [];

  // MapBox Map (Non-Configurable)
  map = null;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public modalService: ModalService, public focusService: FocusService, public appConfig: AppConfig, private snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Value Properties
    this.valueProperties = [this.timezone.location, this.timezone.timeZone, ('UTC' + (this.timezone.utcOffset>=0?'+':'') + (this.timezone.utcOffset / 60).toString()), this.timezone.locale];

  }


  // Page Initialisation
  async ngOnInit() {

    // Initialise Map
    let map = {
      "style": "mapbox://styles/tdha/ckc29zf7o25yg1imnuaqzhsq5",
      "zoom": 3,
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

}
