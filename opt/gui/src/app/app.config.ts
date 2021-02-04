/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Required
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';


// Class Export Definition
@Injectable()
export class AppConfig {

  // Define Properties
  public config: Object = null;


  // Constructor
  constructor(private http: HttpClient) { }


  // Get Config by Key
  public getConfig(key: any) { return this.config[key]; }

  // Get All Config
  public getAllConfig() { return this.config; }

  // Load Config
  public load() {
    return new Promise(
      (resolve, reject) => {

        // Get Config
        this.http.get('./assets/config.json').subscribe(
          (res: any) => { this.config = res; resolve(true); }
        );

      }
    );
  }

}
