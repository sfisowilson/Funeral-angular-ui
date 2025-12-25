import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccordionModule } from 'primeng/accordion';

@Component({
    selector: 'app-faq-widget',
    standalone: true,
    imports: [CommonModule, AccordionModule],
    template: `
        <div class="container mx-auto">
            <h2 class="text-center mb-8" [style.color]="config.settings?.titleColor" [style.font-size.px]="config.settings?.titleSize">
                {{ config.settings?.title }}
            </h2>
            <p *ngIf="config.settings.subtitle" class="text-center mb-12" [style.color]="config.settings.subtitleColor" [style.font-size.px]="config.settings.subtitleSize">
                {{ config.settings.subtitle }}
            </p>
            <div class="max-w-4xl mx-auto">
                <p-accordion [multiple]="config.settings?.allowMultiple" styleClass="custom-faq-accordion">
                    <p-accordionTab *ngFor="let faq of config.settings?.faqs" [header]="faq.question">
                        <div class="faq-answer" [style.color]="config.settings?.answerColor" [style.font-size.px]="config.settings?.answerSize">
                            <div [innerHTML]="faq.answer"></div>
                        </div>
                    </p-accordionTab>
                </p-accordion>
            </div>
        </div>
    `,
    styles: [
        `
            app-faq-widget ::ng-deep .custom-faq-accordion .p-accordion-header .p-accordion-header-link {
                background-color: var(--accordion-header-color) !important;
                font-weight: 600;
            }
            app-faq-widget ::ng-deep .custom-faq-accordion .p-accordion-header .p-accordion-header-link .p-accordion-header-text {
                color: var(--accordion-text-color) !important;
            }
            app-faq-widget ::ng-deep .custom-faq-accordion .p-accordion-header .p-accordion-header-link .p-accordion-toggle-icon {
                color: var(--accordion-text-color) !important;
            }
            :host ::ng-deep .p-accordion .p-accordion-content {
                padding: 1.5rem;
            }
        `
    ]
})
export class FaqWidgetComponent {
    @Input() config: any = {};

    @HostBinding('class.faq-widget')
    get class() { return true; }

    @HostBinding('style.background-color')
    get backgroundColor() { return this.config.settings?.backgroundColor; }

    @HostBinding('style.padding.px')
    get padding() { return this.config.settings?.padding; }

    @HostBinding('style.--accordion-header-color')
    get accordionHeaderColor() { return this.config.settings?.accordionHeaderColor; }

    @HostBinding('style.--accordion-text-color')
    get accordionTextColor() { return this.config.settings?.accordionTextColor; }
}
