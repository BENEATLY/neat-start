//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Remove Special Characters
export function removeSpecialChars(input) {
  return input.replace(/[^a-zA-Z0-9]/g, '');
}

// Convert String To JSON
export function convertStringToJSON(val) { return JSON.parse(val); }

// Convert JSON To String
export function convertJSONToString(val) { return JSON.stringify(val); }
