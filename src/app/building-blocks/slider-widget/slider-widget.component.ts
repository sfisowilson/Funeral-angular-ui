import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetConfig } from '../widget-config';

interface SlideItem {
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  buttonLink?: string;
  overlayOpacity?: number;
}

@Component({
  selector: 'app-slider-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slider-widget.component.html',
  styleUrl: './slider-widget.component.css'
})
export class SliderWidgetComponent implements OnInit, OnDestroy {
  @Input() config!: WidgetConfig;
  
  currentSlide = 0;
  autoplayInterval: any;
  slides: SlideItem[] = [];

  // Helper to access settings
  get settings(): any {
    return this.config as any;
  }

  ngOnInit(): void {
    this.slides = this.settings.slides || [];
    
    if (this.settings.autoplay && this.slides.length > 1) {
      this.startAutoplay();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  startAutoplay(): void {
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, this.settings.autoplaySpeed || 5000);
  }

  stopAutoplay(): void {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
    }
  }

  nextSlide(): void {
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
  }

  previousSlide(): void {
    this.currentSlide = this.currentSlide === 0 ? this.slides.length - 1 : this.currentSlide - 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    
    // Reset autoplay if enabled
    if (this.settings.autoplay) {
      this.stopAutoplay();
      this.startAutoplay();
    }
  }

  getContainerStyles(): any {
    return {
      'background-color': this.settings.backgroundColor || 'transparent',
      'height': `${this.settings.height || 500}px`,
      'padding': `${this.settings.padding || 0}px`
    };
  }

  getSlidesContainerStyles(): any {
    return {
      'height': '100%',
      'border-radius': `${this.settings.borderRadius || 0}px`
    };
  }

  getSlideStyles(slide: SlideItem): any {
    return {
      'background-image': slide.imageUrl ? `url(${slide.imageUrl})` : 'none',
      'background-color': !slide.imageUrl ? '#e9ecef' : 'transparent'
    };
  }

  getOverlayStyles(slide: SlideItem): any {
    const opacity = slide.overlayOpacity !== undefined ? slide.overlayOpacity : this.settings.overlayOpacity || 0.4;
    return {
      'opacity': opacity
    };
  }

  getContentStyles(): any {
    return {
      'color': this.settings.textColor || '#ffffff'
    };
  }

  getTitleStyles(): any {
    return {
      'font-size': `${this.settings.titleSize || 48}px`,
      'color': this.settings.titleColor || '#ffffff'
    };
  }

  getSubtitleStyles(): any {
    return {
      'font-size': `${this.settings.subtitleSize || 20}px`,
      'color': this.settings.subtitleColor || '#ffffff'
    };
  }

  getButtonStyles(): any {
    return {
      'background-color': this.settings.buttonColor || '#007bff',
      'color': this.settings.buttonTextColor || '#ffffff',
      'font-size': `${this.settings.buttonTextSize || 16}px`
    };
  }

  getNavButtonStyles(): any {
    return {
      'background-color': this.settings.arrowBackgroundColor || 'rgba(0, 0, 0, 0.5)',
      'color': this.settings.arrowColor || '#ffffff'
    };
  }

  getDotsContainerStyles(): any {
    return {
      'padding': '12px',
      'background-color': this.settings.dotsBackgroundColor || 'rgba(0, 0, 0, 0.3)',
      'border-radius': '20px'
    };
  }

  getDotStyles(isActive: boolean): any {
    return {
      'width': `${this.settings.dotSize || 12}px`,
      'height': `${this.settings.dotSize || 12}px`,
      'background-color': isActive 
        ? (this.settings.dotActiveColor || '#ffffff') 
        : (this.settings.dotColor || 'rgba(255, 255, 255, 0.5)')
    };
  }
}
