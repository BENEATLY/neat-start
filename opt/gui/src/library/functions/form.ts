//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Default
import { HttpHeaders } from '@angular/common/http';

// Imports: Libraries
import * as classLib from '../../library/functions/class';
import * as valLib from '../../library/functions/validate';
import * as sortLib from '../../library/functions/sort';
import * as ttLib from '../../library/functions/tooltip';
import * as objLib from '../../library/functions/object';
import * as timeLib from '../../library/functions/time';
import * as rightLib from '../../library/functions/right';
import * as dataLib from '../../library/functions/data';


// Input Validation
export function setInputValidation(property, state) {
  if (state) {
    classLib.removeClass(property.toLowerCase() + '-input', 'invalid-input');
    classLib.addClass(property.toLowerCase() + '-input', 'valid-input');
  }
  else {
    classLib.removeClass(property.toLowerCase() + '-input', 'valid-input');
    classLib.addClass(property.toLowerCase() + '-input', 'invalid-input')
  }
}

// File Raw Upload Process
export async function fileRawUploadProcess(config, property, fileData, httpModule, cookieService, snackBarService) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Determine Upload Path
  let uploadPath = (objLib.lookUpKey(property, 'upload')?property.upload:'file/upload');

  // Perform File Upload
  return await httpModule.post(config['apiRootUrl'] + uploadPath, fileData[property.property], { headers }).toPromise().then(

    // Success
    res => { return res; },

    // Fail
    err => {
      snackBarService.httpErrorOccurred(err);
      return null;
    }

  );

}

// File Full Upload Process
export async function fileFullUploadProcess(config, userData, property, fileData, httpModule, cookieService, snackBarService) {

  // Perform File Upload
  let fileResult = await fileRawUploadProcess(config, property, fileData, httpModule, cookieService, snackBarService);

  // File Upload Successful
  if (fileResult) {

    // Add Uploader
    fileResult['uploader'] = +userData.info.id;

    // Define API Authentication
    let token = cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Perform File Create API Call
    await httpModule.post(config['apiRootUrl'] + 'file/create', fileResult, { headers }).toPromise().then(
      res => {},
      err => { snackBarService.httpErrorOccurred(err); }
    );

    // Retrieve File Id
    let retrievedFile = await dataLib.retrieveObjectByAttr(config, 'File', 'reference', fileResult['reference'], snackBarService, cookieService, httpModule);

    // Return Id
    if (retrievedFile) { return retrievedFile['id']; }
    else { return null; }

  }

}

// Construct Send Data
export async function constructSendData(config, userData, properties, meta, optionalList, timezone, snackBarService = null, cookieService = null, httpModule = null, fileData = null) {

  // Create Variable
  let data = {};
  let overWrite = {};

  // Iterate over Properties
  for (var i=0; i<properties.length; i++) {

    // Filter on Required Information
    if ((((valLib.isVisible(properties[i]) && ((!valLib.isOptional(properties[i])) || (valLib.isOptional(properties[i]) && (optionalList[properties[i].property])))) && (((properties.length > 1) && (meta.type == 'Edit') && (properties[i].value != properties[i].initialValue)) || (properties.length == 1) || (meta.type != 'Edit'))) || ((meta.type == 'Create') && valLib.isRequired(properties[i]))) && (!((meta.type == 'Edit') && (!valLib.isEditable(properties[i]))))) {

      // Has Implicit Value
      if (valLib.isImplicit(properties[i])) {

        // Has Valid User Data
        if ((userData != null) && (!objLib.isEmptyObject(userData.info))) {

          // Implicit Team
          if (valLib.hasImplicitValue(properties[i]) == 'team') { data[properties[i].property] = +userData.info.team.id; }

          // Implicit User
          else if (valLib.hasImplicitValue(properties[i]) == 'user') { data[properties[i].property] = +userData.info.id; }

        }

      }

      // Has No Implicit Value
      else {

        // Assign 'Id' Values (Integers)
        if (valLib.isDefinedId(properties[i]) && (properties[i].value != null)) { data[properties[i].property] = +properties[i].value; }

        // Assign Null Value if Empty Value
        else if ((valLib.isDefinedString(properties[i]) || valLib.isDefinedFile(properties[i]) || valLib.isTimeDependent(properties[i])) && (properties[i].value.length == 0) && valLib.isNullable(properties[i])) { data[properties[i].property] = null; }

        // Convert DateTime Related Info to UTC and ISO Format
        else if (valLib.isTimeDependent(properties[i])) { data[properties[i].property] = timeLib.convertToISOUTCFormat(properties[i].value, properties[i], timezone); }
        // Assign the Regular Value
        else { data[properties[i].property] = properties[i].value; }

        // Add File
        if (valLib.isDefinedFile(properties[i]) && ((meta.type == 'Create') || (meta.type == 'Edit'))) {

          // File Raw Process
          if (valLib.isDefinedRawFile(properties[i])) {

            // Perform File Upload
            let fileResult = await fileRawUploadProcess(config, properties[i], fileData, httpModule, cookieService, snackBarService);
            if (fileResult) { overWrite = fileResult; }

          }

          // File Full Process
          else {

            // Check if Sufficient Rights
            if (rightLib.sufficientRights(userData.right, 'File', 'Create', 'own')) {

              // Perform File Upload & Creation
              data[properties[i].property] = await fileFullUploadProcess(config, userData, properties[i], fileData, httpModule, cookieService, snackBarService);

            }

          }

        }

      }

    }

  }

  // Overwrite Essential Data (Multi Step)
  for (let key of objLib.getKeys(overWrite)) { data[key] = overWrite[key]; }

  // Return Send Data
  return data;

}

