import { CommonModule } from '@angular/common';
import { Component, Input, HostListener, ElementRef, OnInit, OnDestroy , ChangeDetectionStrategy} from '@angular/core';
import { WidgetConfig } from '../widget-config';

@Component({
    selector: 'app-parallax-section-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './parallax-section-widget.component.html',
    styleUrl: './parallax-section-widget.component.scss'
})
export class ParallaxSectionWidgetComponent implements OnInit, OnDestroy {
    @Input() config!: WidgetConfig;

    parallaxOffset = 0;
    private prefersReducedMotion = false;

    constructor(private elementRef: ElementRef) {}

    get settings() {
        return this.config?.settings || {};
    }

    get backgroundImage(): string {
        return this.settings.backgroundImage || '';
    }

    get backgroundType(): string {
        return this.settings.backgroundType || 'image';
    }

    get backgroundVideo(): string {
        return this.settings.backgroundVideo || '';
    }

    get parallaxSpeed(): number {
        return this.settings.parallaxSpeed ?? 0.5;
    }

    get direction(): string {
        return this.settings.direction || 'vertical';
    }

    get overlayColor(): string {
        return this.settings.overlayColor || '#000000';
    }

    get overlayOpacity(): number {
        return this.settings.overlayOpacity ?? 0.4;
    }

    get minHeight(): number {
        return this.settings.minHeight || 500;
    }

    get contentAlign(): string {
        return this.settings.contentAlign || 'center';
    }

    get title(): string {
        return this.settings.title || '';
    }

    get subtitle(): string {
        return this.settings.subtitle || '';
    }

    get showCTA(): boolean {
        return this.settings.showCTA || false;
    }

    get ctaText(): string {
        return this.settings.ctaText || 'Learn More';
    }

    get ctaLink(): string {
        return this.settings.ctaLink || '#';
    }

    get titleColor(): string {
        return this.settings.titleColor || '#ffffff';
    }

    get subtitleColor(): string {
        return this.settings.subtitleColor || '#ffffff';
    }

    get gradientStart(): string {
        return this.settings.gradientStart || '#667eea';
    }

    get gradientEnd(): string {
        return this.settings.gradientEnd || '#764ba2';
    }

    ngOnInit(): void {
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!this.prefersReducedMotion) {
            this.updateParallax();
        }
    }

    ngOnDestroy(): void {
        // Cleanup if needed
    }

    @HostListener('window:scroll', ['$event'])
    onWindowScroll(): void {
        if (!this.prefersReducedMotion) {
            this.updateParallax();
        }
    }

    private updateParallax(): void {
        const element = this.elementRef.nativeElement;
        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY || window.pageYOffset;
        const elementTop = rect.top + scrollY;
        const elementHeight = rect.height;
        const windowHeight = window.innerHeight;

        // Only calculate parallax when element is in viewport
        if (rect.bottom >= 0 && rect.top <= windowHeight) {
            const relativeScroll = scrollY + windowHeight - elementTop;
            const scrollPercentage = relativeScroll / (elementHeight + windowHeight);
            
            if (this.direction === 'vertical') {
                this.parallaxOffset = scrollPercentage * 100 * this.parallaxSpeed;
            } else {
                this.parallaxOffset = scrollPercentage * 50 * this.parallaxSpeed;
            }
        }
    }

    getBackgroundStyle(): any {
        const style: any = {};

        if (this.backgroundType === 'gradient') {
            style.background = `linear-gradient(135deg, ${this.gradientStart}, ${this.gradientEnd})`;
        }

        return style;
    }

    getParallaxTransform(): string {
        if (this.prefersReducedMotion) {
            return 'none';
        }

        if (this.direction === 'vertical') {
            return `translateY(${this.parallaxOffset}px)`;
        } else {
            return `translateX(${this.parallaxOffset}px)`;
        }
    }

    getOverlayStyle(): any {
        return {
            backgroundColor: this.overlayColor,
            opacity: this.overlayOpacity
        };
    }

    onCTAClick(): void {
        if (this.ctaLink) {
            if (this.ctaLink.startsWith('http') || this.ctaLink.startsWith('https')) {
                window.open(this.ctaLink, '_blank');
            } else {
                window.location.href = this.ctaLink;
            }
        }
    }
}
