//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as valLib from '../../library/functions/validate';
import * as objLib from '../../library/functions/object';


// Info Modal
export function infoModal(modalService, entries, meta) {

  // Gather Properties
  let properties = entries;

  // Open Modal Window
  modalService.open('info', [properties, meta]).subscribe();

}

// Property Modal
export function propertyModal(modalService, entries, meta, updateRef) {

  // Construct List
  if (!objLib.lookUpKey(meta, 'list')) { meta.list = (meta.config['apiRootUrl'] + meta.object.name.toLowerCase() + '/list'); }

  // Construct URL
  if (!objLib.lookUpKey(meta, 'url')) {
    if (meta.type == 'Edit') { meta.url = (meta.config['apiRootUrl'] + meta.object.name.toLowerCase() + '/edit/'); }
    else if (meta.type == 'Delete') { meta.url = (meta.config['apiRootUrl'] + meta.object.name.toLowerCase() + '/delete/'); }
    else if (meta.type == 'Create') { meta.url = (meta.config['apiRootUrl'] + meta.object.name.toLowerCase() + '/create'); }
  }

  // Gather Properties
  let properties = [];
  for (var i=0; i<entries.length; i++) {
    properties.push({'name': entries[i].name, 'property': entries[i].property, 'value': entries[i].value, 'initialValue': entries[i].value, 'comparedValue': null, 'accepted': entries[i].accepted, 'existingList': [], 'visible': valLib.isVisible(entries[i]), 'required': valLib.isRequired(entries[i]), 'optional': valLib.isOptional(entries[i]), 'implicit': valLib.hasImplicitValue(entries[i]), 'disabled': valLib.isDisabled(entries[i]), 'editable': valLib.isEditable(entries[i]), 'external': valLib.isExternal(entries[i]), 'self-only': valLib.isSelfOnly(entries[i]), 'compressed': valLib.isCompressed(entries[i]), 'reference': valLib.hasReference(entries[i])});
  }

  // Open Modal Window
  modalService.open('property', [properties, meta]).subscribe(t => { updateRef.trigger("update"); });

}

// EULA Modal
export function EULAModal(modalService) {

  // Open Modal Window
  modalService.open('eula').subscribe();

}

// Long Content Modal
export function longContentModal(modalService, meta) {

  // Open Modal Window
  modalService.open('longcontent', meta).subscribe();

}

// Help Modal
export function helpModal(modalService, meta) {

  // Open Modal Window
  modalService.open('help', meta).subscribe();

}
