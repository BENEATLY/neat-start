//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Default
import { HttpHeaders } from '@angular/common/http';

// Imports: Libraries
import * as valLib from '../../library/functions/validate';
import * as objLib from '../../library/functions/object';
import * as formatLib from '../../library/functions/format';
import * as filterLib from '../../library/functions/filter';
import * as definitionsLib from '../../library/functions/definitions';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Get Page Info
export function getPageInfo(config, userData, name, apiObject, columns, pageInfo, resultInfo, accessLevel, sortingArray, filterArray, filterState, displayOptions, timezone, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Definitions Level
  let definitionsLevel = 'own';
  if (objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'level')) { definitionsLevel = displayOptions[name]['level']; }
  else { definitionsLevel = definitionsLib.lookUpDefinitions(config, userData.right, 'Get List', apiObject); }

  // Select Sorting Attribute
  if ((config['definitions']['Object'][apiObject][definitionsLevel]) && (config['definitions']['Object'][apiObject][definitionsLevel].length) && (objLib.lookUpKey(sortingArray, name)) && (sortingArray[name].attr == null)) {
    sortingArray[name] = {'attr': config['definitions']['Object'][apiObject][definitionsLevel][0].property, 'order': true}
  }

  // Perform Get List API Call
  httpModule.get(`${config['apiRootUrl']}` + apiObject.toLowerCase() + `/list&page=${pageInfo[name].page}&perPage=${pageInfo[name].perPage}` + ((objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'level'))?('&level=' + displayOptions[name]['level']):(((accessLevel != null) && (objLib.lookUpKey(accessLevel, 'selected')) && accessLevel['selected'])?('&level=' + accessLevel['selected']):'')) + `&sort=${sortingArray[name].attr}&order=${(sortingArray[name].order?'asc':'desc')}` + ((filterLib.filterAllowed(filterArray[name]) && (filterLib.constructAPIFilter(filterArray[name], timezone).length > 0))?'&filter=' + filterLib.constructAPIFilter(filterArray[name], timezone):'') + ((objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'extendQuery'))?('&' + displayOptions[name]['extendQuery']):''), { headers }).subscribe(

    // Success
    (res: any[]) => {

      // Store Columns
      let origColumns = cloneDeep(columns[name]);

      // Reset Columns
      columns[name] = {};

      // Update Columns
      for (let property of config['definitions']['Object'][apiObject][definitionsLevel]) {
        if (objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'hiddenColumns')) {
          if (!displayOptions[name]['hiddenColumns'].includes(property.property)) {
            if (!valLib.isOptional(property)) {
              if ((objLib.getKeys(origColumns).length > 0) && objLib.lookUpKey(origColumns, property.property)) { columns[name][property.property] = origColumns[property.property]; }
              else { columns[name][property.property] = valLib.isDisplayColumn(property); }
            }
          }
        }
        else {
          if (!valLib.isOptional(property)) {
            if ((objLib.getKeys(origColumns).length > 0) && objLib.lookUpKey(origColumns, property.property)) { columns[name][property.property] = origColumns[property.property]; }
            else { columns[name][property.property] = valLib.isDisplayColumn(property); }
          }
        }
      }

      // Store Info
      resultInfo[name] = res['content'];
      pageInfo[name].maxPage = res['maxPage'];
      pageInfo[name].total = res['total'];

      // Set Filter State
      if (filterState) {
        filterState['applied'] = true;
        filterState['lastFilter'] = cloneDeep(filterArray);
      }

    },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);

    }

  );

}

// Retrieve Object Id (By Filter)
export async function retrieveObjectIdByFilter(config, apiObject, filterArray, timezone, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Get List API Call
  return await httpModule.get(`${config['apiRootUrl']}` + apiObject.toLowerCase() + `/list` + ((filterLib.filterAllowed(filterArray) && (filterLib.constructAPIFilter(filterArray, timezone).length > 0))?'&filter=' + filterLib.constructAPIFilter(filterArray, timezone):''), { headers }).toPromise().then(

    // Success
    res => {

      // Single Result
      if (res.length == 1) { return res[0]['id']; }

      // Not a Single Result
      else {
        console.warn('Unable to retrieve object id (by filter)');
        return null;
      }

    },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);
      return null;

    }

  );

}

// Retrieve Object (By Id)
export async function retrieveObjectById(config, apiObject, id, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Get List API Call
  return await httpModule.get(`${config['apiRootUrl']}` + apiObject.toLowerCase() + `/id/` + id.toString(), { headers }).toPromise().then(

    // Success
    res => { return res; },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);
      return null;

    }

  );

}

// Retrieve Object (By Attribute)
export async function retrieveObjectByAttr(config, apiObject, attr, val, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Get List API Call
  return await httpModule.get(`${config['apiRootUrl']}` + apiObject.toLowerCase() + `/list` + '&filter=(' + attr + '=' + (valLib.isString(val)?('"' + val + '"'):val.toString()) + ')', { headers }).toPromise().then(

    // Success
    res => {

      // Single Result
      if (res.length == 1) { return res[0]; }

      // Not a Single Result
      else {
        console.warn('Unable to retrieve object (by attribute)');
        return null;
      }

    },

    // Fail
    err => {

      // Error Occurred
      snackBarService.httpErrorOccurred(err);
      return null;

    }

  );

}

// Generate Default Sorting Array
export function defaultSortingArray(name='model') {
  let returnDict = {};
  returnDict[name] = {'attr': null, 'order': true};
  return returnDict;
}

// Generate Default Filter Array
export function defaultFilterState() { return {'applied': true, 'lastFilter': null}; }

// Generate Default Page Info
export function defaultPageInfo(name, pageNr) {
  let returnDict = {};
  returnDict[name] = {'page': 1, 'perPage': pageNr, 'maxPage': 1, 'total': null};
  return returnDict;
}

// Generate Default Columns
export function defaultColumns(name) {
  let returnDict = {};
  returnDict[name] = {};
  return returnDict;
}

// Generate Default Filter Array
export function defaultFilterArray(name, objectDefinition) {
  let returnDict = {};
  returnDict[name] = [{'property': [null], 'comparator': null, 'ref': null, 'object': [objectDefinition], 'lastProperty': null}];
  return returnDict;
}
