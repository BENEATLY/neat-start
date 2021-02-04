//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Get Seperator Information for Locale
export function getSeparator(locale, separatorType) {
  const numberWithGroupAndDecimalSeparator = 1000.1;
  return Intl.NumberFormat(locale)['formatToParts'](numberWithGroupAndDecimalSeparator).find(part => part.type === separatorType).value;
}

// Format Number for Locale
export function formatNumber(val, locale) { return val.toLocaleString(locale); }
