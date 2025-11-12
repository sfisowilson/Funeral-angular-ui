import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WidgetConfig } from '../widget-config';

@Component({
    selector: 'app-gallery-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="gallery-widget" [style.padding.px]="config.settings.padding">
            <h2 class="text-center">{{ config.settings.title }}</h2>
            <div class="grid">
                <div class="col" *ngFor="let image of config.settings.images">
                    <img [src]="image.src" [alt]="image.alt" class="img-fluid" />
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .gallery-widget {
                text-align: center;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin-top: 20px;
            }
            .img-fluid {
                max-width: 100%;
                height: auto;
            }
        `
    ]
})
export class GalleryWidgetComponent {
    @Input() config!: WidgetConfig;
}
