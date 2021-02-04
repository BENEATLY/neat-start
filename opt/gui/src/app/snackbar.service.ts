/*
  Author:     Thomas D'haenens
  Created:    14/09/2019 8:21
  License:    GPLv3
*/


// Imports: Required
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// Imports: Default
import { HttpHeaders } from '@angular/common/http';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

// Imports: Config Loaders
import { AppConfig } from './app.config';

// Imports: Libraries
import * as classLib from '../library/functions/class';

// Declarations: JQuery
declare var $: any;


// Class Export Definition
@Injectable()
export class SnackBarService {

  // Constants: Default
  snackBarRef;


  // Constructor
  constructor(private snackBar: MatSnackBar, private appConfig: AppConfig) {

  }


  // Clear Overlay Container
  clearOverlayContainer() {

    // Check if Overlay Exists
    if (classLib.classExists('cdk-overlay-container')) {

      // Get Overlay Class List
      let classList = classLib.getClassListByClass('cdk-overlay-container');

      // Remove Other Classes
      for (let cla of classList) {
        if (cla != 'cdk-overlay-container') { classLib.removeClassbyClass('cdk-overlay-container', cla); }
      }

    }

  }

  // Split Snackbar Content
  splitSnackbarContent(content) {
    let maxLength = 24;
    let contentLines = [''];
    let contentLine = 0;
    let i = 0;
    let strSplitLength = content.split(' ').length;
    for (let strSplitContent of content.split(' ')) {
      if ((contentLines[contentLine].length + (strSplitContent.length + 1)) <= maxLength) {
        if (i == (strSplitLength-1)) { contentLines[contentLine] += strSplitContent; }
        else { contentLines[contentLine] += strSplitContent + ' '; }
      }
      else {
        let j = 0;
        let slashSplitLength = strSplitContent.split('/').length;
        for (let slashSplitContent of strSplitContent.split('/')) {
          if ((contentLines[contentLine].length + (slashSplitContent.length + 1)) <= maxLength) {
            if (j == (slashSplitLength-1)) { contentLines[contentLine] += slashSplitContent; }
            else { contentLines[contentLine] += slashSplitContent + '/'; }
          }
          else {
            contentLine += 1;
            contentLines.push('');
            if ((j == (slashSplitLength-1)) && (i == (strSplitLength-1))) { contentLines[contentLine] += slashSplitContent; }
            else if (j != (slashSplitLength-1)) { contentLines[contentLine] += slashSplitContent + '/'; }
            else { contentLines[contentLine] += slashSplitContent + ' '; }
          }
          j += 1;
        }
      }
      i += 1;
    }
    if (contentLines[contentLines.length-1] == '') { contentLines.pop(); }
    return contentLines.join("\n");
  }

  // Dismiss Snackbar
  dismiss() {

    // Snack Bar Exists
    if (this.snackBarRef != null) { this.snackBarRef.dismiss(); }

  }

