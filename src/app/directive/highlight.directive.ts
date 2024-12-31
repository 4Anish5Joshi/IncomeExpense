import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appHighlight]'
})
export class HighlightDirective implements OnChanges {
  @Input('appHighlight') type: 'income' | 'expense' = 'expense';

  constructor(private el: ElementRef) { }

  ngOnChanges() {
    if (this.type === 'income') {
      this.el.nativeElement.style.color = 'lightgreen';
    } else if (this.type === 'expense') {
      this.el.nativeElement.style.color = 'red';
    }
  }
}
