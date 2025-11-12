import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-image',
    standalone: true,
    imports: [CommonModule],
    template: `<img [src]="content.imageUrl" [alt]="content.altText" />`
})
export class ImageComponent {
    @Input() content: any;
}
