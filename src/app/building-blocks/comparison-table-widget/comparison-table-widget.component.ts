import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ComparisonColumn {
    title: string;
    subtitle?: string;
    isHighlighted?: boolean;
    highlightColor?: string;
    items: ComparisonItem[];
    total?: string;
}

export interface ComparisonItem {
    label: string;
    value: string;
}

@Component({
    selector: 'app-comparison-table-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './comparison-table-widget.component.html',
    styleUrls: ['./comparison-table-widget.component.scss']
})
export class ComparisonTableWidgetComponent {
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

    get columns(): ComparisonColumn[] {
        return this.settings.columns || [];
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

    get padding(): number {
        return this.settings.padding || 40;
    }

    get borderRadius(): number {
        return this.settings.borderRadius || 8;
    }

    get showBorders(): boolean {
        return this.settings.showBorders !== false;
    }

    get columnHeaderBg(): string {
        return this.settings.columnHeaderBg || '#f8f9fa';
    }

    get rowHoverEffect(): boolean {
        return this.settings.rowHoverEffect !== false;
    }

    getMaxRows(): number[] {
        const maxLength = Math.max(...this.columns.map(col => col.items?.length || 0));
        return Array.from({ length: maxLength }, (_, i) => i);
    }

    hasAnyTotal(): boolean {
        return this.columns.some(col => col.total);
    }
}