// Validate Input
export function validateInput(translate, properties, acceptedList, currentList, existingList, optionalList, partUnique, activeToolTips) {

  // Combinated Parts are Unique
  if (properties.filter(x => (objLib.lookUpKey(x.accepted, 'restriction') && x.accepted.restriction.includes("part-unique"))).length > 0) {

    // Iterate over Current List
    for (let item of currentList.filter(obj => (obj.id != properties[0].id))) {

      // Determine the Unique Parts
      let partUniqueProperties = sortLib.visuallyOrderProperties(properties).filter(x => (objLib.lookUpKey(x.accepted, 'restriction') && x.accepted.restriction.includes("part-unique")))

      // Total # of Unique Parts
      let maxPartUnique = partUniqueProperties.length;

      // Counter of # of Unique Parts
      let found = 0;

      // Iterate over Unique Parts
      for (let property of partUniqueProperties) {

        // Item is Object
        if (valLib.isObject(item[property.property])) {

          // Has Id
          if (objLib.lookUpKey(item[property.property], 'id')) {

            // Increase Counter if Id is the Same
            if (property.value == item[property.property].id) { found++; }

          }

        }

        // Item is Value & Increase Counter if Value is the Same
        else if (property.value == item[property.property]) { found++; }

      }

      // # Found Equals # Unique Parts & Edited
      if ((found == maxPartUnique) && (properties.filter(x => (objLib.lookUpKey(x.accepted, 'restriction') && x.accepted.restriction.includes("part-unique"))).some(property => (property.value != property.initialValue)))) {

        // Trigger Warning for Unique Parts
        for (let property of partUniqueProperties) {
          setInputValidation(property.property, false);
          ttLib.enableToolTip(activeToolTips, property.property, translate.instant('common.validate.combinationExists'));
        }

        // Unique Parts Detected
        return false;

      }

    }

  }

  // Iterate over Visually Ordered Properties
  for (let sortedProperty of sortLib.visuallyOrderProperties(properties)) {

    // Get Index of Properties
    let i = properties.findIndex(obj => obj.property == sortedProperty.property);

    // Filter on Required Information
    if (valLib.isVisible(properties[i]) && (!valLib.isImplicit(properties[i])) && ((!valLib.isOptional(properties[i])) || (valLib.isOptional(properties[i]) && (optionalList[properties[i].property])))) {

      // No New Information
      if ((properties[i].initialValue == properties[i].value) && (properties.length == 1)) { return false; }

      // String or File Input
      if (valLib.isDefinedString(properties[i]) || valLib.isDefinedFile(properties[i])) {

        // Given Input too Short
        if (valLib.hasMinConstraint(properties[i]) && (properties[i].value.length < properties[i].accepted.min) && ((properties[i].value.length != 0) || (!valLib.isNullable(properties[i])))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.minChar', {'chars': properties[i].accepted.min.toString()}));
          return false;
        }

        // Given Input too Long
        if (valLib.hasMaxConstraint(properties[i]) && (properties[i].value.length > properties[i].accepted.max)) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.maxChar', {'chars': properties[i].accepted.max.toString()}));
          return false;
        }

        // Not Nullable
        if ((properties[i].value == '') && (!valLib.isNullable(properties[i]))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.emptyInput'));
          return false;
        }

        // Only Name Chars Allowed
        if (objLib.lookUpKey(properties[i].accepted, 'restriction') && properties[i].accepted.restriction.includes("name-chars")) {

          // Only Characters, Spaces and Single Quotes
          if (!properties[i].value.match(/^([a-zA-Z ']*)+$/)) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.plainCharOnly'));
            return false;
          }

          // No Double Spaces Allowed
          if (properties[i].value.includes("  ")) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.doubleSpace'));
            return false;
          }

          // No Double Quotes Allowed
          if (properties[i].value.includes("''")) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.doubleQuote'));
            return false;
          }

        }

        // Only Characters and Spaces
        if (objLib.lookUpKey(properties[i].accepted, 'restriction') && properties[i].accepted.restriction.includes("plain-chars")) {
          if (!properties[i].value.match(/^([a-zA-Z ]*)+$/)) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.plainCharOnly'));
            return false;
          }
        }

        // No White Spaces Allowed
        if (objLib.lookUpKey(properties[i].accepted, 'restriction') && properties[i].accepted.restriction.includes("no-whitespace")) {
          if (properties[i].value.includes(" ")) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.whitespace'));
            return false;
          }
        }

        // Only Lower Case Allowed
        if (objLib.lookUpKey(properties[i].accepted, 'restriction') && properties[i].accepted.restriction.includes("lowercase")) {
          if (!(properties[i].value === properties[i].value.toLowerCase())) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.lowerCaseOnly'));
            return false;
          }
        }

        // Only Upper Case Allowed
        if (objLib.lookUpKey(properties[i].accepted, 'restriction') && properties[i].accepted.restriction.includes("uppercase")) {
          if (!(properties[i].value === properties[i].value.toUpperCase())) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.upperCaseOnly'));
            return false;
          }
        }

        // Only Unique Values Allowed
        if (objLib.lookUpKey(properties[i].accepted, 'restriction') && properties[i].accepted.restriction.includes("unique")) {

          // Property Not in ExisingList
          if (!(properties[i].property in existingList)) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.exists'));
            return false;
          }

          // Value Not in ExisingList
          if ((existingList[properties[i].property].map(a => a[properties[i].property]).includes(properties[i].value)) && (properties[i].value != properties[i].initialValue)) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.exists'));
            return false;
          }

        }

        // Property has Specific Format
        if (valLib.hasFormat(properties[i])) {

          // Mail Format
          if (properties[i].accepted.format == 'mail') {
            if (!properties[i].value.match(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
              setInputValidation(properties[i].property, false);
              ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.invalidMail'));
              return false;
            }
          }

          // JSON Format
          if (properties[i].accepted.format == 'json') {
            if (!valLib.isJson(properties[i].value)) {
              setInputValidation(properties[i].property, false);
              ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.invalidJSON'));
              return false;
            }
          }

          // Phone Format
          if ((properties[i].accepted.format == 'phone') && ((!valLib.isNullable(properties[i])) || (properties[i].value.length > 0))) {
            if (!properties[i].value.match(/^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\./0-9 ]*$/)) {
              setInputValidation(properties[i].property, false);
              ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.invalidPhone'));
              return false;
            }
          }

          // IP Format
          if ((properties[i].accepted.format == 'ip') && ((!valLib.isNullable(properties[i])) || (properties[i].value.length > 0))) {
            if (!properties[i].value.match(/^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/)) {
              setInputValidation(properties[i].property, false);
              ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.invalidIP'));
              return false;
            }
          }

          // MAC Format
          if ((properties[i].accepted.format == 'mac') && ((!valLib.isNullable(properties[i])) || (properties[i].value.length > 0))) {
            properties[i].value = properties[i].value.toUpperCase();
            if (!properties[i].value.match(/^(([A-F0-9]{2}[:]){5}[A-F0-9]{2}[,]?)+$/)) {
              setInputValidation(properties[i].property, false);
              ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.invalidMAC'));
              return false;
            }
          }

        }

        // Password Property
        if (valLib.isDefinedPassword(properties[i])) {

          // Special Character Required
          var regex = /[ !@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
          if (!regex.test(properties[i].value)) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.passwordOneSpecialChar'));
            return false;
          }

          // Capital Letter Required
          var regex = /[A-Z]/;
          if (!regex.test(properties[i].value)) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.passwordOneUpperCaseChar'));
            return false;
          }

          // Number Required
          var regex = /[0-9]/;
          if (!regex.test(properties[i].value)) {
            setInputValidation(properties[i].property, false);
            ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.passwordOneNumberChar'));
            return false;
          }

          // Disable ToolTip
          ttLib.disableToolTip(activeToolTips, properties[i].property);

          // Matching Passwords
          if (properties[i].value != properties[i].comparedValue) {
            setInputValidation('passcompared', false);
            ttLib.enableToolTip(activeToolTips, 'passcompared', translate.instant('common.validate.passwordMatching'));
            setInputValidation(properties[i].property, true);
            return false;
          }
          else {
            setInputValidation('passcompared', true);
            ttLib.disableToolTip(activeToolTips, 'passcompared');
          }

        }

        // Secure File Name
        if (valLib.isDefinedFile(properties[i]) && (objLib.lookUpKey(properties[i].accepted, 'restriction') && properties[i].accepted.restriction.includes("secure-file-name")) && (!valLib.isSecureFileName(properties[i].value))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.secureFileName'));
          return false;
        }

      }

      // List Input
      else if (valLib.isDefinedList(properties[i])) {

        // Empty List Not Allowed (Not Nullable)
        if ((properties[i].value.length == 0) && (!valLib.isNullable(properties[i]))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.emptyList'), 'top');
          return false;
        }

      }

      // Id Input
      else if (valLib.isDefinedId(properties[i])) {

        // Not Nullable
        if ((properties[i].value == null) && (!valLib.isNullable(properties[i]))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.emptySelection'));
          return false;
        }

        // Property Not in AcceptedList
        if ((properties[i].value != null) && (!(properties[i].property in acceptedList))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.notInPossibilities'));
          return false;
        }

        // Value Not in AcceptedList
        if ((properties[i].value != null) && (!(acceptedList[properties[i].property].map(a => a.id.toString()).includes(properties[i].value.toString())))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.notInPossibilities'));
          return false;
        }

      }

      // Number Input
      else if (valLib.isDefinedNumber(properties[i])) {

        // Not Nullable
        if ((properties[i].value == null) && (!valLib.isNullable(properties[i]))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.invalidNumber'));
          return false;
        }

        // Given Input too High
        if ((properties[i].value != null) && valLib.hasMaxConstraint(properties[i]) && (properties[i].value > properties[i].accepted.max)) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.maxNumber', {'number': properties[i].accepted.max.toString()}));
          return false;
        }

        // Given Input too Low
        if ((properties[i].value != null) && valLib.hasMinConstraint(properties[i]) && (properties[i].value < properties[i].accepted.min)) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.minNumber', {'number': properties[i].accepted.min.toString()}));
          return false;
        }

        // Fixed Value Step
        if ((properties[i].value != null) && valLib.hasStep(properties[i]) && (properties[i].accepted.step != 'any') && ((Math.round(Math.round(properties[i].value*1000000) % Math.round(properties[i].accepted.step*1000000))) != 0)) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.precisionNumber', {'precision': properties[i].accepted.step.toString()}));
          return false;
        }

      }

      // Date, Time or DateTime Input
      else if (valLib.isTimeDependent(properties[i])) {

        // Not Nullable
        if ((properties[i].value == '') && (!valLib.isNullable(properties[i]))) {
          setInputValidation(properties[i].property, false);
          ttLib.enableToolTip(activeToolTips, properties[i].property, translate.instant('common.validate.emptyInput'));
          return false;
        }

      }

      // All OK
      setInputValidation(properties[i].property, true);
      ttLib.disableToolTip(activeToolTips, properties[i].property);

    }

  }

  // List with Results of if Each Property equals the Initial Value
  let combine = [];

  // Only for Multiple Properties
  if (properties.length > 1) {

    // Iterate over Properties
    for (var i=0; i<properties.length; i++) {

      // Filter on Required Information
      if (valLib.isVisible(properties[i]) && (!valLib.isImplicit(properties[i])) && ((!valLib.isOptional(properties[i])) || (valLib.isOptional(properties[i]) && (optionalList[properties[i].property]))) && (!valLib.isExternal(properties[i]))) {

        // Initial Value is Null
        if (properties[i].initialValue == null) {

          // Value Equal to Initial Value
          if (properties[i].value == null) { combine.push(false); }

          // Value Not Equal to Initial Value
          else { combine.push(true); }

        }

        // Initial Value is Not Null
        else {

          // Value can Not be Null when Initial Value is Defined
          if (properties[i].value == null) { combine.push(false); }

          else {

            // Value Equal to Initial Value
            if ((properties[i].initialValue.toString() == properties[i].value.toString())) { combine.push(false); }

            // Value Not Equal to Initial Value
            else { combine.push(true); }

          }

        }

      }

    }

    // Check if at Least One Value Changed
    if (combine.every(x => x == false)) { return false; }

  }

  // Return Success
  return true;

}

