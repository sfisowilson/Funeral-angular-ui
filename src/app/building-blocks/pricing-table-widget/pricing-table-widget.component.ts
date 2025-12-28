import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-pricing-table-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="pricing-table-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-8" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title }}
                </h2>
                <p *ngIf="config.subtitle" class="text-center mb-12" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ config.subtitle }}
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div *ngFor="let plan of config.pricingPlans" class="pricing-card bg-white rounded-lg shadow-lg overflow-hidden relative" [class.featured]="plan.featured" [style.background-color]="config.cardBackgroundColor">
                        <div *ngIf="plan.featured" class="featured-badge absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 text-sm">
                            {{ config.featuredBadgeText || 'Most Popular' }}
                        </div>
                        <div class="p-6">
                            <h3 class="text-xl font-bold mb-2" [style.color]="config.planNameColor">
                                {{ plan.name }}
                            </h3>
                            <p *ngIf="plan.description" class="text-gray-600 mb-4" [style.color]="config.descriptionColor">
                                {{ plan.description }}
                            </p>
                            <div class="price-section mb-6">
                                <span class="text-4xl font-bold" [style.color]="config.priceColor"> {{ config.currency || 'R' }}{{ plan.price }} </span>
                                <span class="text-gray-500" [style.color]="config.periodColor"> /{{ plan.period || 'month' }} </span>
                            </div>
                            <ul class="features-list mb-6">
                                <li *ngFor="let feature of plan.features" class="flex items-center mb-2">
                                    <i class="pi pi-check text-green-500 mr-2" [style.color]="config.checkmarkColor"></i>
                                    <span [style.color]="config.featureTextColor">{{ feature }}</span>
                                </li>
                            </ul>
                            <button
                                pButton
                                [label]="plan.buttonText || config.defaultButtonText || 'Choose Plan'"
                                class="w-full"
                                [style.background-color]="plan.featured ? config.featuredButtonColor : config.buttonColor"
                                [style.color]="plan.featured ? config.featuredButtonTextColor : config.buttonTextColor"
                                (click)="onPlanSelect(plan)"
                            ></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .pricing-card {
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }
            .pricing-card:hover {
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            }
            .pricing-card.featured {
                border: 2px solid var(--warning-color, #f97316);
            }
            .featured-badge {
                border-bottom-left-radius: 0.5rem;
            }
        `
    ]
})
export class PricingTableWidgetComponent {
    @Input() config: any = {};

    onPlanSelect(plan: any): void {
        if (plan.buttonLink) {
            window.open(plan.buttonLink, '_blank');
        }
    }
}
