//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Default
import { HttpHeaders } from '@angular/common/http';

// Imports: Libraries
import * as objLib from '../../library/functions/object';
import * as classLib from '../../library/functions/class';
import * as valLib from '../../library/functions/validate';
import * as compLib from '../../library/functions/compare';
import * as sortLib from '../../library/functions/sort';
import * as timeLib from '../../library/functions/time';
import * as definitionsLib from '../../library/functions/definitions';
import * as translateLib from '../../library/functions/translate';
import * as numberLib from '../../library/functions/number';
import * as formatLib from '../../library/functions/format';
import * as pageLib from '../../library/functions/page';
import * as navigationLib from '../../library/functions/navigation';


// Declarations: JQuery
declare var $: any;


// Custom Presentation
export function customPresentation(config, userData, translate, obj, property) {
  if (objLib.lookUpKey(property.accepted, 'presentation')) { return readProperty(obj, property.accepted.presentation); }
  else if (valLib.hasReference(property)) { return translate.instant(translateLib.constructPropertyPresentation(valLib.hasReference(property), definitionsLib.lookUpDefinitions(config, userData.right, 'Get List', valLib.hasReference(property))), {item: obj}); }
  else { return translate.instant('common.table.unknown').toUpperCase(); }
}

// Present Object
export function presentObject(item) {
  if (item.filter(obj => obj.property == 'name').length > 0) {
    return item.filter(obj => obj.property == 'name')[0].value;
  }
}

// Compress Content
export function compressContent(property) { return ((valLib.isDefinedString(property) && ((!valLib.hasMaxConstraint(property)) || (property.accepted.max > 99))) || (valLib.isExternal(property) && valLib.isCompressed(property))); }

// Beautify JSON
export function beautifyJson(str) { return JSON.stringify(JSON.parse(str), null, 4); }

// Add Unit Presentation
export function addUnitPresentation(content, property, unit=null) {
  if (property != null) {
    if (valLib.hasPreUnitPresentation(property)) { return (property.accepted.unit + ' ' + content); }
    else { return (content + ' ' + property.accepted.unit); }
  }
  else { return (content + ' ' + unit); }
}

// Apply Visualisation
export function applyVisualision(val, property, obj, timezone, specifics: object = {}) {
  let returnHTML = (valLib.isTimeDependent(property)?timeLib.convertTimeDependentToString(val, property, timezone):((valLib.isDefinedNumber(property))?numberLib.formatNumber(val, timezone.locale):val));
  if (valLib.hasVisualisation(property)) {
    if (valLib.isDefinedNumber(property)) {
      if (getVisualisationOptions('sign', property).length) { returnHTML = (val<0?"":(val>0?"+":"")) + returnHTML; }
      if (getVisualisationOptions('progress-bar', property).length) { return getProgressBarVisualisation(val, property, obj, specifics); }
      if (objLib.lookUpKey(specifics, 'info') && specifics['info']) {
        if (valLib.hasUnitPresentation(val, property)) { returnHTML = addUnitPresentation(returnHTML, property); }
      }
      if (getVisualisationOptions('highlight', property).length) { return getHighlightVisualisation(returnHTML, property, obj, specifics); }
      return returnHTML;
    }
    else if (valLib.isDefinedString(property)) {
      if (getVisualisationOptions('url', property).length) { return getURLVisualisation(returnHTML, property, obj, specifics); }
      return returnHTML;
    }
    else { return returnHTML; }
  }
  else {
    if (valLib.hasUnitPresentation(val, property) && (!objLib.lookUpKey(specifics, 'unit') || specifics['unit'])) { returnHTML = addUnitPresentation(returnHTML, property); }
    return returnHTML;
  }
}

// Get Sign Visualisation Options
export function getVisualisationOptions(type, property) { return property.visualisation.filter(item => item.type == type); }

