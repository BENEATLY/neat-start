//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as objLib from '../../library/functions/object';


// Compare Values
export function compareValues(val1, val2, comparator) {
  if (comparator == '>') { return (val1 > val2); }
  if (comparator == '>=') { return (val1 >= val2); }
  if (comparator == '<') { return (val1 < val2); }
  if (comparator == '<=') { return (val1 <= val2); }
  if (comparator == '=') { return (val1 == val2); }
  if (comparator == '!=') { return (val1 != val2); }
}
