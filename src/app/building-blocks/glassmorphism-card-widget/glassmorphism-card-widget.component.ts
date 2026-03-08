import { CommonModule } from '@angular/common';
import { Component, Input, AfterViewInit, QueryList, ViewChildren, ElementRef, OnDestroy } from '@angular/core';
import { WidgetConfig } from '../widget-config';

export interface GlassmorphismCard {
    id?: string;
    icon: string;
    title: string;
    description: string;
    link?: string;
}

@Component({
    selector: 'app-glassmorphism-card-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './glassmorphism-card-widget.component.html',
    styleUrl: './glassmorphism-card-widget.component.scss'
})
export class GlassmorphismCardWidgetComponent implements AfterViewInit, OnDestroy {
    @Input() config!: WidgetConfig;
    @ViewChildren('card') cardElements!: QueryList<ElementRef>;

    private observer?: IntersectionObserver;

    get settings() {
        return this.config?.settings || {};
    }

    get title(): string {
        return this.settings.title || '';
    }

    get subtitle(): string {
        return this.settings.subtitle || '';
    }

    get showTitle(): boolean {
        return this.settings.showTitle !== false;
    }

    get showSubtitle(): boolean {
        return this.settings.showSubtitle !== false;
    }

    get cards(): GlassmorphismCard[] {
        return this.settings.cards || [];
    }

    get columns(): number {
        return this.settings.columns || 3;
    }

    get glassBlur(): number {
        return this.settings.glassBlur || 10;
    }

    get glassOpacity(): number {
        return this.settings.glassOpacity || 0.15;
    }

    get borderGlow(): boolean {
        return this.settings.borderGlow !== false;
    }

    get borderColor(): string {
        return this.settings.borderColor || 'rgba(255,255,255,0.2)';
    }

    get shadowIntensity(): string {
        return this.settings.shadowIntensity || 'medium';
    }

    get backgroundPattern(): string {
        return this.settings.backgroundPattern || 'gradient';
    }

    get gradientStart(): string {
        return this.settings.gradientStart || '#667eea';
    }

    get gradientEnd(): string {
        return this.settings.gradientEnd || '#764ba2';
    }

    get backgroundImage(): string {
        return this.settings.backgroundImage || '';
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || '#1e293b';
    }

    get titleColor(): string {
        return this.settings.titleColor || '#ffffff';
    }

    get subtitleColor(): string {
        return this.settings.subtitleColor || 'rgba(255,255,255,0.8)';
    }

    get cardTitleColor(): string {
        return this.settings.cardTitleColor || '#ffffff';
    }

    get cardTextColor(): string {
        return this.settings.cardTextColor || 'rgba(255,255,255,0.9)';
    }

    get iconColor(): string {
        return this.settings.iconColor || '#ffffff';
    }

    get padding(): number {
        return this.settings.padding || 80;
    }

    get animateOnScroll(): boolean {
        return this.settings.animateOnScroll !== false;
    }

    ngAfterViewInit(): void {
        if (this.animateOnScroll) {
            this.setupScrollAnimation();
        }
    }

    ngOnDestroy(): void {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    private setupScrollAnimation(): void {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            return;
        }

        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('animate-in');
                        }, index * 150);
                        this.observer?.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        this.cardElements.forEach((card) => {
            this.observer?.observe(card.nativeElement);
        });
    }

    getBackgroundStyle(): any {
        const style: any = {};

        if (this.backgroundPattern === 'gradient') {
            style.background = `linear-gradient(135deg, ${this.gradientStart}, ${this.gradientEnd})`;
        } else if (this.backgroundPattern === 'image' && this.backgroundImage) {
            style.backgroundImage = `url(${this.backgroundImage})`;
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
        } else {
            style.backgroundColor = this.backgroundColor;
        }

        return style;
    }

    getGlassStyle(): any {
        return {
            '--glass-blur': `${this.glassBlur}px`,
            '--glass-opacity': this.glassOpacity,
            '--border-color': this.borderColor
        };
    }

    getShadowClass(): string {
        return `shadow-${this.shadowIntensity}`;
    }

    onCardClick(card: GlassmorphismCard): void {
        if (card.link) {
            if (card.link.startsWith('http') || card.link.startsWith('https')) {
                window.open(card.link, '_blank');
            } else {
                window.location.href = card.link;
            }
        }
    }
}
