import { Component, Input, OnInit, OnDestroy , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { hexToRgba } from '../widget-color.utils';

export interface Testimonial {
    name: string;
    role?: string;
    company?: string;
    content: string;
    rating?: number;
    imageUrl?: string;
}

export interface TestimonialCarouselSettings {
    title?: string;
    subtitle?: string;
    autoPlay?: boolean;
    autoPlayInterval?: number;
    showRatings?: boolean;
    showImages?: boolean;
    layout?: 'single' | 'grid';
}

@Component({
    selector: 'app-testimonial-carousel-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './testimonial-carousel-widget.component.html',
    styleUrls: ['./testimonial-carousel-widget.component.scss']
})
export class TestimonialCarouselWidgetComponent implements OnInit, OnDestroy {
    @Input() config: any = {};

    currentIndex: number = 0;
    private autoPlayTimer: any;

    ngOnInit() {
        if (this.autoPlay && this.testimonials.length > 1) {
            this.startAutoPlay();
        }
    }

    ngOnDestroy() {
        this.stopAutoPlay();
    }

    get title(): string {
        return this.config.settings?.title || '';
    }

    get subtitle(): string {
        return this.config.settings?.subtitle || '';
    }

    get backgroundColor(): string { return hexToRgba(this.config.settings?.backgroundColor || '#ffffff', this.config.settings?.backgroundOpacity ?? 1); }
    get titleColor(): string { return this.config.settings?.titleColor || '#1a1a1a'; }
    get subtitleColor(): string { return this.config.settings?.subtitleColor || '#6c757d'; }
    get cardBackgroundColor(): string { return hexToRgba(this.config.settings?.cardBackgroundColor || '#ffffff', this.config.settings?.cardBackgroundOpacity ?? 1); }
    get quoteIconColor(): string { return this.config.settings?.quoteIconColor || '#dee2e6'; }
    get testimonialTextColor(): string { return this.config.settings?.testimonialTextColor || '#212529'; }
    get nameColor(): string { return this.config.settings?.nameColor || '#1a1a1a'; }
    get roleColor(): string { return this.config.settings?.roleColor || '#6c757d'; }
    get starColor(): string { return this.config.settings?.starColor || '#f59e0b'; }
    get navigationColor(): string { return hexToRgba(this.config.settings?.navigationColor || '#ffffff', 1); }
    get navigationTextColor(): string { return this.config.settings?.navigationTextColor || '#212529'; }

    get testimonials(): Testimonial[] {
        return this.config.testimonials || [];
    }

    get settings(): TestimonialCarouselSettings {
        return this.config.settings || {};
    }

    get autoPlay(): boolean {
        return this.settings.autoPlay !== false;
    }

    get autoPlayInterval(): number {
        return this.settings.autoPlayInterval || 5000;
    }

    get showRatings(): boolean {
        return this.settings.showRatings !== false;
    }

    get showImages(): boolean {
        return this.settings.showImages !== false;
    }

    get layout(): string {
        return this.settings.layout || 'single';
    }

    get currentTestimonial(): Testimonial | undefined {
        return this.testimonials[this.currentIndex];
    }

    get visibleTestimonials(): Testimonial[] {
        if (this.layout === 'grid') {
            return this.testimonials.slice(this.currentIndex, this.currentIndex + 3);
        }
        return [this.currentTestimonial!];
    }

    next() {
        this.stopAutoPlay();
        if (this.layout === 'grid') {
            this.currentIndex = (this.currentIndex + 3) % this.testimonials.length;
        } else {
            this.currentIndex = (this.currentIndex + 1) % this.testimonials.length;
        }
        if (this.autoPlay) {
            this.startAutoPlay();
        }
    }

    previous() {
        this.stopAutoPlay();
        if (this.layout === 'grid') {
            this.currentIndex = (this.currentIndex - 3 + this.testimonials.length) % this.testimonials.length;
        } else {
            this.currentIndex = (this.currentIndex - 1 + this.testimonials.length) % this.testimonials.length;
        }
        if (this.autoPlay) {
            this.startAutoPlay();
        }
    }

    goToSlide(index: number) {
        this.stopAutoPlay();
        this.currentIndex = index;
        if (this.autoPlay) {
            this.startAutoPlay();
        }
    }

    getStarArray(rating: number): boolean[] {
        return Array(5)
            .fill(false)
            .map((_, i) => i < rating);
    }

    private startAutoPlay() {
        this.autoPlayTimer = setInterval(() => {
            this.next();
        }, this.autoPlayInterval);
    }

    private stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }
}
