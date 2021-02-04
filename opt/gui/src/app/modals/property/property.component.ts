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
import * as valLib from '../../../library/functions/validate';
import * as formLib from '../../../library/functions/form';
import * as strLib from '../../../library/functions/string';
import * as presentLib from '../../../library/functions/presentation';
import * as searchLib from '../../../library/functions/search';
import * as listLib from '../../../library/functions/list';
import * as rightLib from '../../../library/functions/right';
import * as fileLib from '../../../library/functions/file';
import * as sortLib from '../../../library/functions/sort';
import * as focusLib from '../../../library/functions/focus';
import * as ttLib from '../../../library/functions/tooltip';
import * as timeLib from '../../../library/functions/time';
import * as translateLib from '../../../library/functions/translate';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'app-property-modal', templateUrl: 'property.component.html'})


// Component Export Definition
export class PropertyModalComponent implements OnInit {

  // Libraries
  objLib = objLib;
  valLib = valLib;
  formLib = formLib;
  strLib = strLib;
  presentLib = presentLib;
  searchLib = searchLib;
  listLib = listLib;
  rightLib = rightLib;
  fileLib = fileLib;
  sortLib = sortLib;
  focusLib = focusLib;
  ttLib = ttLib;
  translateLib = translateLib;

  // Constants: Modal Default
  properties;
  meta;

  // Non-Configurable
  activeToolTips = {};
  existingList = {};
  acceptedList = {};
  currentList = [];
  additionList = {};
  optionalList = {};
  fixedList = {};
  partUnique = false;
  fileData = {};
  maximizedProperty = null;
  infoProperty = null;
  datetimepickerundefined = [];
  processed = false;


  // Constructor
  constructor(private router: Router, private route: ActivatedRoute, public data: DataService, private http: HttpClient, private cookieService: CookieService, public appConfig: AppConfig, public modalService: ModalService, public focusService: FocusService, private snackBar: SnackBarService, public timezone: TimezoneService, public translate: TranslateService, public translation: TranslationService) {

    // Translate
    let lang = this.translation.translation.translationFile;
    translate.setTranslation(lang, this.translation.translationContent);
    translate.setDefaultLang(lang);

    // Get the Passed Values
    this.properties = this.modalService.getValue()[0];
    this.meta = this.modalService.getValue()[1];

  }


  // Page Initialisation
  async ngOnInit() {

    // Load Info
    if (this.meta.type != 'Delete') { await this.loadInfo(); }
    else { this.meta.url = this.meta.url + this.meta.object.val.id.toString(); }

    // Processed
    this.processed = true;

  }

  // Page Destruction
  ngOnDestroy() {

    // Clear Tooltips
    ttLib.clearToolTips(this.activeToolTips);

  }


