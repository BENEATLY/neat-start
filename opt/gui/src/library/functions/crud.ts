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


// Get Allowed API Objects
export function getAllowedAPIObjects(config, right) {

  // No Definitions
  if (!objLib.lookUpKey(config['definitions'], 'Object')) { return []; }

  // Return Allowed API Objects
  return formatLib.formatUniqueBy(right.filter(x => x.apiaction.name == 'Get List').filter(x => objLib.lookUpKey(config['definitions']['Object'], x.apiobject.name) && objLib.lookUpKey(config['definitions']['Object'][x.apiobject.name], 'all')).filter(x => !['User', 'Team', 'Function', 'ApiAction', 'ApiObject', 'Right', 'Translation'].includes(x.apiobject.name)), ['apiobject']).filter(x => x.right == 'all').map(x => x.apiobject);

}

// Select API Object
export async function selectAPIObject(config, right, crudSelector, sortingArray, filterArray, pageInfo, accessLevel, disabledLevel, apiobject) {
  crudSelector.apiobject = apiobject;
  sortingArray.model = {'attr': null, 'order': true};
  filterArray.model = [{'property': [null], 'comparator': null, 'ref': null, 'object': [crudSelector.apiobject], 'lastProperty': null}];
  pageInfo.model.page = 1;
  objLib.updateExistingDict(accessLevel, definitionsLib.createViewList(config, right, 'Get List', crudSelector.apiobject, disabledLevel));
}
