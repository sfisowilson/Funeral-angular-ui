import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

/**
 * Applies an array of { key, value } pairs as HTML attributes on the host element.
 * Used for block wrapper divs to support custom HTML attributes defined in BlockStyles.
 */
@Directive({
    selector: '[appBlockAttrs]',
    standalone: true,
})
export class BlockAttrsDirective implements OnChanges {
    @Input('appBlockAttrs') attrs: { key: string; value: string }[] | null | undefined;

    private readonly el: HTMLElement;

    constructor(ref: ElementRef<HTMLElement>) {
        this.el = ref.nativeElement;
    }

    ngOnChanges(_changes: SimpleChanges): void {
        // Remove all previously-set data-* / aria-* attributes
        const names = Array.from(this.el.attributes).map((a) => a.name);
        for (const name of names) {
            if (name.startsWith('data-') || name.startsWith('aria-')) {
                this.el.removeAttribute(name);
            }
        }
        if (!this.attrs) return;
        for (const { key, value } of this.attrs) {
            if (key && key.trim()) {
                this.el.setAttribute(key.trim(), value ?? '');
            }
        }
    }
}