// Disabled Property
export function disabledProperty(meta, property) {

  // Is Disabled
  if (valLib.isDisabled(property)) {

    // Object Not Present
    if (meta.object == null) { return false; }

    // Object Present
    let item = meta.object;

    // Iterate over Disabled Statements
    for (let statement of property.accepted.disabled) {

      // Determine # Parameters
      let nrOfParameters = statement.split('${').length - 1;

      // Iterate over Parameters
      for (var i=0; i<nrOfParameters; i++) {

        // Content of Parameter
        let parameter = statement.split('${')[1].split('}')[0];

        // Sub Attribute
        if (!parameter.includes('.')) {

          // Has No Length Function
          if (!parameter.includes('len(')) { statement = statement.replace('${' + parameter + '}', item[parameter]); }

          // Has Length Function
          else {
            parameter = parameter.split('len(')[1].split(')')[0];
            statement = statement.replace('${len(' + parameter + ')}', item[parameter].length);
          }

        }

        // Direct Attribute
        else {

          // Has No Length Function
          if (!parameter.includes('len(')) { statement = statement.replace('${' + parameter + '}', objLib.getSubProperty(item[parameter.split('.')[0]], parameter.split(parameter.split('.')[0] + '.')[1])); }

          // Has Length Function
          else {
            parameter = parameter.split('len(')[1].split(')')[0];
            statement = statement.replace('${len(' + parameter + ')}', objLib.getSubProperty(item[parameter.split('.')[0]], parameter.split(parameter.split('.')[0] + '.')[1]).length);
          }

        }

        // Equal Filter
        if (statement.includes(' == ')) {
          if (statement.split(' == ')[0] == statement.split(' == ')[1]) { return true; }
        }

        // Not Equal Filter
        if (statement.includes(' != ')) {
          if (statement.split(' != ')[0] != statement.split(' != ')[1]) { return true; }
        }

      }

    }

  }

  // Return False
  return false;

}

// Get Fixed Value
export function getFixedValue(meta, property) { return meta.options.fixed[property.property]; }

// Evaluate Strict Number (Filter Only)
export function evaluateStrictNumber(e, filterLine) {
  if (e.srcElement.defaultValue == "") { e.srcElement.defaultValue = "0"; }
  if ((e.data == ",") && (e.target.value != "") && (!e.target.value.includes('.'))) {
    e.target.value = e.srcElement.defaultValue + '.0';
    filterLine.ref = Number(e.target.value);
  }
  else if (e.target.value == "") {
    if ((e.data == ".") && (!e.srcElement.defaultValue.includes('.'))) { e.target.value = e.srcElement.defaultValue + '.0'; }
    else if (e.srcElement.value != "") { e.target.value = e.srcElement.value; }
    else { e.target.value = e.srcElement.defaultValue; }
    filterLine.ref = Number(e.target.value);
  }
  else { e.srcElement.defaultValue = e.target.value; }
}
