// Translation Item Property Function
export function getTranslationItemProperty(item, lang, property) { return property.split('.').reduce((o,i)=>o[i], item); }

// Construct Formatter Dictionary
const formatterDict = {
  'property': getTranslationItemProperty
};

// Export Formatter Dict
export { formatterDict };
