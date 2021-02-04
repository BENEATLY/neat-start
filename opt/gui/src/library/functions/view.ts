//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Zoom
export function zoom(factor, action, boundaries, step) {

  // Zoom In
  if (action) {
    if (factor <= boundaries[1]) { factor += step; }
  }

  // Zoom Out
  else if (factor > boundaries[0]) { factor -= step; }

  // Return Factor
  return factor;

}
