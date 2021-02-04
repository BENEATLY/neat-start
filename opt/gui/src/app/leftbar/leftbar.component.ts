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

// Imports: Config Loaders
import { AppConfig } from '../app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '../../library/functions/object';
import * as navigationLib from '../../library/functions/navigation';


// Component Definition
@Component({selector: 'app-leftbar', templateUrl: './leftbar.component.html', styleUrls: ['./leftbar.component.css']})


// Component Export Definition
export class LeftBarComponent implements OnInit {

  // Libraries
  objLib = objLib;
  navigationLib = navigationLib;

  // Path (Non-Configurable)
  shortPath: string;
  fullPath: string;

  // Navigation (Non-Configurable)
  navigation = null;
  leftNavigation = null;

  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public modalService: ModalService, public appConfig: AppConfig, private snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Get Path & Navigation Info (Default)
    this.data.shortPath.subscribe(
      shortPath => {
        this.shortPath = shortPath;
        this.navigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData.right, 'leftbar', shortPath);
      }
    );
    this.data.fullPath.subscribe(fullPath => this.fullPath = fullPath);
    this.data.leftNavigation.subscribe(leftNavigation => this.leftNavigation = leftNavigation);

    // Get Navigation
    this.navigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData.right, 'leftbar', this.shortPath);

  }


  // Page Initialisation
  ngOnInit() {

    // Show Credit Footer
    this.showCreditFooter();

  }


  // Show Credit Footer
  showCreditFooter() {
    if (document.getElementsByClassName('footercreditcontent').length > 0) {
      if (window.scrollY >= (document.getElementsByClassName('app-wrapper')[0].scrollHeight - window.innerHeight - 2)) {
        let credits = document.getElementsByClassName('footercreditcontent')[0] as HTMLElement;
        credits.style.visibility = 'visible';
        credits.style.opacity = '1.0';
      }
      else {
        let credits = document.getElementsByClassName('footercreditcontent')[0] as HTMLElement;
        credits.style.visibility = 'hidden';
        credits.style.opacity = '0.0';
      }
    }
  }

}
