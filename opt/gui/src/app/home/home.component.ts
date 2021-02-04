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
import { trigger, style, state, transition, animate, keyframes } from '@angular/animations';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as fileLib from '../../library/functions/file';
import * as modalLib from '../../library/functions/modal';
import * as focusLib from '../../library/functions/focus';
import * as objLib from '../../library/functions/object';
import * as translateLib from '../../library/functions/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-home', templateUrl: './home.component.html', styleUrls: ['./home.component.css']})


// Component Export Definition
export class HomeComponent implements OnInit {

  // Libraries
  fileLib = fileLib;
  modalLib = modalLib;
  focusLib = focusLib;
  objLib = objLib;
  translateLib = translateLib;


  // Background Video (Configurable)
  videoLink = 'assets/backgrounds/Traffic.mp4';


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public modalService: ModalService, public focusService: FocusService, private snackBar: SnackBarService, public appConfig: AppConfig, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  ngOnInit() {

    // Reload Page on Log Out
    if (this.cookieService.get('logout').length > 0) {
      this.cookieService.delete('logout');
      this.cookieService.delete('token');
      this.snackBar.loggedOut(this.translate, this.cookieService, this.router, 'bottom');
    }

    // Play & Replay Backgroud Video (avoid Promise Error)
    let element = document.getElementById('video-background') as HTMLVideoElement;
    element.muted = true;
    element.currentTime = 1;
    element.pause();
    setTimeout(function() { element.play(); }, 150);
    setInterval(function() { element.currentTime = 0; }, 36000);

  }

}
