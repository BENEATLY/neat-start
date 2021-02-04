/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Required
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// Imports: Default
import { CookieService } from 'ngx-cookie-service';
import { HttpClient, HttpHeaders } from '@angular/common/http';


// Class Export Definition
@Injectable()
export class DataService {

  // Define Private Sources
  private shortPathSource = new BehaviorSubject<string>('');
  private fullPathSource = new BehaviorSubject<string>('');
  private leftNavigationSource = new BehaviorSubject<boolean>(true);

  // Define Observables
  public shortPath = this.shortPathSource.asObservable();
  public fullPath = this.fullPathSource.asObservable();
  public leftNavigation = this.leftNavigationSource.asObservable();

  // Define Properties
  public userData = {'info': {}, 'right': {}};
  public routes = {'routes': [], 'linked': {}, 'options': {}};


  // Constructor
  constructor(private http: HttpClient, private cookieService: CookieService) { }


  // Get Data
  getData(...args: any[]) {
    if (args.length == 0) { return null; }
    else {
      let val = this;
      for(var i in args) { val = val[args[i]]; }
      return val;
    }
  }

  // Flag New Path URL
  flagNewPath(url: any) {
    this.shortPathSource.next(url[0].path);
    this.fullPathSource.next(url.map(url => url.path).join('/'));
  }

  // Flag New Left Navigation Bar Expand State
  flagLeftNavBarExpand(state: boolean) {
    this.leftNavigationSource.next(state);
  }

  // Load User Data
  loadUser() {
    return new Promise(
      (resolve, reject) => {

        // Get Config
        this.http.get('./assets/config.json').subscribe(
          (config: any) => {

            // Define API Authentication
            let token = this.cookieService.get('token');
            let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

            // Fetch User Data (Info & Right)
            this.http.get(`${config.apiRootUrl}token`, { headers }).subscribe(
              (res: any[]) => {

                // Store User Info
                this.userData.info = res;

                // Fetch User Right
                this.http.get(`${config.apiRootUrl}right/list&self`, { headers }).subscribe(

                  // Store User Right
                  (res: any[]) => { this.userData.right = res; resolve(true); },

                  // No User Right
                  err => { this.userData.right = {}; resolve(true); }

                );

              },
              err => {

                // No User Data
                this.userData.info = {};
                this.userData.right = {};

                // Resolve
                resolve(true);

              }
            );

          }
        );

      }
    );
  }

  // Load Routes
  loadRoutes() {
    return new Promise(
      (resolve, reject) => {

        this.http.get('./assets/routes/routes.json').subscribe(
          (config: any) => {

            // Store Route Info
            this.routes.routes = config['routes'];
            this.routes.linked = config['linked'];
            this.routes.options = config['options'];

            // Resolve
            resolve(true);

          },
          err => {

            // No Route Info
            this.routes = {'routes': [], 'linked': {}, 'options': {}};

            // Resolve
            resolve(true);

          }
        );

      }
    );
  }

}
