import { Component, Input, OnInit } from '@angular/core';
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
                    {{ title }}
                </h2>
                
                <div *ngIf="testimonials.length === 0" class="text-center p-8">
                    <p class="text-muted">No testimonials available. Configure your widget to display customer testimonials.</p>
                </div>

                <p-carousel *ngIf="testimonials.length > 0" [value]="testimonials" [numVisible]="config.numVisible || 1" [numScroll]="1" [circular]="true" [autoplayInterval]="config.autoplayInterval || 0">
                    <ng-template let-testimonial pTemplate="item">
                        <div class="testimonial-item text-center p-6 mx-4">
                            <div class="testimonial-card bg-white rounded-lg shadow-lg p-6 relative" [style.background-color]="config.cardBackgroundColor">
                                <div class="quote-icon text-6xl text-gray-300 absolute top-2 left-4">"</div>
                                <div class="testimonial-content relative z-10 pt-8">
                                    <p class="testimonial-text mb-6 italic" [style.color]="config.textColor" [style.font-size.px]="config.textSize">"{{ testimonial.text || 'Great service!' }}"</p>
                                    <div class="testimonial-author">
                                        <div *ngIf="testimonial.photo" class="author-photo w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden">
                                            <img [src]="testimonial.photo" [alt]="testimonial.name" class="w-full h-full object-cover" />
                                        </div>
                                        <h4 class="author-name font-semibold" [style.color]="config.nameColor" [style.font-size.px]="config.nameSize">
                                            {{ testimonial.name || 'Anonymous' }}
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
export class TestimonialsWidgetComponent implements OnInit {
    @Input() config: any = {};

    constructor() {
        console.log('TestimonialsWidgetComponent initialized');
    }

    ngOnInit() {
        console.log('Testimonials widget config:', this.config);
        console.log('Testimonials:', this.testimonials);
    }

    get testimonials(): any[] {
        const testimonials = this.config.testimonials || [];
        console.log('Getting testimonials:', testimonials);
        
        // If no testimonials provided, show default ones
        if (testimonials.length === 0) {
            console.log('No testimonials found, showing defaults');
            return [
                {
                    name: 'Sarah Johnson',
                    position: 'Satisfied Customer',
                    text: 'The claims process was smooth and efficient. The team was compassionate and professional during our difficult time.',
                    rating: 5,
                    photo: ''
                },
                {
                    name: 'Michael Brown',
                    position: 'Policy Holder',
                    text: 'Excellent service and affordable premiums. I feel secure knowing my family is protected.',
                    rating: 5,
                    photo: ''
                },
                {
                    name: 'Emily Davis',
                    position: 'Client',
                    text: 'Outstanding customer service and support. They made everything so easy during a challenging time.',
                    rating: 5,
                    photo: ''
                }
            ];
        }
        
        return testimonials;
    }

    get title(): string {
        return this.config.title || 'What Our Customers Say';
    }

    getStars(rating: number): number[] {
        return Array(Math.floor(Math.max(1, Math.min(5, rating)))).fill(0);
    }
}
