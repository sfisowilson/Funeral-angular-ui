import { CommonModule } from '@angular/common';
import { Component, Input, AfterViewInit, QueryList, ViewChildren, ElementRef, OnDestroy , ChangeDetectionStrategy} from '@angular/core';
import { WidgetConfig } from '../widget-config';
import { ScrollRevealDirective } from '../scroll-reveal.directive';

export interface BentoGridItem {
    id?: string;
    size: 'small' | 'medium' | 'large' | 'wide';
    image?: string;
    title: string;
    description?: string;
    link?: string;
    backgroundColor?: string;
    textColor?: string;
}

@Component({
    selector: 'app-bento-grid-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './bento-grid-widget.component.html',
    styleUrl: './bento-grid-widget.component.scss'
})
export class BentoGridWidgetComponent implements AfterViewInit, OnDestroy {
    @Input() config!: WidgetConfig;
    @ViewChildren('gridItem') gridItems!: QueryList<ElementRef>;

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

    get items(): BentoGridItem[] {
        return this.settings.items || [];
    }

    get columns(): number {
        return this.settings.columns || 4;
    }

    get gap(): number {
        return this.settings.gap || 16;
    }

    get animateOnScroll(): boolean {
        return this.settings.animateOnScroll !== false;
    }

    get hoverEffect(): string {
        return this.settings.hoverEffect || 'lift';
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || 'var(--surface-ground, #f8f9fa)';
    }

    get titleColor(): string {
        return this.settings.titleColor || 'var(--text-color, #212529)';
    }

    get subtitleColor(): string {
        return this.settings.subtitleColor || 'var(--text-muted, #6c757d)';
    }

    get padding(): number {
        return this.settings.padding || 60;
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
                        }, index * 100); // Stagger animation
                        this.observer?.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        this.gridItems.forEach((item) => {
            this.observer?.observe(item.nativeElement);
        });
    }

    getItemSpan(item: BentoGridItem): string {
        const spans = {
            small: { rows: 1, cols: 1 },
            medium: { rows: 1, cols: 2 },
            large: { rows: 2, cols: 2 },
            wide: { rows: 1, cols: 3 }
        };

        const span = spans[item.size] || spans.small;
        return `span ${span.rows} / span ${span.cols}`;
    }

    getItemBackground(item: BentoGridItem): string {
        if (item.backgroundColor) {
            return item.backgroundColor;
        }
        if (item.image) {
            return `url(${item.image})`;
        }
        return 'var(--surface-card, #ffffff)';
    }

    getItemTextColor(item: BentoGridItem): string {
        return item.textColor || (item.image ? '#ffffff' : 'var(--text-color, #212529)');
    }

    hasImage(item: BentoGridItem): boolean {
        return !!item.image;
    }

    onItemClick(item: BentoGridItem): void {
        if (item.link) {
            window.open(item.link, '_blank');
        }
    }
}
