/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Default
import { Component, OnInit, VERSION } from '@angular/core';
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
import * as fileLib from '../../../library/functions/file';
import * as focusLib from '../../../library/functions/focus';
import * as timeLib from '../../../library/functions/time';
import * as routeLib from '../../../library/functions/route';
import * as navigationLib from '../../../library/functions/navigation';
import * as presentLib from '../../../library/functions/presentation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-settings-version', templateUrl: './version.component.html', styleUrls: ['./version.component.css']})


// Component Export Definition
export class SettingsVersionComponent implements OnInit {

  // Libraries
  objLib = objLib;
  fileLib = fileLib;
  focusLib = focusLib;
  timeLib = timeLib;
  routeLib = routeLib;
  navigationLib = navigationLib;
  presentLib = presentLib;

  // jQuery
  jquery = $;

  // Versions
  results = [];


  // Component Definition
  constructor(public router: Router, public route: ActivatedRoute, public data: DataService, public http: HttpClient, public cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, public focusService: FocusService, public snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Select Correct Navbar Item (Default)
    this.data.flagNewPath(this.route.snapshot.url);

  }


  // Page Initialisation
  async ngOnInit() {

    // Update Results
    await this.update();

  }

  // Update Results
  update() {

    return new Promise(
      (resolve, reject) => {

        // Define API Authentication
        let token = this.cookieService.get('token');
        let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

        // Get API Version Info
        this.http.get(`${this.appConfig.config['apiRootUrl']}version/all`, {}).subscribe(

          // Success
          (res: any[]) => {

            // Store Versions
            let versions = res;

            // Store Results
            this.results = [
              {'icon': '/assets/svgs/network-wired.svg', 'background': 'linear-gradient(90deg, rgba(51,57,124,1) 0%, rgba(102,36,131,1) 100%)', 'name': 'common.version.api', 'version': versions['api']},
              {'icon': '/assets/svgs/angular.svg', 'background': 'linear-gradient(90deg, rgba(161,37,44,1) 0%, rgba(212,86,81,1) 100%)', 'name': 'common.version.angular', 'version': VERSION.full},
              {'icon': '/assets/svgs/network.svg', 'background': 'linear-gradient(90deg, rgb(61, 67, 64) 0%, rgb(102, 100, 111) 100%)', 'name': 'common.version.messaging', 'version': versions['messaging']},
              {'icon': '/assets/svgs/nginx.svg', 'background': 'linear-gradient(90deg, rgba(41,137,64,1) 0%, rgba(52,186,81,1) 100%)', 'name': 'common.version.webserver', 'version': versions['webserver']},
              {'icon': '/assets/svgs/screen.svg', 'background': 'linear-gradient(90deg, rgb(111, 57, 114) 0%, rgb(182, 76, 181) 100%)', 'name': 'common.version.gui', 'version': this.appConfig.config['version']},
              {'icon': '/assets/svgs/python.svg', 'background': 'linear-gradient(90deg, rgb(61, 117, 114) 0%, rgb(82, 176, 161) 100%)', 'name': 'common.version.python', 'version': versions['python']},
              {'icon': '/assets/svgs/database-2.svg', 'background': 'linear-gradient(90deg, rgb(51, 57, 124) 0%, rgb(72, 76, 171) 100%)', 'name': 'common.version.database', 'version': versions['db']}
            ];

            // Resolve
            resolve(true);


          },

          // Fail
          err => {

            // Error Occurred
            this.snackBar.httpErrorOccurred(err);

            // Resolve
            resolve(true);

          }

        );

      }
    );

  }

}
