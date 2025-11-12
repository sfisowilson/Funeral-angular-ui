import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WidgetConfig } from '../widget-config';

@Component({
    selector: 'app-cta-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="cta-widget" [style.background-color]="config.settings.backgroundColor" [style.padding.px]="config.settings.padding">
            <h2 [style.color]="config.settings.textColor">{{ config.settings.title }}</h2>
            <p [style.color]="config.settings.textColor">{{ config.settings.text }}</p>
            <a [href]="config.settings.buttonLink" class="btn" [style.background-color]="config.settings.buttonColor" [style.color]="config.settings.buttonTextColor">{{ config.settings.buttonText }}</a>
        </div>
    `,
    styles: [
        `
            .cta-widget {
                text-align: center;
                border-radius: 5px;
            }
            .btn {
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                padding: 10px 20px;
            }
        `
    ]
})
export class CtaWidgetComponent {
    @Input() config!: WidgetConfig;
}
