/*
  Author:     Thomas D'haenens
  Created:    22/05/2020 21:33
  License:    GPLv3
*/


// Imports: Required
import { Injectable } from '@angular/core';

// Imports: Default
import { CookieService } from 'ngx-cookie-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// Imports: Config Loaders
import { AppConfig } from './app.config';


// Class Export Definition
@Injectable()
export class TranslationService {

  // Define Properties
  private defaultLocale: string = 'en-US';
  public translationOptions = [];
  public translation = null;
  public translationContent = {};


  // Constructor
  constructor(private http: HttpClient, private cookieService: CookieService, public appConfig: AppConfig) {}


  // Set Preference
  setPreference(translation) {

    // Set Current Translation
    this.translation = translation;

    // Store Cookie to Store Language Preference
    this.cookieService.set('langPref', translation.locale, 9999);

    // Get Translation Content
    this.http.get('./assets/translations/' + translation.translationFile + '.json').subscribe(
      (translationContent: any) => {

        // Set Translation Content
        this.translationContent = translationContent;

      }
    );

    // Reload Window
    location.reload();

  }

  // Is Active Translation?
  isActiveTranslation(translation) { return (this.translation.id == translation.id); }

  // Load Translation
  public loadTranslation() {
    return new Promise(
      (resolve, reject) => {

        // Get Config
        this.http.get('./assets/config.json').subscribe(
          (config: any) => {

            // Get Translations
            this.http.get(`${config['apiRootUrl']}` + 'translation/available').subscribe(
              (options: any) => {

                // Get Locale
                let locale = (window.navigator['userLanguage'] || window.navigator.language);

                // Get Translation Options
                this.translationOptions = options;

                // Check if Cookie Preference was Set
                let langPref = this.cookieService.get('langPref');
                if (langPref.length > 0) {

                  // Get Translation
                  let translation = options.filter(trans => (trans.locale.toLowerCase() == langPref.toLowerCase()));
                  if (translation.length == 1) {

                    // Set Translation
                    this.translation = translation[0];

                    // Get Translation Content
                    this.http.get('./assets/translations/' + translation[0].translationFile + '.json').subscribe(
                      (translationContent: any) => {

                        // Set Translation Content
                        this.translationContent = translationContent;

                        // Resolve
                        resolve(true);

                      }
                    );

                  }
                  else {

                    // Set Translation
                    let translation = options.filter(trans => (trans.locale.toLowerCase() == this.defaultLocale.toLowerCase()))[0];
                    this.translation = translation;
                    this.cookieService.delete('langPref');

                    // Get Translation Content
                    this.http.get('./assets/translations/' + translation.translationFile + '.json').subscribe(
                      (translationContent: any) => {

                        // Set Translation Content
                        this.translationContent = translationContent;

                        // Resolve
                        resolve(true);

                      }
                    );

                  }

                }
                else {

                  // Get Translation
                  let translation = options.filter(trans => (trans.locale.toLowerCase() == locale.toLowerCase()));
                  if (translation.length == 1) {

                    // Set Translation
                    this.translation = translation[0];

                    // Get Translation Content
                    this.http.get('./assets/translations/' + translation[0].translationFile + '.json').subscribe(
                      (translationContent: any) => {

                        // Set Translation Content
                        this.translationContent = translationContent;

                        // Resolve
                        resolve(true);

                      }
                    );

                  }
                  else {

                    // Set Translation
                    let translation = options.filter(trans => (trans.locale.toLowerCase() == this.defaultLocale.toLowerCase()))[0];
                    this.translation = translation;

                    // Get Translation Content
                    this.http.get('./assets/translations/' + translation.translationFile + '.json').subscribe(
                      (translationContent: any) => {

                        // Set Translation Content
                        this.translationContent = translationContent;

                        // Resolve
                        resolve(true);

                      }
                    );

                  }

                }

              },
              err => {

                // No Translation Found
                console.error('No translation found!');

                // Resolve
                resolve(true);

              }
            );

          }
        );

      }
    );

  }

}
