//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Declarations: JQuery
declare var $: any;


// Class Exists?
export function classExists(name) { return ($('.' + name).length?true:false); }

// Has Class
export function hasClass(id, ref) { return $('#' + id).hasClass(ref); }

// Add Class to Id
export function addClass(id, ref) { $('#' + id).addClass(ref); }

// Remove Class to Id
export function removeClass(id, ref) { $('#' + id).removeClass(ref); }

// Add Class to Class
export function addClassbyClass(name, ref) { $('.' + name).addClass(ref); }

// Remove Class to Class
export function removeClassbyClass(name, ref) { $('.' + name).removeClass(ref); }

// Get Class List
export function getClassListByClass(name) { return $('.' + name).attr('class').split(/\s+/); }