// Get Progress Bar Visualisation
export function getProgressBarVisualisation(val, property, obj, specifics) {
  let visualisation = getVisualisationOptions('progress-bar', property)[0];
  if (objLib.lookUpKey(visualisation, 'options')) {
    let options = visualisation.options;
    let maxValue = (objLib.lookUpKey(options, 'max')?readProperty(obj, options.max):100);
    let showValue = ((((!objLib.lookUpKey(options, 'showValue')) || (options.showValue)) && (val >= (maxValue/5))) || (objLib.lookUpKey(specifics, 'info') && specifics.info));
    let unit = (objLib.lookUpKey(options, 'unit')?options.unit:'');
    let animated = (objLib.lookUpKey(options, 'animated')?options.animated:false);
    let absolute = (objLib.lookUpKey(options, 'absolute')?options.absolute:false);
    let success = (objLib.lookUpKey(options, 'success')?compLib.compareValues(readProperty(obj, options.success.value), options.success.level, options.success.comparator):false);
    let info = (objLib.lookUpKey(options, 'info')?compLib.compareValues(readProperty(obj, options.info.value), options.info.level, options.info.comparator):false);
    let warning = (objLib.lookUpKey(options, 'warning')?compLib.compareValues(readProperty(obj, options.warning.value), options.warning.level, options.warning.comparator):false);
    let danger = (objLib.lookUpKey(options, 'danger')?compLib.compareValues(readProperty(obj, options.danger.value), options.danger.level, options.danger.comparator):false);
    let width = (showValue?(((((val / maxValue) * 100)) >= 8)?(((val / maxValue) * 100)):8):(((val / maxValue) * 100)));
    let progressBarStyle = (danger?' progress-bar-danger':(warning?' progress-bar-warning':(success?' progress-bar-success':(info?' progress-bar-info':''))));
    return '<div class="progress progress-bar-center"' + ((objLib.lookUpKey(specifics, 'info') && specifics.info)?' style="width:50%;"':'') + '><div class="progress-bar' + progressBarStyle + (animated?' progress-bar-striped':'') + ' active" role="progressbar" style="width: ' + width.toFixed(1) + '%;">' + (showValue?(absolute?addUnitPresentation(val.toFixed(0), null, unit):addUnitPresentation((((val / maxValue) * 100)).toFixed(0), null, unit)):'') + '</div></div>';
  }
  else {
    let maxValue = 100;
    let showValue = ((val >= (maxValue/5)) || (objLib.lookUpKey(specifics, 'info') && specifics.info));
    let unit = '';
    let animated = false;
    let absolute = false;
    let success = false;
    let info = false;
    let warning = false;
    let danger = false;
    let width = (showValue?(((((val / maxValue) * 100)) >= 8)?(((val / maxValue) * 100)):8):(((val / maxValue) * 100)));
    let progressBarStyle = (danger?' progress-bar-danger':(warning?' progress-bar-warning':(success?' progress-bar-success':(info?' progress-bar-info':''))));
    return '<div class="progress progress-bar-center"' + ((objLib.lookUpKey(specifics, 'info') && specifics.info)?' style="width:50%;"':'') + '><div class="progress-bar' + progressBarStyle + (animated?' progress-bar-striped':'') + ' active" role="progressbar" style="width: ' + width.toFixed(1) + '%;">' + (showValue?(absolute?addUnitPresentation(val.toFixed(0), null, unit):addUnitPresentation((((val / maxValue) * 100)).toFixed(0), null, unit)):'') + '</div></div>';
  }
}

// Get Highlight Visualisation
export function getHighlightVisualisation(returnHTML, property, obj, specifics) {
  let visualisation = getVisualisationOptions('highlight', property)[0];
  if (objLib.lookUpKey(visualisation, 'options')) {
    let options = visualisation.options;
    let highlights = options.filter(option => compLib.compareValues(readProperty(obj, option.value), option.level, option.comparator));
    if (highlights.length) {
      let highlight = sortLib.sortBy(highlights, 'priority', false)[0];
      return '<div style="' + ((objLib.lookUpKey(highlight, 'bold') && highlight['bold'])?'font-weight:500;':'') + ((objLib.lookUpKey(highlight, 'color') && highlight['color'])?'color:' + highlight['color'] + ';':'') + '">' + returnHTML + '</div>';
    }
    return returnHTML;
  }
  else { return returnHTML; }
}

