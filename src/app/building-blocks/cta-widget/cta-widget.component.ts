import { CommonModule } from '@angular/common';
import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { WidgetConfig } from '../widget-config';

@Component({
    selector: 'app-cta-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    template: `
        <div class="cta-widget" [style.background-color]="config.settings.backgroundColor" [style.--widget-outer-padding.px]="config.settings.padding">
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
                padding: var(--widget-outer-padding, 40px) 16px;
            }
            .btn {
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                padding: 10px 20px;
            }
            @media (max-width: 576px) {
                .cta-widget {
                    padding: min(var(--widget-outer-padding, 40px), 20px) 12px;
                }
                .btn {
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                    text-align: center;
                }
            }
        `
    ]
})
export class CtaWidgetComponent {
    @Input() config!: WidgetConfig;
}
