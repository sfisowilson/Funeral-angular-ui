import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { WidgetConfig } from '../widget-config';

export interface MarqueeItem {
    id?: string;
    type: 'image' | 'text';
    src?: string;
    alt?: string;
    content?: string;
    link?: string;
}

@Component({
    selector: 'app-marquee-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './marquee-widget.component.html',
    styleUrl: './marquee-widget.component.scss'
})
export class MarqueeWidgetComponent implements OnInit {
    @Input() config!: WidgetConfig;

    duplicatedItems: MarqueeItem[] = [];

    get settings() {
        return this.config?.settings || {};
    }

    get title(): string {
        return this.settings.title || '';
    }

    get showTitle(): boolean {
        return this.settings.showTitle !== false;
    }

    get items(): MarqueeItem[] {
        return this.settings.items || [];
    }

    get direction(): string {
        return this.settings.direction || 'left';
    }

    get speed(): number {
        return this.settings.speed || 30;
    }

    get pauseOnHover(): boolean {
        return this.settings.pauseOnHover !== false;
    }

    get itemSpacing(): number {
        return this.settings.itemSpacing || 40;
    }

    get duplicateCount(): number {
        return this.settings.duplicateCount || 2;
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || 'transparent';
    }

    get titleColor(): string {
        return this.settings.titleColor || 'var(--text-color, #212529)';
    }

    get textColor(): string {
        return this.settings.textColor || 'var(--text-color, #212529)';
    }

    get padding(): number {
        return this.settings.padding || 60;
    }

    get itemScale(): number {
        return this.settings.itemScale || 1.0;
    }

    ngOnInit(): void {
        this.createDuplicatedItems();
    }

    private createDuplicatedItems(): void {
        // Duplicate items for seamless infinite scroll
        this.duplicatedItems = [];
        for (let i = 0; i < this.duplicateCount; i++) {
            this.duplicatedItems = [...this.duplicatedItems, ...this.items];
        }
    }

    getAnimationStyle(): any {
        const duration = `${this.speed}s`;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            return { animation: 'none' };
        }

        let animationName = 'marquee-left';
        if (this.direction === 'right') {
            animationName = 'marquee-right';
        } else if (this.direction === 'up') {
            animationName = 'marquee-up';
        } else if (this.direction === 'down') {
            animationName = 'marquee-down';
        }

        return {
            'animation-name': animationName,
            'animation-duration': duration,
            'animation-iteration-count': 'infinite',
            'animation-timing-function': 'linear'
        };
    }

    onItemClick(item: MarqueeItem): void {
        if (item.link) {
            if (item.link.startsWith('http') || item.link.startsWith('https')) {
                window.open(item.link, '_blank');
            } else {
                window.location.href = item.link;
            }
        }
    }
}
