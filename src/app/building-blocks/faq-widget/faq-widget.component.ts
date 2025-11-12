import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';

@Component({
    selector: 'app-faq-widget',
    standalone: true,
    imports: [CommonModule, AccordionModule],
    template: `
        <div class="faq-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-8" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title }}
                </h2>
                <p *ngIf="config.subtitle" class="text-center mb-12" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ config.subtitle }}
                </p>
                <div class="max-w-4xl mx-auto">
                    <p-accordion [multiple]="config.allowMultiple">
                        <p-accordionTab *ngFor="let faq of config.faqs" [header]="faq.question">
                            <div class="faq-answer" [style.color]="config.answerColor" [style.font-size.px]="config.answerSize">
                                <div [innerHTML]="faq.answer"></div>
                            </div>
                        </p-accordionTab>
                    </p-accordion>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            ::ng-deep .p-accordion .p-accordion-header .p-accordion-header-link {
                font-weight: 600;
            }
            ::ng-deep .p-accordion .p-accordion-content {
                padding: 1.5rem;
            }
        `
    ]
})
export class FaqWidgetComponent {
    @Input() config: any = {};
}
