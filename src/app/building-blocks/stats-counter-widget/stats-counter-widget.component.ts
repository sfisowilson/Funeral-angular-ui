import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatCounter {
    icon: string;
    value: string;
    label: string;
    prefix?: string;
    suffix?: string;
}

@Component({
    selector: 'app-stats-counter-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './stats-counter-widget.component.html',
    styleUrls: ['./stats-counter-widget.component.scss']
})
export class StatsCounterWidgetComponent implements OnInit, AfterViewInit {
    @Input() config: any;
    @ViewChildren('statCard') statCards!: QueryList<ElementRef>;

    animatedValues: (string | number)[] = [];
    hasAnimated = false;
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

    get stats(): StatCounter[] {
        return this.settings.stats || [];
    }

    get columns(): number {
        return this.settings.columns || 4;
    }

    get titleColor(): string {
        return this.settings.titleColor || '#000000';
    }

    get subtitleColor(): string {
        return this.settings.subtitleColor || '#6c757d';
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || '#f8f9fa';
    }

    get statBackgroundColor(): string {
        return this.settings.statBackgroundColor || '#ffffff';
    }

    get valueColor(): string {
        return this.settings.valueColor || '#0d6efd';
    }

    get labelColor(): string {
        return this.settings.labelColor || '#495057';
    }

    get iconColor(): string {
        return this.settings.iconColor || '#0d6efd';
    }

    get padding(): number {
        return this.settings.padding || 60;
    }

    get animateOnScroll(): boolean {
        return this.settings.animateOnScroll !== false;
    }

    ngOnInit() {
        // Initialize with final values (in case animation is disabled)
        this.animatedValues = this.stats.map(stat => stat.value);
    }

    ngAfterViewInit() {
        if (this.animateOnScroll && typeof IntersectionObserver !== 'undefined') {
            this.setupIntersectionObserver();
        } else if (!this.animateOnScroll) {
            this.hasAnimated = true;
        }
    }

    private setupIntersectionObserver() {
        const options = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.hasAnimated = true;
                    this.animateCounters();
                    this.observer?.disconnect();
                }
            });
        }, options);

        // Observe the first stat card
        if (this.statCards && this.statCards.first) {
            this.observer.observe(this.statCards.first.nativeElement);
        }
    }

    private animateCounters() {
        this.stats.forEach((stat, index) => {
            const numericValue = this.extractNumericValue(stat.value);
            
            if (numericValue !== null) {
                this.animateNumber(numericValue, index);
            } else {
                this.animatedValues[index] = stat.value;
            }
        });
    }

    private extractNumericValue(value: string): number | null {
        // Try to extract a number from the value
        const match = value.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return null;
    }

    private animateNumber(target: number, index: number) {
        const duration = 2000; // 2 seconds
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current = Math.min(current + increment, target);
            
            const stat = this.stats[index];
            let formattedValue = Math.round(current).toString();
            
            // Add commas for thousands
            if (current >= 1000) {
                formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }

            this.animatedValues[index] = formattedValue;

            if (step >= steps || current >= target) {
                clearInterval(timer);
                // Set final value
                this.animatedValues[index] = stat.value.match(/[\d,]+\.?\d*/)?.[0] || stat.value;
            }
        }, duration / steps);
    }

    getDisplayValue(index: number, stat: StatCounter): string {
        const animatedValue = this.animatedValues[index];
        const prefix = stat.prefix || '';
        const suffix = stat.suffix || '';
        return `${prefix}${animatedValue}${suffix}`;
    }

    ngOnDestroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}
