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
import { DataService } from '../data.service';
import { TimezoneService } from '../timezone.service';
import { TranslationService } from '../translation.service';
import { SnackBarService } from '../snackbar.service';
import { ModalService } from '../../modal/services/modal.service';
import { FocusService } from '../../focus/services/focus.service';

// Imports: Config Loaders
import { AppConfig } from '../app.config';

// Imports: Visualisation
import { AmChartsService, AmChart } from "@amcharts/amcharts3-angular";

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '../../library/functions/object';
import * as rightLib from '../../library/functions/right';
import * as presentLib from '../../library/functions/presentation';
import * as sslLib from '../../library/functions/ssl';
import * as fileLib from '../../library/functions/file';
import * as modalLib from '../../library/functions/modal';
import * as focusLib from '../../library/functions/focus';
import * as timeLib from '../../library/functions/time';
import * as routeLib from '../../library/functions/route';
import * as navigationLib from '../../library/functions/navigation';
import * as translateLib from '../../library/functions/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-dashboard', templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.css']})


// Component Export Definition
export class DashboardComponent implements OnInit {

  // Libraries
  objLib = objLib;
  rightLib = rightLib;
  presentLib = presentLib;
  sslLib = sslLib;
  fileLib = fileLib;
  modalLib = modalLib;
  focusLib = focusLib;
  timeLib = timeLib;
  routeLib = routeLib;
  navigationLib = navigationLib;
  translateLib = translateLib;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, public focusService: FocusService, private snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  async ngOnInit() {

    // SSL Check
    let sslInfo = await sslLib.sslCheck(this.appConfig.config, this.data.userData, this.translate, this.http, this.snackBar, this.cookieService, this.router, 'double-header');

  }

}
