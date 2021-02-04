//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as objLib from '../../library/functions/object';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Apply Filters on List
export function applyFiltersOnList(list, filters) {

  // Filtered Results Variable
  let result = [];

  // Iterate over List
  for (let item of list) {

    // Iterate over Applied Filters
    for (let filter of filters) {

      // Determine # Parameters
      let nrOfParameters = filter.split('${').length - 1;

      // Iterate over Parameters
      for (var i=0; i<nrOfParameters; i++) {

        // Content of Parameter
        let parameter = filter.split('${')[1].split('}')[0];

        // Sub Attribute
        if (!parameter.includes('.')) { filter = filter.replace('${' + parameter + '}', item[parameter]); }

        // Direct Attribute
        else { filter = filter.replace('${' + parameter + '}', objLib.getSubProperty(item[parameter.split('.')[0]], parameter.split(parameter.split('.')[0] + '.')[1])); }

        // Equal Filter
        if (filter.includes(' == ')) {
          if (filter.split(' == ')[0] == filter.split(' == ')[1]) { result.push(item); }
        }

        // Not Equal Filter
        if (filter.includes(' != ')) {
          if (filter.split(' != ')[0] != filter.split(' != ')[1]) { result.push(item); }
        }

      }

    }

  }

  // Return Filtered List
  return result;

}

// Filter Values which are Not Chosen (Yet)
export function filterNotSelected(info, values) {
  return info.filter(obj => !values.map(a => a.id).includes(obj.id));
}
