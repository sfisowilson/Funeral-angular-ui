import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BenefitItem {
    icon: string;
    text: string;
    category?: string;
}

export interface BenefitCategory {
    name: string;
    items: BenefitItem[];
    expanded?: boolean;
}

@Component({
    selector: 'app-benefits-checklist-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './benefits-checklist-widget.component.html',
    styleUrls: ['./benefits-checklist-widget.component.scss']
})
export class BenefitsChecklistWidgetComponent implements OnInit {
    @Input() config: any;

    constructor() {
        console.log('BenefitsChecklistWidgetComponent initialized');
    }

    ngOnInit() {
        console.log('Benefits widget config:', this.config);
        console.log('Benefits:', this.benefits);
    }

    get settings() {
        // Fix: Use config directly instead of config.settings
        return this.config || {};
    }

    get title(): string {
        return this.settings.title || 'Everything You Need, All in One Place';
    }

    get subtitle(): string {
        return this.settings.subtitle || 'No separate systems, no hidden costs, no technical headaches';
    }

    get benefits(): BenefitItem[] {
        const benefits = this.settings.benefits || [];
        console.log('Getting benefits:', benefits);
        
        // If no benefits provided, show default ones
        if (benefits.length === 0) {
            console.log('No benefits found, showing defaults');
            return [
                { icon: 'bi bi-check-circle-fill', text: 'Professional website with custom subdomain' },
                { icon: 'bi bi-check-circle-fill', text: 'Complete member management system' },
                { icon: 'bi bi-check-circle-fill', text: 'Claims processing workflow' },
                { icon: 'bi bi-check-circle-fill', text: 'Document management and storage' },
                { icon: 'bi bi-check-circle-fill', text: 'Payment tracking and reporting' },
                { icon: 'bi bi-check-circle-fill', text: 'SSL security included' },
                { icon: 'bi bi-check-circle-fill', text: 'Daily automatic backups' },
                { icon: 'bi bi-check-circle-fill', text: '24/7 customer support' }
            ];
        }
        
        return benefits;
    }

    get categories(): BenefitCategory[] {
        return this.settings.categories || [];
    }

    get useCategories(): boolean {
        return this.settings.useCategories && this.categories.length > 0;
    }

    get columns(): number {
        return this.settings.columns || 2;
    }

    get titleColor(): string {
        return this.settings.titleColor || 'var(--text-color, #000000)';
    }

    get subtitleColor(): string {
        return this.settings.subtitleColor || 'var(--muted-color, #6c757d)';
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || 'var(--surface-card, #ffffff)';
    }

    get iconColor(): string {
        return this.settings.iconColor || 'var(--success-color, #198754)';
    }

    get textColor(): string {
        return this.settings.textColor || 'var(--text-color, #212529)';
    }

    get padding(): number {
        return this.settings.padding || 40;
    }

    get allowExpand(): boolean {
        return this.settings.allowExpand !== false;
    }

    toggleCategory(category: BenefitCategory) {
        if (this.allowExpand) {
            category.expanded = !category.expanded;
        }
    }
}
