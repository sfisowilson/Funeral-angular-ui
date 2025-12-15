import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    return Array(5).fill(false).map((_, i) => i < rating);
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