// Get URL Visualisation
export function getURLVisualisation(returnHTML, property, obj, specifics) {
  let visualisation = getVisualisationOptions('url', property)[0];
  if (objLib.lookUpKey(visualisation, 'options') && objLib.lookUpKey(visualisation.options, 'icon')) { return '<a class="' + visualisation['options']['icon'] + ' glyphicon-table-content" href="' + returnHTML + '"></a>'; }
  else { return '<a class="glyphicon glyphicon-share glyphicon-table-content" href="' + returnHTML + '"></a>'; }
}

// Get Boolean Visualisation
export function getBooleanVisualisation(property) {
  if (property.value) { return '<input type="checkbox" class="infopage-checkbox" checked disabled>'; }
  else { return '<input type="checkbox" class="infopage-checkbox" disabled>'; }
}

// Read Property
export function readProperty(obj, definitions) {
  if (!valLib.isString(definitions)) { return definitions; }
  let nrOfParameters = definitions.split('${').length - 1;
  for (var i=0; i<nrOfParameters; i++) {
    let parameter = definitions.split('${')[1].split('}')[0];
    if (!parameter.includes('.')) { definitions = definitions.replace('${' + parameter + '}', obj[parameter]); }
    else { definitions = definitions.replace('${' + parameter + '}', objLib.getSubProperty(obj, parameter)); }
  }
  return definitions;
}

// Needs Bottom Space
export function needsBottomSpace(properties) {
  if (properties.filter(prop => valLib.isTimeDependent(prop)).length) {
    let lastProperties = (properties.length>4?properties.slice(1).slice(-4):properties);
    if (lastProperties.filter(prop => valLib.isTimeDependent(prop)).length) {
      if (lastProperties.filter(prop => ((valLib.isDefinedString(prop) && ((!valLib.hasMaxConstraint(prop)) || (prop.accepted.max > 99))))).length) { return false; }
      else { return true; }
    }
    else { return false; }
  }
  else { return false; }
}

// Determine Property Line Max Width
export function determinePropertyNameLineMaxWidth(translate, objectName, properties, ratio = 1) {
  let translatedProperties = [];
  for (let property of properties) { translatedProperties.push(translate.instant(translateLib.constructPropertyName(objectName, property)).length); }
  let max = Math.max.apply(null, translatedProperties);
  if (max > 10) { return ((158 + 13*(max-10)) * ratio).toString() + 'px'; }
  else { return ((158 * ratio).toString() + 'px'); }
}

// Determine Property Line Max Width By Array
export function determinePropertyNameLineMaxWidthByArray(translate, properties, ratio = 1) {
  let translatedProperties = [];
  for (let property of properties) { translatedProperties.push(translate.instant(property).length); }
  let max = Math.max.apply(null, translatedProperties);
  if (max > 10) { return ((148 + 13*(max-10)) * ratio).toString() + 'px'; }
  else { return ((148 * ratio).toString() + 'px'); }
}

// Get App Logo
export function getAppLogo(config) { return '/assets/logos/neatly-logo-white.png'; }

// Get App Title
export function getAppTitle(config) { return 'NEATLY - Application'; }

// Get App Icon
export function getAppIcon(config) {

  // Dark Theme
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) { return '/assets/icons/neatly-icon-white.ico'; }

  // White Theme
  else { return '/assets/icons/neatly-icon-gradient.ico'; }

}

// Slide Panel
export function slidePanel(event) {
  let heading = $(event.target.closest('.panel-heading'));
  if (heading.hasClass('collapsed')) { heading.removeClass('collapsed'); }
  else { heading.addClass('collapsed'); }
  heading.next('.panel-wrapper').slideToggle("slow");
}

