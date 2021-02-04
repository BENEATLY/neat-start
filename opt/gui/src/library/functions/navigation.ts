//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as objLib from '../../library/functions/object';
import * as valLib from '../../library/functions/validate';
import * as rightLib from '../../library/functions/right';
import * as definitionsLib from '../../library/functions/definitions';
import * as genLib from '../../library/functions/generator';
import * as routeLib from '../../library/functions/route';


// Check Path
export function checkPath(pathName, path) { return (pathName == path); }

// Get Navigation
export function getNavigation(config, rights, type, subPath) {
  let navigations = [];
  if (type == 'leftbar') {
    navigations = config['navigation']['leftbar'].filter(nav => (nav.path == subPath));
    if (navigations.length == 1) { return filterLeftBarByRights(config, rights, navigations[0]); }
    else { return null; }
  }
  else if (type == 'navbar') { return filterNavBarByRights(config, rights, config['navigation']['navbar'][subPath]); }
  else { return null; }
}

// Filter Left Bar Navigation By Rights
export function filterLeftBarByRights(config, rights, navigations) {
  navigations.items = navigations.items.filter(navigation => ((!objLib.lookUpKey(navigation, 'rights')) || navigation.rights.every(right => (((objLib.lookUpKey(right, 'specific') && (right.specific))?(definitionsLib.lookUpDefinitions(config, rights, right.action, right.object) == right.level):rightLib.sufficientRights(rights, right.object, right.action, right.level))))));
  return navigations;
}

// Filter Nav Bar Navigation By Rights
export function filterNavBarByRights(config, rights, navigations) {
  navigations = navigations.filter(navigation => ((!objLib.lookUpKey(navigation, 'rights')) || navigation.rights.every(right => (((objLib.lookUpKey(right, 'specific') && (right.specific))?(definitionsLib.lookUpDefinitions(config, rights, right.action, right.object) == right.level):rightLib.sufficientRights(rights, right.object, right.action, right.level))))));
  return navigations;
}

// Get Navigation Items
export function getNavItems(config, routes, url) {
  let items = [];
  let fullPath = url.map(url => url.path);
  for (let nr of genLib.increasingArray(fullPath.length)) {
    if (routes.filter(route => (route.type == 'fixed')).map(route => route.path).includes(fullPath.slice(0, nr+1).join('/'))) { items.push({'name': fullPath.slice(0, nr+1).join('.') + '.pagetitle', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (routes.filter(route => (route.type == 'fixed-ref')).map(route => route.path).includes(fullPath.slice(0, nr+1).join('/'))) { items.push({'name': fullPath.slice(0, nr+1).join('.') + '.pagetitle', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (!valLib.isStringInt(fullPath.slice(nr, nr+1)[0]) && (routes.filter(route => (route.type == 'item')).map(route => route.path).includes(fullPath.slice(nr, nr+1)[0]))) { items.push({'name': 'object.' + definitionsLib.getObjectName(config, fullPath.slice(nr, nr+1)[0]) + '.naming.singular', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if ((routes.filter(route => (route.type == 'item-list')).map(route => route.path).includes(fullPath.slice(nr, nr+1)[0])) || (routes.filter(route => (route.type == 'item-list')).map(route => route.path).includes(fullPath.slice(0, nr+1).join('/')))) { items.push({'name': 'object.' + definitionsLib.getObjectName(config, fullPath.slice(nr, nr+1)[0]) + '.naming.singular', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (routes.filter(route => (route.type == 'custom')).map(route => route.path).includes(fullPath.slice(0, nr+1).join('/'))) { items.push({'name': fullPath.slice(0, nr+1).join('.') + '.pagetitle', 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (valLib.isStringInt(fullPath.slice(nr, nr+1)[0]) && ((routes.filter(route => (route.type == 'item')).map(route => route.path).includes(fullPath.slice(nr-1, nr)[0])) || (routes.filter(route => (route.type == 'item')).map(route => route.path).includes(fullPath.slice(0, nr).join('/'))))) { items.push({'value': fullPath.slice(nr, nr+1)[0], 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else if (valLib.isStringInt(fullPath.slice(nr, nr+1)[0]) && ((routes.filter(route => (route.type == 'item-id')).map(route => route.path).includes(fullPath.slice(nr-1, nr)[0])) || (routes.filter(route => (route.type == 'item-id')).map(route => route.path).includes(fullPath.slice(0, nr).join('/'))))) { items.push({'value': fullPath.slice(nr, nr+1)[0], 'ref': fullPath.slice(0, nr+1).join('/')}); }
    else { items.push({'name': fullPath.slice(0, nr+1).join('.') + '.pagetitle', 'ref': null}); }
  }
  return items;
}

// Generate Sub Navigate Path
export function genSubNavPath(url, objectDef, item, property, val) {
  let fullPath = url.map(url => url.path);
  if (valLib.isStringInt(fullPath.slice(-1)[0])) {
    if (val) { return ('/' + fullPath.join('/') + '/' + property.property.toLowerCase() + '/' + val.id.toString()); }
    else { return ('/' + fullPath.join('/') + '/' + property.property.toLowerCase()); }
  }
  else {
    if (property) {
      if (objectDef.toLowerCase() != fullPath.slice(-1)[0].toLowerCase()) {
        if (val) { return ('/' + fullPath.join('/') + '/' + objectDef.toLowerCase() + '/' + item.id.toString() + '/' + property.property.toLowerCase() + '/' + val.id.toString()); }
        else { return ('/' + fullPath.join('/') + '/' + objectDef.toLowerCase() + '/' + item.id.toString() + '/' + property.property.toLowerCase()); }
      }
      else {
        if (val) { return ('/' + fullPath.join('/') + '/' + item.id.toString() + '/' + property.property.toLowerCase() + '/' + val.id.toString()); }
        else { return ('/' + fullPath.join('/') + '/' + item.id.toString() + '/' + property.property.toLowerCase()); }
      }
    }
    else {
      if (objectDef.toLowerCase() != fullPath.slice(-1)[0].toLowerCase()) { return ('/' + fullPath.join('/') + '/' + objectDef.toLowerCase() + '/' + item.id.toString()); }
      else { return ('/' + fullPath.join('/') + '/' + item.id.toString()); }
    }
  }
}

// Sub Navigate
export function subNav(router, url, objectName, item, property, val) { routeLib.navigate(router, genSubNavPath(url, objectName, item, property, val)); }