  // Load Info
  async loadInfo() {

    // Parallel Tasks
    let parallelTasks = [];

    // Define API Authentication
    let token = this.cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Create URL (Add Id if Needed)
    if (this.meta.type != 'Create') { this.meta.url = this.meta.url + this.meta.object.val.id.toString(); }

    // Get Fixed List
    if (valLib.hasFixedDefinition(this.meta)) { this.fixedList = this.meta.options.fixed; }

    // Get Unique List
    if (this.properties.filter(x => (objLib.lookUpKey(x.accepted, 'restriction') && x.accepted.restriction.includes("part-unique"))).length > 0) {

      // Perform Unique API Call
      parallelTasks.push(

        this.http.get(this.meta.list, { headers }).toPromise().then(

          // Success
          (res: any[]) => { this.currentList = res; },

          // Fail
          err => { this.snackBar.httpErrorOccurred(err); }

        )

      );

    }

    // Create URL, Get Existing Lists and Get Accepted Lists
    for (var i=0; i<this.properties.length; i++) {

      // Optional Property
      if (valLib.isOptional(this.properties[i])) {
        if ((!valLib.isNullable(this.properties[i])) && (this.meta.type == 'Create')) { this.optionalList[this.properties[i].property] = true; }
        else {
          if (this.properties.length > 1) { this.optionalList[this.properties[i].property] = false; }
          else { this.optionalList[this.properties[i].property] = true; }
        }
      }

      // Get Existing List (Unique Required Property Only)
      if (objLib.lookUpKey(this.properties[i].accepted, 'restriction') && this.properties[i].accepted.restriction.includes("unique")) {

        // Perform Existing List API Call
        parallelTasks.push(

          this.http.get(this.meta.list, { headers }).toPromise().then(

            // Success
            function (property, res) { this.existingList[property] = res; }.bind(this, this.properties[i].property),

            // Fail
            err => { this.snackBar.httpErrorOccurred(err); }

          )

        );

      }

      // Property Not Required to be Unique
      else { this.existingList[this.properties[i].property] = []; }

      // Id Property
      if (valLib.isDefinedId(this.properties[i])) {

        // Has Value
        if (valLib.isObject(this.properties[i].value)) {

          // Set Value: Fixed
          if (valLib.isFixed(this.meta, this.properties[i])) { this.properties[i].value = +formLib.getFixedValue(this.meta, this.properties[i]); }

          // Set Value: Not Fixed
          else { this.properties[i].value = this.properties[i].value.id; }

        }

        // No Value (Set Initial Value)
        if (this.properties[i].value == null) { this.properties[i].initialValue = null; }

        // Has Value (Set Initial Value)
        else { this.properties[i].initialValue = (' ' + this.properties[i].value.toString()).slice(1); }

        // Get Accepted List
        if (!valLib.isExternal(this.properties[i])) {

          // Perform Accepted List API Call
          parallelTasks.push(

            this.http.get(this.properties[i].accepted.list, { headers }).toPromise().then(

              // Success
              function (property, res) {

                // Has Filter
                if (valLib.hasFilter(property) && (!valLib.isFixed(this.meta, this.properties[i]))) {

                  // Filter Accepted List
                  this.acceptedList[property.property] = searchLib.applyFiltersOnList(res, property.accepted.filter);

                }

                // No Filter
                else { this.acceptedList[property.property] = res; }

              }.bind(this, this.properties[i]),

              // Fail
              err => { this.snackBar.httpErrorOccurred(err); }

            )

          );

        }

      }

      // List Property
      else if (valLib.isDefinedList(this.properties[i])) {

        // Set Addition List to Null
        this.additionList[this.properties[i].property] = null;

        // Set Value: Fixed
        if (valLib.isFixed(this.meta, this.properties[i])) { this.properties[i].value = formLib.getFixedValue(this.meta, this.properties[i]); }

        // Set Initial Value
        else { this.properties[i].initialValue = $.extend(true, [], this.properties[i].value); }

        // Get Accepted List
        if (!valLib.isExternal(this.properties[i])) {

          // Perform Accepted List API Call
          parallelTasks.push(

            this.http.get(this.properties[i].accepted.list, { headers }).toPromise().then(

              // Success
              function (property, res) {

                // Has Filter
                if (valLib.hasFilter(property) && (!valLib.isFixed(this.meta, this.properties[i]))) {

                  // Filter Accepted List
                  this.acceptedList[property.property] = searchLib.applyFiltersOnList(res, property.accepted.filter);

                }

                // No Filter
                else { this.acceptedList[property.property] = res; }

              }.bind(this, this.properties[i]),

              // Fail
              err => { this.snackBar.httpErrorOccurred(err); }

            )

          );

        }

      }

      // Time Property
      else if (valLib.isTimeDependent(this.properties[i])) {

        // No Value
        if (this.properties[i].value == null) {

          // Set Value to Empty String
          this.properties[i].value = '';

          // Set Initial Value to Empty String
          this.properties[i].initialValue = '';

          // Undefined DateTime for Picker
          this.datetimepickerundefined.push(this.properties[i].property);

        }

        // Has Value
        else {

          // Set Value by Converting UTC String to Right Format
          this.properties[i].initialValue = timeLib.convertTimeDependentToString(this.properties[i].value, this.properties[i], this.timezone);

          // Set Value by Converting UTC String to Right Format
          this.properties[i].value = timeLib.convertTimeDependentToString(this.properties[i].value, this.properties[i], this.timezone);

        }

      }

      // Other Property
      else {

        // Empty Accepted List
        this.acceptedList[this.properties[i].property] = [];

        // Set Value: Fixed
        if (valLib.isFixed(this.meta, this.properties[i])) { this.properties[i].value = formLib.getFixedValue(this.meta, this.properties[i]); }

        // No Value
        if (this.properties[i].value == null) {

          // Set Value to Empty String
          this.properties[i].value = '';

          // Set Initial Value to Empty String
          this.properties[i].initialValue = '';

        }

        // Has Value (Set Initial Value)
        else {

          // JSON Format
          if (valLib.isJsonFormat(this.properties[i])) {
            if (this.properties[i].value.length == 0) { this.properties[i].value = '{}'; }
            this.properties[i].value = presentLib.beautifyJson(this.properties[i].value);
            this.properties[i].initialValue = (' ' + this.properties[i].value).slice(1);
          }

          // No JSON Format
          else { this.properties[i].initialValue = (' ' + this.properties[i].value).slice(1); }

        }

      }

    }

    // Execute Parallel Tasks
    return Promise.all(parallelTasks);

  }

  // Page After View Init
  ngAfterViewInit() {
    let now = timeLib.getNow();
    for (let prop of this.properties) {
      if (valLib.isTimeDependent(prop)) {
        $('#' + prop.property + '-datetimepicker').datetimepicker(timeLib.dateTimePickerSettings(this.meta.type, now, prop, this.timezone, this.translation));
        if (this.datetimepickerundefined.includes(prop.property)) { prop.value = ''; }
        $('#' + prop.property + '-datetimepicker').on('dp.change', function() { prop.value = $('#' + prop.property + '-input').val(); });
        $('#' + prop.property + '-datetimepicker' + ' > ' + '.input-group-addon').on('click', function() {
          $('#' + prop.property + '-datetimepicker').data("DateTimePicker").date(now);
          prop.value = $('#' + prop.property + '-input').val();
        });
      }
    }
  }


  // Allowed to Submit Modal?
  submitAllowed() {

    // Allow If Type is Delete
    if (this.meta.type == 'Delete') { return true; }

    // Validate Input
    else { return formLib.validateInput(this.translate, this.properties, this.acceptedList, this.currentList, this.existingList, this.optionalList, this.partUnique, this.activeToolTips); }

  }

  // Submit Modal
  async submit() {

    // Define API Authentication
    let token = this.cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Perform API Call
    if (this.meta.type == 'Delete') {

      // Perform Put API Call
      await this.http.put(this.meta.url, {}, { headers }).toPromise().then(
        res => {},
        err => { this.snackBar.httpErrorOccurred(err); }
      );

    }
    else {

      // Construct Data Form
      let submitData = await formLib.constructSendData(this.appConfig.config, this.data.userData, this.properties, this.meta, this.optionalList, this.timezone, this.snackBar, this.cookieService, this.http, this.fileData);

      // Perform Post API Call
      await this.http.post(this.meta.url, submitData, { headers }).toPromise().then(
        res => {},
        err => { this.snackBar.httpErrorOccurred(err); }
      );

    }

    // Return
    this.modalService.ok();

  }

}
