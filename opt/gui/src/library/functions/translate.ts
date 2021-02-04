//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as definitionsLib from '../../library/functions/definitions';
import * as objLib from '../../library/functions/object';


// Has Translation
export function hasTranslation(translate, ref, prop={}) { return (ref.toLowerCase() != translate.instant(ref, prop).toLowerCase()); }

// Construct Property Name Translation
export function constructPropertyName(objectDefinition, property) { return ('object.' + objectDefinition + '.properties.' + property.property); }

// Construct Property Help Object Intro Translation
export function constructObjectHelpIntro(objectDefinition) { return ('object.' + objectDefinition + '.help.intro'); }

// Construct Property Help Message Translation
export function constructPropertyHelpMessage(objectDefinition, property) { return ('object.' + objectDefinition + '.help.properties.' + property.property); }

// Construct Comparator Translation
export function constructComparatorName(comparator) { return ('common.comparator.' + comparator.comparator); }

// Construct Singular Plural (by Number)
export function constructSP(objectDefinition, number) {
  if (number == 1) { return ('object.' + objectDefinition + '.naming.singular'); }
  else { return ('object.' + objectDefinition + '.naming.plural'); }
}

// Construct Modal Title Translation
export function constructModalTitleTranslation(objectDefinition, modalType) { return ('object.' + objectDefinition + '.modal.' + modalType + '.title'); }

// Construct Property Presentation Translation
export function constructPropertyPresentation(objectDefinition, level) { return ('object.' + objectDefinition + '.presentation.' + level); }

// Construct Property Value Translation
export function constructPropertyValuePresentation(objectDefinition, property, item) { return ('object.' + objectDefinition + '.values.' + property + '.' + item[property].replace(/\s/g, '-')); }

// Construct Translation Properties
export function constructTranslationProperties(config, right, pageObjectDefinition, objectDefinition, action, name, displayOptions, translate) { return definitionsLib.getDefinitionsForPage(config, right, pageObjectDefinition, objectDefinition, action, name, displayOptions).map(property => translate.instant(constructPropertyName(objectDefinition, property))); }

// Get Object Name
export function getObjectName(config, name) {
  let objectNames = objLib.getKeys(config['definitions']['Object']).filter(x => (x.toLowerCase() == name.toLowerCase()));
  if (objectNames.length == 1) { return objectNames[0]; }
  else { return null; }
}
