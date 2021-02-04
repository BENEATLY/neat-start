//  Author:     Thomas D'haenens
//  Created:    14/09/2019 8:21
//  License:    GPLv3


// Imports: Libraries
import * as valLib from '../../library/functions/validate';
import * as objLib from '../../library/functions/object';


// Image Focus
export function imageFocus(focusService, meta) {

  // Open Focus Window
  focusService.open('image', meta).subscribe();

}
