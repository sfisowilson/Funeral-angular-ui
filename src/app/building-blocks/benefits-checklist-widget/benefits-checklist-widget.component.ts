import { Component, Input } from '@angular/core';
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
export class BenefitsChecklistWidgetComponent {
    @Input() config: any;

    get settings() {
        return this.config?.settings || {};
    }

    get title(): string {
        return this.settings.title || '';
    }

    get subtitle(): string {
        return this.settings.subtitle || '';
    }

    get benefits(): BenefitItem[] {
        return this.settings.benefits || [];
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
        return this.settings.titleColor || '#000000';
    }

    get subtitleColor(): string {
        return this.settings.subtitleColor || '#6c757d';
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || '#ffffff';
    }

    get iconColor(): string {
        return this.settings.iconColor || '#198754';
    }

    get textColor(): string {
        return this.settings.textColor || '#212529';
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
