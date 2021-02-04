//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as objLib from '../../library/functions/object';


// Look Up Definitions
export function lookUpDefinitions(config, rights, action, object, level = null) {

  // No Rights
  if (objLib.isEmptyObject(rights)) { return false; }

  // Right Found Variable
  let rightFound = null;

  // Filter Rights by API Action & API Object
  let rightLevel = rights.filter(obj => (obj['apiaction']['name'] == action) && (obj['apiobject']['name'] == object))

  // Find Highest Matching Right
  if (rightLevel.length > 0) {
    if (rightLevel.filter(obj => (obj['right'] == 'all')).length > 0) { rightFound = 'all'; }
    else if (rightLevel.filter(obj => (obj['right'] == 'isolated')).length > 0) { rightFound = 'isolated'; }
    else if (rightLevel.filter(obj => (obj['right'] == 'own')).length > 0) { rightFound = 'own'; }
  }

  // Found Matching Right
  if (rightFound != null) {

    // Evaluate with Given Level
    if (level != null) {
      if ((level == 'all') && (rightFound != 'all')) { return false; }
      if ((level == 'isolated') && (rightFound == 'own')) { return false; }
    }

    // Return Right if Found in Definitions
    if (objLib.lookUpKey(config['definitions'], 'Object') && objLib.lookUpKey(config['definitions']['Object'], object) && objLib.lookUpKey(config['definitions']['Object'][object], rightFound) && (config['definitions']['Object'][object][rightFound] != null)) {
      return rightFound;
    }

    // No Definitions Found
    else { return false; }

  }

  // No Matching Right
  else { return false; }

}

// Get Definitions for Page
export function getDefinitionsForPage(config, right, pageObjectDefinition, objectDefinition, action, name, displayOptions) {
  if (objectDefinition == pageObjectDefinition) {
    if (objLib.lookUpKey(displayOptions, name) && objLib.lookUpKey(displayOptions[name], 'level')) { return config['definitions']['Object'][objectDefinition][displayOptions[name]['level']]; }
    else { return config['definitions']['Object'][objectDefinition][lookUpDefinitions(config, right, action, objectDefinition)]; }
  }
  else { return config['definitions']['Object'][objectDefinition][lookUpDefinitions(config, right, action, objectDefinition)]; }
}

// Create View List
export function createViewList(config, right, action, objectDefinition, disabledLevel) {
  let level = lookUpDefinitions(config, right, action, objectDefinition);
  let accessLevel = {'selected': null, 'options': []};
  if (level == false) { accessLevel.options = []; }
  else if (level == 'all') { accessLevel.options = ['all', 'isolated', 'own']; }
  else if (level == 'isolated') { accessLevel.options = ['isolated', 'own']; }
  else if (level == 'own') { accessLevel.options = ['own']; }
  accessLevel.options = accessLevel.options.filter(option => (!disabledLevel.includes(option)));
  if (accessLevel.options.length > 0) { accessLevel.selected = accessLevel.options[0]; }
  return accessLevel;
}

// Get Object Name
export function getObjectName(config, name) {
  let objectNames = objLib.getKeys(config['definitions']['Object']).filter(x => ((x != null) && (x.toLowerCase() == name.toLowerCase())));
  if (objectNames.length == 1) { return objectNames[0]; }
  else { return null; }
}
