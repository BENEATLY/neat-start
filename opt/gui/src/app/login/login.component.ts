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

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as routeLib from '../../library/functions/route';
import * as presentLib from '../../library/functions/presentation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-login', templateUrl: './login.component.html', styleUrls: ['./login.component.css']})


// Component Export Definition
export class LogInComponent implements OnInit {

  // Libraries
  routeLib = routeLib;
  presentLib = presentLib;

  // jQuery
  jquery = $;

  // Login Limitations (Configurable)
  MaxUserNameLength = 20;
  MaxPasswordLength = 40;
  userName = '';
  password = '';

  // Application Info
  appLogo = '';


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public modalService: ModalService, public focusService: FocusService, public appConfig: AppConfig, private snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

    // Get App Logo
    this.appLogo = presentLib.getAppLogo(this.appConfig.config);

  }


  // Page Initialisation
  ngOnInit() { }


  // Log In Submit Disabled
  logInSubmitDisabled() { return ((this.userName.length == 0) || (this.password.length == 0)); }

  // Perform Log In Attempt
  logInAttempt() {

    // Store Initials Locally
    this.cookieService.set('initials', this.userName, 9999);

    // Define API Authentication (Basic Auth)
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Basic " + btoa(this.userName + ':' + this.password)});

    // Perform Log In API Call
    this.http.get(`${this.appConfig.config['apiRootUrl']}login`, { headers }).subscribe(

      // Successful Authentication
      res => {

        // Authentication Successful
        if (res['authentication']) {

          // Dismiss Snackbar
          this.snackBar.dismiss();

          // Store Token
          this.cookieService.set('token', res['token'], res['expiryDate']);

          // Trigger Log In
          $('#update-required').trigger("login");

        }

        // Missing Info in Response
        else {

          // Logon Error Snackbar
          this.snackBar.logonError(this.translate, this.cookieService, this.router, 'bottom');

        }
      },

      // Failed Authentication
      err => {

        // Invalid Credentials Snackbar
        this.snackBar.invalidCredentials(this.translate, this.cookieService, this.router, 'bottom');

      }

    );

  }

}
