//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as objLib from '../../library/functions/object';


// Are the Rights Sufficient?
export function sufficientRights(rights, apiObject, apiAction, level) {

  // No Rights
  if (rights == null) { return false; }

  // Iterate over Rights
  for (var i=0; i<rights.length; i++) {

    // Look for Matching Rights
    if ((rights[i]['apiobject']['name'] == apiObject) && (rights[i]['apiaction']['name'] == apiAction)) {
      if ((level == 'all') && (rights[i]['right'] == 'all')) { return true; }
      else if ((level == 'isolated') && ((rights[i]['right'] == 'all') || (rights[i]['right'] == 'isolated'))) { return true; }
      else if ((level == 'own') && ((rights[i]['right'] == 'all') || (rights[i]['right'] == 'isolated') || (rights[i]['right'] == 'own'))) { return true; }
    }

  }

  // No Matching Right Found
  return false;

}
