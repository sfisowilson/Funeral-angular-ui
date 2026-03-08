import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WidgetConfig } from '../widget-config';

export interface SplitScreenContent {
    type: 'image' | 'video' | 'slideshow' | 'text' | 'list' | 'steps';
    image?: string;
    video?: string;
    images?: string[];
    items?: { title: string; description: string }[];
    sticky?: boolean;
    verticalAlign?: 'top' | 'center' | 'bottom';
    scrollable?: boolean;
}

@Component({
    selector: 'app-split-screen-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './split-screen-widget.component.html',
    styleUrl: './split-screen-widget.component.scss'
})
export class SplitScreenWidgetComponent {
    @Input() config!: WidgetConfig;

    currentImageIndex = 0;

    get settings() {
        return this.config?.settings || {};
    }

    get splitRatio(): number {
        return this.settings.splitRatio || 50;
    }

    get leftContent(): SplitScreenContent {
        return this.settings.leftContent || { type: 'image', sticky: true, verticalAlign: 'center' };
    }

    get rightContent(): SplitScreenContent {
        return this.settings.rightContent || { type: 'text', scrollable: true };
    }

    get minHeight(): number {
        return this.settings.minHeight || 600;
    }

    get gap(): number {
        return this.settings.gap || 40;
    }

    get reverseOnMobile(): boolean {
        return this.settings.reverseOnMobile !== false;
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || '#ffffff';
    }

    get leftBackgroundColor(): string {
        return this.settings.leftBackgroundColor || 'transparent';
    }

    get rightBackgroundColor(): string {
        return this.settings.rightBackgroundColor || 'transparent';
    }

    get textColor(): string {
        return this.settings.textColor || 'var(--text-color, #212529)';
    }

    getLeftWidth(): string {
        return `${this.splitRatio}%`;
    }

    getRightWidth(): string {
        return `${100 - this.splitRatio}%`;
    }

    nextImage(): void {
        if (this.leftContent.type === 'slideshow' && this.leftContent.images) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.leftContent.images.length;
        }
    }

    prevImage(): void {
        if (this.leftContent.type === 'slideshow' && this.leftContent.images) {
            this.currentImageIndex = this.currentImageIndex === 0 
                ? this.leftContent.images.length - 1 
                : this.currentImageIndex - 1;
        }
    }

    getCurrentImage(): string {
        if (this.leftContent.type === 'slideshow' && this.leftContent.images) {
            return this.leftContent.images[this.currentImageIndex] || '';
        }
        return '';
    }
}
