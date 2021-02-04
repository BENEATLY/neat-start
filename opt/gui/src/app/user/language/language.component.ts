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
import * as timeLib from '../../../library/functions/time';
import * as routeLib from '../../../library/functions/route';
import * as navigationLib from '../../../library/functions/navigation';


// Component Definition
@Component({selector: 'app-user-language', templateUrl: './language.component.html', styleUrls: ['./language.component.css']})


// Component Export Definition
export class UserLanguageComponent implements OnInit {

  // Libraries
  objLib = objLib;
  presentLib = presentLib;
  timeLib = timeLib;
  routeLib = routeLib;
  navigationLib = navigationLib;


  // Constructor
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public modalService: ModalService, public focusService: FocusService, public appConfig: AppConfig, private snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  ngOnInit() { }

}
