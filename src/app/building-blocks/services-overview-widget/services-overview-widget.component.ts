import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-services-overview-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule],
    template: `
        <div class="services-overview-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <div class="text-center mb-12">
                    <h2 class="mb-4" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                        {{ config.title }}
                    </h2>
                    <p *ngIf="config.subtitle" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                        {{ config.subtitle }}
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div *ngFor="let service of config.services" class="service-card bg-white rounded-lg shadow-lg overflow-hidden group" [style.background-color]="config.cardBackgroundColor">
                        <div class="service-image" *ngIf="service.imageUrl">
                            <img [src]="service.imageUrl" [alt]="service.title" class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>

                        <div class="service-content p-6">
                            <div class="service-icon mb-4" *ngIf="service.icon">
                                <i [class]="service.icon" [style.font-size.px]="config.iconSize" [style.color]="config.iconColor"></i>
                            </div>

                            <h3 class="service-title font-bold mb-3" [style.color]="config.serviceTitleColor" [style.font-size.px]="config.serviceTitleSize">
                                {{ service.title }}
                            </h3>

                            <p class="service-description mb-4" [style.color]="config.descriptionColor" [style.font-size.px]="config.descriptionSize">
                                {{ service.description }}
                            </p>

                            <ul *ngIf="service.features && service.features.length > 0" class="service-features mb-6">
                                <li *ngFor="let feature of service.features" class="flex items-center mb-2">
                                    <i class="pi pi-check mr-2" [style.color]="config.checkmarkColor"></i>
                                    <span [style.color]="config.featureTextColor" [style.font-size.px]="config.featureTextSize">
                                        {{ feature }}
                                    </span>
                                </li>
                            </ul>

                            <div class="service-footer">
                                <div *ngIf="service.pricing" class="pricing-info mb-4">
                                    <span class="price text-xl font-bold" [style.color]="config.priceColor"> {{ config.currency || 'R' }}{{ service.pricing.price }} </span>
                                    <span *ngIf="service.pricing.period" class="period ml-1" [style.color]="config.periodColor"> /{{ service.pricing.period }} </span>
                                    <div *ngIf="service.pricing.originalPrice" class="original-price text-sm line-through" [style.color]="config.originalPriceColor">{{ config.currency || 'R' }}{{ service.pricing.originalPrice }}</div>
                                </div>

                                <button
                                    *ngIf="service.buttonText"
                                    pButton
                                    [label]="service.buttonText"
                                    [style.background-color]="service.featured ? config.featuredButtonColor : config.buttonColor"
                                    [style.color]="service.featured ? config.featuredButtonTextColor : config.buttonTextColor"
                                    class="w-full"
                                    (click)="onServiceSelect(service)"
                                ></button>
                            </div>
                        </div>

                        <div *ngIf="service.featured" class="featured-badge absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 text-sm rounded-bl-lg">
                            {{ config.featuredBadgeText || 'Popular' }}
                        </div>
                    </div>
                </div>

                <div *ngIf="config.showViewAllButton" class="text-center mt-12">
                    <button pButton [label]="config.viewAllButtonText || 'View All Services'" [style.background-color]="config.viewAllButtonColor" [style.color]="config.viewAllButtonTextColor" size="large" (click)="viewAllServices()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .service-card {
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
                position: relative;
            }
            .service-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
            }
            .service-image {
                overflow: hidden;
            }
        `
    ]
})
export class ServicesOverviewWidgetComponent {
    @Input() config: any = {};

    onServiceSelect(service: any): void {
        if (service.buttonLink) {
            window.open(service.buttonLink, '_blank');
        }
    }

    viewAllServices(): void {
        if (this.config.allServicesUrl) {
            window.open(this.config.allServicesUrl, '_blank');
        }
    }
}