// Toggle NavBar Collapse
export function toggleNavBarCollapse() {

  // Check Collapse State
  let collapsed = classLib.hasClass('content-page', 'collapse-visibility');

  // Uncollapse
  if (collapsed) {
    classLib.removeClass('content-page', 'collapse-visibility');
    classLib.removeClass('left-nav-bar', 'collapse-visibility');
    classLib.removeClass('navbar-brand', 'collapse-visibility');
  }

  // Collapse
  else {
    classLib.addClass('content-page', 'collapse-visibility');
    classLib.addClass('left-nav-bar', 'collapse-visibility');
    classLib.addClass('navbar-brand', 'collapse-visibility');
  }

}

// Generate Greeting
export function generateGreeting(type, translation, now) {
  let translations = [];
  for (let transl of objLib.getKeys(translation.translationContent['common']['greetings'][type]['regular'])) { translations.push('common.greetings.' + type + '.regular.' + transl); }
  for (let transl of objLib.getKeys(translation.translationContent['common']['greetings'][type]['time-based']['week'])) {
    if (+transl == now.day()) { translations.push('common.greetings.' + type + '.time-based.week.' + transl); }
  }
  let smallestDiff = 24;
  let hoursDiff = [];
  for (let transl of objLib.getKeys(translation.translationContent['common']['greetings'][type]['time-based']['day'])) {
    let diff = now.hour() - (+transl);
    if (diff < 0) { diff += 24; }
    if (diff < smallestDiff) {
      smallestDiff = diff;
      hoursDiff = [transl];
    }
    else if (diff == smallestDiff) { hoursDiff.push(transl); }
  }
  for (let transl of hoursDiff) { translations.push('common.greetings.' + type + '.time-based.day.' + transl); }
  return translations[Math.floor(Math.random() * translations.length)];
}

// Get Profile Picture
export function getProfilePicture(userData) {
  if (objLib.lookUpKey(userData, 'info') && objLib.lookUpKey(userData.info, 'image') && (userData.info.image != null)) { return '/assets/objects/' + userData.info.image.reference; }
  else { return '/assets/images/profile.png'; }
}

// Get Footer Logo
export function getFooterLogo(config) {
  if (objLib.lookUpKey(config, 'commonStyle') && objLib.lookUpKey(config.commonStyle, 'footer') && objLib.lookUpKey(config.commonStyle.footer, 'logo')) {
    if (config.commonStyle.footer.logo) { return config.commonStyle.footer.logo; }
    else { return null; }
  }
  else { return '/assets/logos/neatly-logo-black.png'; }
}

// Get Footer Logo Link
export function getFooterLogoLink(config) {
  if (objLib.lookUpKey(config, 'commonStyle') && objLib.lookUpKey(config.commonStyle, 'footer') && objLib.lookUpKey(config.commonStyle.footer, 'logoLink')) {
    if (config.commonStyle.footer.logoLink) { return config.commonStyle.footer.logoLink; }
    else { return null; }
  }
  else { return 'https://neatly.be/'; }
}

// Get Footer Contact Link
export function getFooterContactLink(config) {
  if (objLib.lookUpKey(config, 'commonStyle') && objLib.lookUpKey(config.commonStyle, 'footer') && objLib.lookUpKey(config.commonStyle.footer, 'contactLink')) {
    if (config.commonStyle.footer.contactLink) { return config.commonStyle.footer.contactLink; }
    else { return null; }
  }
  else { return 'https://neatly.be/'; }
}

// Get Footer Copyright
export function getFooterCopyright(config) {
  if (objLib.lookUpKey(config, 'commonStyle') && objLib.lookUpKey(config.commonStyle, 'footer') && objLib.lookUpKey(config.commonStyle.footer, 'copyright')) {
    if (config.commonStyle.footer.copyright) { return true; }
    else { return false; }
  }
  else { return true; }
}
