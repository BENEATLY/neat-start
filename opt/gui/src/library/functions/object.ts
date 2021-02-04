//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Tools
import * as math from 'mathjs';


// Look for Key
export function lookUpKey(dict, ref) {
  if (ref in dict) { return true; }
  else { return false; }
}

// Get Keys of Object
export function getKeys(obj) { return Object.keys(obj); }

// Is Object?
export function isObject(obj) { return (obj === Object(obj)); }

// Empty Object?
export function isEmptyObject(obj) {
  if (isObject(obj)) {
    if (getKeys(obj).length === 0) { return true; }
    else { return false; }
  }
  else { return false; }
}

// Get Sub Property
export function getSubProperty(obj, parameter) {
  let nrOfSubProperties = parameter.split('.').length;
  let val = obj;
  for (var i=0; i<nrOfSubProperties; i++) { val = val[parameter.split('.')[i]]; }
  return val;
}

// Evaluate Statement
export function evaluateStatement(statement, properties, acceptedList) {

  // Number
  if (typeof statement == 'number') { return statement; }

  // Statement with Brackets Found
  if (statement.includes('${')) {

    // Determine # Statements
    let nrOfParameters = statement.split('${').length - 1;

    // Iterate over Statements
    for (var i=0; i<nrOfParameters; i++) {

      // Content of Statement
      let parameter = statement.split('${')[1].split('}')[0];

      // Sub Attribute
      if (!parameter.includes('.')) { statement = statement.replace('${' + parameter + '}', properties.filter(x => x.property == parameter)[0].value); }

      // Direct Attribute
      else { statement = statement.replace('${' + parameter + '}', getSubProperty(acceptedList[parameter.split('.')[0]].filter(x => x.id == properties.filter(x => x.property == parameter.split('.')[0])[0].value)[0], parameter.split(parameter.split('.')[0] + '.')[1])); }

    }
  }

  // Return Result (Math Required)
  if (statement.includes('math(')) { return math.evaluate(statement.split('math(')[1].split(')')[0]); }

  // Return Result
  else { return statement; }

}

// Create Item By Properties
export function createItemByProperties(properties) {
  let item = {};
  properties.forEach(property => { item[property.property] = property.value; });
  return item;
}

// Update Existing Dict
export function updateExistingDict(origDict, newDict) {
  for (let key of getKeys(newDict)) { origDict[key] = newDict[key]; }
  return origDict;
}