  // HTTP Error Occurred Snack Bar
  httpErrorOccurred(error, position = null) {

    // Snack Bar Exists
    if (this.snackBarRef != null) { this.snackBarRef.dismiss(); }

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-header-text'];

    // Determine Content
    let content = error.url.replace(`${this.appConfig.config['apiRootUrl']}`, '');
    if (content.startsWith('http://') || content.startsWith('https://')) {
      content = content.replace('http://', '');
      content = content.replace('https://', '');
      content = '/' + content.split('/').slice(1).join('/');
    }
    if (content.includes('/add/') && (content.split('/')[1] == 'add')) { content = 'Add ' + content.split('/')[0].toLowerCase(); }
    else if (content.includes('/assign/') && (content.split('/')[1] == 'assign')) { content = 'Assign ' + content.split('/')[0].toLowerCase(); }
    else if (content.includes('/edit/') && (content.split('/')[1] == 'edit')) { content = 'Edit ' + content.split('/')[0].toLowerCase(); }
    else if (content.includes('/delete/') && (content.split('/')[1] == 'delete')) { content = 'Delete ' + content.split('/')[0].toLowerCase(); }
    else if (content.includes('/create') && (content.split('/')[1] == 'create')) { content = 'Create ' + content.split('/')[0].toLowerCase(); }
    else if (content.includes('/list') && (content.split('/')[1].split('&')[0] == 'list')) { content = 'Get ' + content.split('/')[0].toLowerCase() + ' list'; }
    else if (content.includes('/id/') && (content.split('/')[1] == 'id')) { content = 'Get ' + content.split('/')[0].toLowerCase() + ' by id'; }
    else {
      let nrOfSlashes = (content.split('/').length - 1)
      if (nrOfSlashes == 0) { content = content.toLowerCase(); }
      else if (nrOfSlashes == 1) { content = content.split('/')[1].toLowerCase() + ' ' + content.split('/')[0].toLowerCase(); }
    }

    // Clear
    this.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open('ERROR:' + ' ' + 'HTTP' + ' ' + error.status.toString() + "\n" + this.splitSnackbarContent(content), 'CLOSE', snackBarConfig);

    // Set Overlay Container
    if (position) { classLib.addClassbyClass('cdk-overlay-container', position); }

  }

  // Invalid Credentials
  invalidCredentials(translate, cookieService, routerModule, position = null) {

    // Snack Bar Exists
    if (this.snackBarRef != null) { this.snackBarRef.dismiss(); }

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-text'];

    // Clear
    this.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.invalidCredentials'), translate.instant('common.snackbar.button.close').toUpperCase(), snackBarConfig);

    // Set Overlay Container
    if (position) { classLib.addClassbyClass('cdk-overlay-container', position); }

  }

  // Logon Error
  logonError(translate, cookieService, routerModule, position = null) {

    // Snack Bar Exists
    if (this.snackBarRef != null) { this.snackBarRef.dismiss(); }

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-text'];

    // Clear
    this.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.logonError'), translate.instant('common.snackbar.button.close').toUpperCase(), snackBarConfig);

    // Set Overlay Container
    if (position) { classLib.addClassbyClass('cdk-overlay-container', position); }

  }

  // loggedOut
  loggedOut(translate, cookieService, routerModule, position = null) {

    // Snack Bar Exists
    if (this.snackBarRef != null) { this.snackBarRef.dismiss(); }

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-header-text'];

    // Clear
    this.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.loggedOut.title').toUpperCase() + "\n" + translate.instant('common.snackbar.message.loggedOut.content'), translate.instant('common.snackbar.button.close').toUpperCase(), snackBarConfig);

    // Set Overlay Container
    if (position) { classLib.addClassbyClass('cdk-overlay-container', position); }

  }

  // SSL Expire Soon Snack Bar
  sslExpireSoon(translate, cookieService, routerModule, position = null) {

    // Snack Bar Exists
    if (this.snackBarRef != null) { this.snackBarRef.dismiss(); }

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-text'];

    // Clear
    this.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.sslExpireSoon'), translate.instant('common.snackbar.button.show').toUpperCase(), snackBarConfig);

    // Reload Screen when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => { routerModule.navigate(['settings/ssl']); });

    // Set Overlay Container
    if (position) { classLib.addClassbyClass('cdk-overlay-container', position); }

  }

  // SSL Expired Snack Bar
  sslExpired(translate, cookieService, routerModule, position = null) {

    // Snack Bar Exists
    if (this.snackBarRef != null) { this.snackBarRef.dismiss(); }

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-text'];

    // Clear
    this.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.sslExpired'), translate.instant('common.snackbar.button.show').toUpperCase(), snackBarConfig);

    // Reload Screen when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => { routerModule.navigate(['settings/ssl']); });

    // Set Overlay Container
    if (position) { classLib.addClassbyClass('cdk-overlay-container', position); }

  }

}
