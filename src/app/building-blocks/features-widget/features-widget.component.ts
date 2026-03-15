import { CommonModule } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { WidgetConfig } from '../widget-config';

@Component({
    selector: 'app-features-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    template: `
        <div class="features-widget" [style.background-color]="config.settings.backgroundColor" [style.--widget-outer-padding.px]="config.settings.padding" [style.--columns]="config.settings.columns || config.settings.features?.length || 1">
            <h2 class="text-center" [style.color]="config.settings.titleColor">{{ config.settings.title }}</h2>
            <div class="grid">
                <div class="col" *ngFor="let feature of config.settings.features">
                    <div class="feature-card" [style.background-color]="config.settings.cardBackgroundColor || '#f8f9fa'">
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
                padding: var(--widget-outer-padding, 40px) 16px;
            }
            .grid {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                gap: 20px;
                margin-top: 20px;
            }
            .col {
                flex: 0 1 calc((100% - (var(--columns, 3) - 1) * 20px) / var(--columns, 3));
                min-width: min(220px, 100%);
                box-sizing: border-box;
            }
            .feature-card {
                padding: 20px;
                border-radius: 5px;
                background-color: #f8f9fa;
                height: 100%;
            }
            @media (max-width: 576px) {
                .features-widget {
                    padding: min(var(--widget-outer-padding, 40px), 20px) 12px;
                }
                .col {
                    flex: 1 1 100%;
                }
            }
        `
    ]
})
export class FeaturesWidgetComponent {
    @Input() config!: WidgetConfig;
}
