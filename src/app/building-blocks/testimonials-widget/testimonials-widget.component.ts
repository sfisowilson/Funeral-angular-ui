import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';

@Component({
    selector: 'app-testimonials-widget',
    standalone: true,
    imports: [CommonModule, CarouselModule],
    template: `
        <div class="testimonials-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-8" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title }}
                </h2>
                <p-carousel [value]="config.testimonials" [numVisible]="config.numVisible" [numScroll]="1" [circular]="true" [autoplayInterval]="config.autoplayInterval">
                    <ng-template let-testimonial pTemplate="item">
                        <div class="testimonial-item text-center p-6 mx-4">
                            <div class="testimonial-card bg-white rounded-lg shadow-lg p-6 relative" [style.background-color]="config.cardBackgroundColor">
                                <div class="quote-icon text-6xl text-gray-300 absolute top-2 left-4">"</div>
                                <div class="testimonial-content relative z-10 pt-8">
                                    <p class="testimonial-text mb-6 italic" [style.color]="config.textColor" [style.font-size.px]="config.textSize">"{{ testimonial.text }}"</p>
                                    <div class="testimonial-author">
                                        <div *ngIf="testimonial.photo" class="author-photo w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden">
                                            <img [src]="testimonial.photo" [alt]="testimonial.name" class="w-full h-full object-cover" />
                                        </div>
                                        <h4 class="author-name font-semibold" [style.color]="config.nameColor" [style.font-size.px]="config.nameSize">
                                            {{ testimonial.name }}
                                        </h4>
                                        <p *ngIf="testimonial.position" class="author-position text-sm" [style.color]="config.positionColor">
                                            {{ testimonial.position }}
                                        </p>
                                        <div *ngIf="testimonial.rating" class="rating mt-2">
                                            <i *ngFor="let star of getStars(testimonial.rating)" class="pi pi-star-fill" [style.color]="config.starColor"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ng-template>
                </p-carousel>
            </div>
        </div>
    `,
    styles: [
        `
            .testimonial-card {
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }
            .testimonial-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
            }
            .quote-icon {
                font-family: serif;
                line-height: 1;
            }
        `
    ]
})
export class TestimonialsWidgetComponent {
    @Input() config: any = {};

    getStars(rating: number): number[] {
        return Array(Math.floor(rating)).fill(0);
    }
}
