import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WidgetConfig } from '../widget-config';

@Component({
    selector: 'app-features-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="features-widget" [style.background-color]="config.settings.backgroundColor" [style.padding.px]="config.settings.padding">
            <h2 class="text-center" [style.color]="config.settings.titleColor">{{ config.settings.title }}</h2>
            <div class="grid">
                <div class="col" *ngFor="let feature of config.settings.features">
                    <div class="feature-card">
                        <i class="{{ feature.icon }}" [style.font-size.px]="config.settings.iconSize" [style.color]="config.settings.iconColor"></i>
                        <h3 [style.color]="config.settings.featureTitleColor">{{ feature.title }}</h3>
                        <p [style.color]="config.settings.featureTextColor">{{ feature.text }}</p>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .features-widget {
                text-align: center;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 20px;
            }
            .feature-card {
                padding: 20px;
                border-radius: 5px;
                background-color: #f8f9fa;
            }
        `
    ]
})
export class FeaturesWidgetComponent {
    @Input() config!: WidgetConfig;
}
