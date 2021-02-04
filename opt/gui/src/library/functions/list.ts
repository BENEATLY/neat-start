//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Remove from List
export function removeFromList(properties, property, item) {
  properties.filter(obj => obj.property == property)[0].value = properties.filter(obj => obj.property == property)[0].value.filter(obj => obj !== item);
}

// Add To List
export function addToList(properties, property, acceptedList, additionList) {
  properties.filter(obj => obj.property == property)[0].value.push(acceptedList[property].filter(obj => obj.id == additionList[property])[0]);
  additionList[property] = null;
}

// Select List Option
export function selectListOption(selected, list, type, obj) {
  if (type == 'Right') {
    selected.model = list.model.filter(x => (x.apiobject.name == obj.apiobject.name) && (x.apiaction.name == obj.apiaction.name));
  }
}

// Make Unique List By Id
export function makeUniqueById(list) {
  let result = [];
  for (let item of list) {
    if (!result.map(obj => obj['id']).includes(item['id'])) { result.push(item); }
  }
  return result;
}
