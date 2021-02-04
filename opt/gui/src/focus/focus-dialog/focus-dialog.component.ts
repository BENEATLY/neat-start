/*
  Link: https://github.com/angular-patterns/ng-bootstrap-modal
  License: Open Source (Undefined)
  Modified: Thomas D'haenens
  Company: Neatly (https://neatly.be/)
*/


// Imports: Default
import { HostListener, Component, Inject } from '@angular/core';

// Imports: Custom Services
import { FocusService } from '../services/focus.service';
import { baseAnimation } from '../focus.anim';


// Declarations: JQuery
declare var $: any;


// Component Definition
@Component({selector: 'focus-dialog', templateUrl: './focus-dialog.component.html', styleUrls: ['./focus-dialog.component.css'], animations: [baseAnimation]})


// Component Export Definition
export class FocusDialogComponent {


  // Host Listener
  @HostListener('keydown.escape', ['$event'])
  detectEscape(event) { this.close(); }


  // Constructor
  constructor(private focusService: FocusService) {}

  // Ensure Focus on Focus
  ngAfterViewInit() { $('#focus-focus-point').focus(); }

  // Close
  close() { this.focusService.close(); }

  // Background Close
  backgroundClose(event) {
    if (event.target.tagName.toLowerCase() != 'img') { this.close(); }
  }

}
