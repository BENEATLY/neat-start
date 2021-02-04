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
import * as fileLib from '../../../library/functions/file';
import * as modalLib from '../../../library/functions/modal';
import * as focusLib from '../../../library/functions/focus';
import * as timeLib from '../../../library/functions/time';
import * as objLib from '../../../library/functions/object';
import * as valLib from '../../../library/functions/validate';
import * as sslLib from '../../../library/functions/ssl';
import * as routeLib from '../../../library/functions/route';
import * as navigationLib from '../../../library/functions/navigation';
import * as presentLib from '../../../library/functions/presentation';
import * as rightLib from '../../../library/functions/right';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-settings-ssl', templateUrl: './ssl.component.html', styleUrls: ['./ssl.component.css']})


// Component Export Definition
export class SettingsSSLComponent implements OnInit {

  // Libraries
  fileLib = fileLib;
  modalLib = modalLib;
  focusLib = focusLib;
  timeLib = timeLib;
  objLib = objLib;
  valLib = valLib;
  sslLib = sslLib;
  routeLib = routeLib;
  navigationLib = navigationLib;
  presentLib = presentLib;
  rightLib = rightLib;

  // jQuery
  jquery = $;

  // SSL Info (Non-Configurable)
  sslInfo = {} as any;

  // Translation Properties (Configurable)
  translationProperties = ['common.ssl.activeprotocol.api', 'common.ssl.activeprotocol.gui', 'common.ssl.hasssl', 'common.ssl.certificate', 'common.ssl.key', 'common.ssl.issuer.organisation', 'common.ssl.issuer.location', 'common.ssl.expirydate'];

  // Greeting Properties
  greetingTitle = '';


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

  }


  // Page Initialisation
  ngOnInit() {

    // Update Results
    this.update();

    // Update Hook
    $('#update-required').on("update", () => { this.update(); });

  }

  // Update Results
  async update() {

    // Define API Authentication
    let token = this.cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // SSL Check
    let sslInfo = await sslLib.sslCheck(this.appConfig.config, this.data.userData, this.translate, this.http, this.snackBar, this.cookieService, this.router, 'double-header');
    this.sslInfo = sslInfo;

    // Generate Greeting Title
    this.greetingTitle = this.translate.instant(sslLib.generateSSLGreeting(this.appConfig.config, sslInfo), {'info': this.data.userData.info});

  }

}
