import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appInputRestrict]'
})
export class InputRestrictDirective {
  @Input('appInputRestrict') allowedChars!: 'alphabet' | 'number';

  constructor(private el: ElementRef) { }

  @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
  const controlKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete'];
  if (controlKeys.includes(event.key)) {
    return;  // Don't block control keys
  }

  switch (this.allowedChars) {
    case 'alphabet':
      if (!event.key.match(/^[a-zA-Z]$/)) {
        event.preventDefault();
      }
      break;
    case 'number':
      if (!event.key.match(/^[0-9]$/)) {
        event.preventDefault();
      }
      break;
    default:
      break;
  }
}
}
