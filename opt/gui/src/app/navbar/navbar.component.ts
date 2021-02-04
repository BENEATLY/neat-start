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

// Imports: Reload
import { PlatformLocation } from '@angular/common';

// Imports: Custom Services
import { DataService } from '../data.service';
import { TimezoneService } from '../timezone.service';
import { TranslationService } from '../translation.service';
import { ModalService } from '../../modal/services/modal.service';

// Imports: Config Loaders
import { AppConfig } from '../app.config';

// Imports: Translation
import { TranslateService } from '@ngx-translate/core';

// Imports: Libraries
import * as objLib from '../../library/functions/object';
import * as classLib from '../../library/functions/class';
import * as syncLib from '../../library/functions/sync';
import * as rightLib from '../../library/functions/right';
import * as definitionsLib from '../../library/functions/definitions';
import * as navigationLib from '../../library/functions/navigation';
import * as routeLib from '../../library/functions/route';
import * as modalLib from '../../library/functions/modal';
import * as presentLib from '../../library/functions/presentation';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-navbar', templateUrl: './navbar.component.html', styleUrls: ['./navbar.component.css']})


// Component Export Definition
export class NavbarComponent implements OnInit {

  // Libraries
  objLib = objLib;
  classLib = classLib;
  syncLib = syncLib;
  rightLib = rightLib;
  definitionsLib = definitionsLib;
  navigationLib = navigationLib;
  routeLib = routeLib;
  modalLib = modalLib;
  presentLib = presentLib;

  // jQuery
  jquery = $;

  // Path (Non-Configurable)
  shortPath: string;

  // Navigation (Non-Configurable)
  middleNavigation = null;
  rightNavigation = null;
  leftNavigation = null;
  innerWidth;
  publicPages = ['home', 'login', 'languages'];

  // Application Info
  appLogo = '';


  // Host Listener
  @HostListener('window:resize', ['$event'])
  onResize(event) {

    // Window Width
    this.innerWidth = window.innerWidth;

    // Collapse Background Revert
    this.collapseBackgroundRevert(window.innerWidth);

    // Responsive Navbar
    this.responsiveNav(window.innerWidth);

  }


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, private platformLocation: PlatformLocation, public modalService: ModalService, public appConfig: AppConfig, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Get App Logo
    this.appLogo = presentLib.getAppLogo(this.appConfig.config);

    // Get Path & Navigation Info (Default)
    this.data.shortPath.subscribe(
      shortPath => {
        this.shortPath = shortPath;
        this.middleNavigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData.right, 'navbar', 'middle');
        this.rightNavigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData.right, 'navbar', 'right');
      }
    );
    this.data.leftNavigation.subscribe(leftNavigation => this.leftNavigation = leftNavigation);

    // Get Navigation
    this.middleNavigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData.right, 'navbar', 'middle');
    this.rightNavigation = navigationLib.getNavigation(this.appConfig.config, this.data.userData.right, 'navbar', 'right');

    // Reload Page on Page Back
    platformLocation.onPopState(() => { location.reload(); });

  }


  // Page Initialisation
  async ngOnInit() {

    // Logout Hook
    $('#update-required').on("logout", () => { this.manualLogOut(); });

    // Login Hook
    $('#update-required').on("login", () => { this.logIn(); });

    // Window Width
    this.innerWidth = window.innerWidth;

    // On Log In Page?
    if ((window.location.pathname.includes('login') || (window.location.pathname.includes('home')) && (this.cookieService.get('logout').length <= 0))) {

      // Valid User Data
      if ((!objLib.isEmptyObject(this.data.userData.info)) && (!objLib.isEmptyObject(this.data.userData.right))) {

        // Immediately Navigate to Dashboard
        this.router.navigate([`dashboard`]);

      }

      // Invalid User Data
      else {

        // Log Out
        this.logOut();

      }

    }
    else {

      // Invalid User Data
      if (objLib.isEmptyObject(this.data.userData.info) || objLib.isEmptyObject(this.data.userData.right)) {

        // Log Out
        this.logOut();

      }

    }

  }


  // Log Out
  logOut() {
    this.cookieService.delete('token');
    this.router.navigate([`home`]);
  }

  // Manual Log Out
  manualLogOut() {
    this.cookieService.set('logout', 'yes');
    this.logOut();
  }

  // Perform Log In
  logIn() {

    // Update User Data
    this.data.loadUser();

    // Navigate to Dashboard
    this.router.navigate([`dashboard`]);

  }

  // Collapse Active?
  collapseActive() {
    if ($(window).width() < 992) { return true; }
    else { return false; }
  }

  // Let NavBar Settings/LogOut Appear on Collapsed Screen
  iconOnlyResize() {
    if ($(window).width() > 991) { return true; }
    else { return false; }
  }

  // Switch Left Navigation Expand
  async switchLeftNavExpand() {

    // Expand
    if (!this.leftNavigation) {
      this.displayNavBarLogo();
      this.switchNavBarBrandArrowDirection(true);
    }

    // Minimize
    else {
      classLib.addClass('navbar-logo', 'no-display');
      classLib.removeClass('navbar-logo', 'full-opacity');
      classLib.addClass('navbar-logo', 'zero-opacity');
      classLib.addClass('left-nav-bar', 'left-nav-bar-no-display');
      this.switchNavBarBrandArrowDirection(false);
    }

    // Trigger Switch
    this.data.flagLeftNavBarExpand(!this.leftNavigation);

  }

  // Display NavBar Logo
  async displayNavBarLogo() {

    // Asynchronous Wait
    await syncLib.asyncWait(500);

    // Make Navbar Logo Visible
    classLib.removeClass('navbar-logo', 'no-display');

    // Asynchronous Wait
    await syncLib.asyncWait(100);

    // Opacity Transition for Navbar
    classLib.removeClass('navbar-logo', 'zero-opacity');
    classLib.addClass('navbar-logo', 'full-opacity');

    // Left Nav Bar Content
    classLib.removeClass('left-nav-bar', 'left-nav-bar-no-display');

  }

  // Switch Navbar Brand Arrow Direction
  async switchNavBarBrandArrowDirection(state) {

    // Asynchronous Wait
    await syncLib.asyncWait(1000);

    // Minimized
    if (state) { classLib.removeClass('navbar-brand-arrow-left', 'half-rotate'); }

    // Expanded
    else { classLib.addClass('navbar-brand-arrow-left', 'half-rotate'); }

  }

  // Collapse Navigate
  collapseNav(path) { routeLib.navigateCollapse(this.router, path, this.innerWidth); }

  // Collapse Background Revert
  collapseBackgroundRevert(width) {
    if (width > 991) {
      if (classLib.hasClass('content-page', 'collapse-visibility')) {
        classLib.removeClass('content-page', 'collapse-visibility');
        classLib.removeClass('left-nav-bar', 'collapse-visibility');
        classLib.removeClass('navbar-brand', 'collapse-visibility');
        classLib.removeClass('NavBar', 'show');
      }
    }
  }

  // Make Sure NavBar is Responsive
  responsiveNav(width) {
    if (width < 992) {
      classLib.addClassbyClass('navbar-item', 'navbar-collapse-separation');
      classLib.addClass('NavBarToggle', 'navbar-dropdown-button-collapse-active');
    }
    else {
      classLib.removeClassbyClass('navbar-item', 'navbar-collapse-separation');
      classLib.removeClass('NavBarToggle', 'navbar-dropdown-button-collapse-active');
    }
  }

}
