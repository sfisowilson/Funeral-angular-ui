import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { hexToRgba } from '../widget-color.utils';

export interface AccordionItem {
    id: string;
    icon?: string;
    question: string;
    answer: string;
    expanded?: boolean;
}

export interface EnhancedAccordionSettings {
    title?: string;
    subtitle?: string;
    allowMultiple?: boolean;
    showIcons?: boolean;
    enableSearch?: boolean;
    expandAllButton?: boolean;
}

@Component({
    selector: 'app-enhanced-accordion-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './enhanced-accordion-widget.component.html',
    styleUrls: ['./enhanced-accordion-widget.component.scss']
})
export class EnhancedAccordionWidgetComponent {
    @Input() config: any = {};

    searchQuery: string = '';

    get title(): string {
        return this.config.settings?.title || '';
    }

    get subtitle(): string {
        return this.config.settings?.subtitle || '';
    }

    get backgroundColor(): string { return hexToRgba(this.config.settings?.backgroundColor || '#ffffff', this.config.settings?.backgroundOpacity ?? 1); }
    get titleColor(): string { return this.config.settings?.titleColor || '#1a1a1a'; }
    get subtitleColor(): string { return this.config.settings?.subtitleColor || '#6c757d'; }
    get headerBackgroundColor(): string { return hexToRgba(this.config.settings?.headerBackgroundColor || '#f8f9fa', this.config.settings?.headerBackgroundOpacity ?? 1); }
    get headerTextColor(): string { return this.config.settings?.headerTextColor || '#1a1a1a'; }
    get headerActiveBackgroundColor(): string { return hexToRgba(this.config.settings?.headerActiveBackgroundColor || '#0d6efd', this.config.settings?.headerActiveBackgroundOpacity ?? 1); }
    get headerActiveTextColor(): string { return this.config.settings?.headerActiveTextColor || '#ffffff'; }
    get bodyBackgroundColor(): string { return hexToRgba(this.config.settings?.bodyBackgroundColor || '#ffffff', this.config.settings?.bodyBackgroundOpacity ?? 1); }
    get bodyTextColor(): string { return this.config.settings?.bodyTextColor || '#212529'; }
    get iconColor(): string { return this.config.settings?.iconColor || '#0d6efd'; }
    get searchButtonColor(): string { return hexToRgba(this.config.settings?.searchButtonColor || '#0d6efd', 1); }
    get searchButtonTextColor(): string { return this.config.settings?.searchButtonTextColor || '#ffffff'; }

    get items(): AccordionItem[] {
        return this.config.items || [];
    }

    get settings(): EnhancedAccordionSettings {
        return this.config.settings || {};
    }

    get allowMultiple(): boolean {
        return this.settings.allowMultiple !== false;
    }

    get showIcons(): boolean {
        return this.settings.showIcons !== false;
    }

    get enableSearch(): boolean {
        return this.settings.enableSearch === true;
    }

    get expandAllButton(): boolean {
        return this.settings.expandAllButton === true;
    }

    get filteredItems(): AccordionItem[] {
        if (!this.searchQuery.trim()) {
            return this.items;
        }

        const query = this.searchQuery.toLowerCase();
        return this.items.filter((item) => item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query));
    }

    get allExpanded(): boolean {
        return this.filteredItems.length > 0 && this.filteredItems.every((item) => item.expanded);
    }

    toggleItem(item: AccordionItem) {
        if (!this.allowMultiple && !item.expanded) {
            // Collapse all other items
            this.items.forEach((i) => {
                if (i.id !== item.id) {
                    i.expanded = false;
                }
            });
        }
        item.expanded = !item.expanded;
    }

    expandAll() {
        this.filteredItems.forEach((item) => (item.expanded = true));
    }

    collapseAll() {
        this.items.forEach((item) => (item.expanded = false));
    }

    onSearchChange(event: any) {
        this.searchQuery = event.target.value;
    }
}
