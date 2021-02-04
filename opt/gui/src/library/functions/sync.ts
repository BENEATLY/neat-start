//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Synchronous Wait (Blocking)
export function syncWait(ms) {
  var start = new Date().getTime();
  var end = start;
  while(end < start+ms) { end = new Date().getTime(); }
}

// Asynchronous Wait (Non-Blocking)
export function asyncWait(ms): Promise<boolean> {
  return new Promise<boolean>(resolve => { setTimeout(() => { resolve(true); }, ms); });
}
