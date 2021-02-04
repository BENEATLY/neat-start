//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as valLib from '../../library/functions/validate';
import * as objLib from '../../library/functions/object';

// Imports: Tools
import * as cloneDeep from 'lodash/cloneDeep';


// Format Unique By
export function formatUniqueBy(obj, params) {
  let rights = [];
  if (obj == null) { return []; }
  for (var i=0; i<obj.length; i++) {
    if (!rights.find(x => valLib.isEqualWithParams(x, obj[i], params))) { rights.push(obj[i]); }
  }
  return rights;
}

// Format Filter By
export function formatFilterBy(obj, ref, params) {
  return obj.filter(x => valLib.isEqualWithParams(x, ref, params));
}

// Push Object in Format
export function enterObject(format, obj) {
  let filledFormat = cloneDeep(format);
  let keys = objLib.getKeys(obj);
  for(var elem in filledFormat) {
    if (keys.includes(filledFormat[elem]['property'])) { filledFormat[elem]['value'] = obj[filledFormat[elem]['property']]; }
    else if (filledFormat[elem]['property'].includes('.')) { filledFormat[elem]['value'] = objLib.getSubProperty(obj, filledFormat[elem]['property']); }
  }
  return filledFormat;
}

// Push Variables in Format
export function enterVariables(config, val) {
  for(var key in val) {
    if (val[key] === Object(val[key])) { val[key] = enterVariables(config, val[key]); }
    else {
      if ((val[key] != null) && val[key].toString().includes('{{') && val[key].toString().includes('}}')) {
        let valToReplace = (' ' + val[key]).slice(1);
        let matches = valToReplace.match(/{\{.+?}\}/g);
        for(var occ in matches) {
          let newVal = matches[occ].replace('{{', '').replace('}}', '')
          val[key] = val[key].replace(matches[occ], config[newVal])
        }
      }
    }
  }
  return val;
}

// Format Info
export function formatInfo(config, type, obj, level: string = 'all') {
  let format = enterVariables(config, config['definitions']['Object'][type][level]);
  if (obj == null) { return format; }
  else { return enterObject(format, obj); }
}

// Format Multiple Info
export function formatMultipleInfo(config, type, objlist, level: string = 'all') {
  return objlist.map(obj => formatInfo(config, type, obj, level));
}
