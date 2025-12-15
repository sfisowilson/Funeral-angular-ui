import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { WidgetConfig } from '../widget-config';

@Component({
    selector: 'app-gallery-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './gallery-widget.component.html',
    styleUrls: ['./gallery-widget.component.scss']
})
export class GalleryWidgetComponent implements OnInit {
    @Input() config!: WidgetConfig;
    
    currentSlideIndex = 0;
    showLightbox = false;
    lightboxIndex = 0;

    get settings(): any {
        if (!this.config.settings) {
            this.config.settings = {};
        }
        return this.config.settings;
    }

    ngOnInit(): void {
        // Ensure default values
        if (!this.settings.layout) {
            this.settings.layout = 'grid';
        }
        if (!this.settings.columns) {
            this.settings.columns = 3;
        }
        if (!this.settings.gap) {
            this.settings.gap = 16;
        }
        if (!this.settings.images) {
            this.settings.images = [];
        }
    }

    openLightbox(index: number): void {
        this.lightboxIndex = index;
        this.showLightbox = true;
        document.body.style.overflow = 'hidden';
    }

    closeLightbox(): void {
        this.showLightbox = false;
        document.body.style.overflow = '';
    }

    previousImage(): void {
        if (this.lightboxIndex > 0) {
            this.lightboxIndex--;
        }
    }

    nextImage(): void {
        if (this.lightboxIndex < this.settings.images?.length - 1) {
            this.lightboxIndex++;
        }
    }

    previousSlide(): void {
        if (this.currentSlideIndex > 0) {
            this.currentSlideIndex--;
        } else {
            this.currentSlideIndex = Math.max(0, this.settings.images?.length - 1);
        }
    }

    nextSlide(): void {
        if (this.currentSlideIndex < this.settings.images?.length - 1) {
            this.currentSlideIndex++;
        } else {
            this.currentSlideIndex = 0;
        }
    }

    goToSlide(index: number): void {
        this.currentSlideIndex = index;
    }
}
