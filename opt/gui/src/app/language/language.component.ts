/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Default
import { HostListener, Component, OnInit } from '@angular/core';
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
import * as routeLib from '../../library/functions/route';


// Component Definition
@Component({selector: 'app-language', templateUrl: './language.component.html', styleUrls: ['./language.component.css']})


// Component Export Definition
export class LanguageComponent implements OnInit {

  // Libraries
  routeLib = routeLib;


  // Host Listener
  @HostListener('window:resize', ['$event'])
  onResize(event) {

    // Resize To Home
    this.resizeToHome(window.innerWidth);

  }


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public modalService: ModalService, public appConfig: AppConfig, private snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  ngOnInit() { }

  // Resize To Home
  resizeToHome(width) {
    if (width > 991) { routeLib.navigate(this.router, 'home'); }
  }

}
