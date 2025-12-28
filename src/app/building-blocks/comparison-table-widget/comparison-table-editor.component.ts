import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComparisonColumn } from './comparison-table-widget.component';

@Component({
    selector: 'app-comparison-table-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './comparison-table-editor.component.html',
    styleUrls: ['./comparison-table-editor.component.scss']
})
export class ComparisonTableEditorComponent implements OnInit {
    @Output() update = new EventEmitter<any>();
    config: any;
    activeColumnIndex = 0;
    
    onSave() {
        this.update.emit(this.config.settings);
    }

    ngOnInit() {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Initialize with default values
        if (!this.config.settings.title) {
            this.config.settings.title = 'Cost Comparison';
        }

        if (!this.config.settings.subtitle) {
            this.config.settings.subtitle = 'Traditional Website Development vs Our Platform';
        }

        if (!this.config.settings.columns || this.config.settings.columns.length === 0) {
            this.config.settings.columns = [
                {
                    title: 'Traditional Route',
                    subtitle: 'What you pay separately',
                    isHighlighted: false,
                    highlightColor: 'var(--danger-bg, #f8d7da)',
                    items: [
                        { label: 'Domain Purchase', value: 'R150-R500/year' },
                        { label: 'Web Hosting', value: 'R80-R500/month' },
                        { label: 'Website Development', value: 'R5,000-R50,000' },
                        { label: 'Maintenance', value: 'R500-R2,000/month' },
                        { label: 'Management Software', value: 'R1,500-R5,000/month' }
                    ],
                    total: 'R15,000-R80,000+'
                },
                {
                    title: 'Our Platform',
                    subtitle: 'Everything included',
                    isHighlighted: true,
                    highlightColor: 'var(--success-bg, #d4edda)',
                    items: [
                        { label: 'Custom Subdomain', value: 'Included ✓' },
                        { label: 'Enterprise Hosting', value: 'Included ✓' },
                        { label: 'Professional Website', value: 'Included ✓' },
                        { label: 'Updates & Support', value: 'Included ✓' },
                        { label: 'Business Tools', value: 'Included ✓' }
                    ],
                    total: 'R[Your Price]/month'
                }
            ];
        }

        if (this.config.settings.titleColor === undefined) {
            this.config.settings.titleColor = 'var(--text-color, #000000)';
        }

        if (this.config.settings.subtitleColor === undefined) {
            this.config.settings.subtitleColor = 'var(--muted-color, #6c757d)';
        }

        if (this.config.settings.backgroundColor === undefined) {
            this.config.settings.backgroundColor = 'var(--surface-card, #ffffff)';
        }

        if (this.config.settings.padding === undefined) {
            this.config.settings.padding = 40;
        }

        if (this.config.settings.borderRadius === undefined) {
            this.config.settings.borderRadius = 8;
        }

        if (this.config.settings.showBorders === undefined) {
            this.config.settings.showBorders = true;
        }

        if (this.config.settings.columnHeaderBg === undefined) {
            this.config.settings.columnHeaderBg = 'var(--surface-ground, #f8f9fa)';
        }

        if (this.config.settings.rowHoverEffect === undefined) {
            this.config.settings.rowHoverEffect = true;
        }
    }

    addColumn() {
        if (!this.config.settings.columns) {
            this.config.settings.columns = [];
        }

        this.config.settings.columns.push({
            title: 'New Column',
            subtitle: '',
            isHighlighted: false,
            highlightColor: 'var(--info-bg, #e3f2fd)',
            items: [],
            total: ''
        });

        this.activeColumnIndex = this.config.settings.columns.length - 1;
    }

    removeColumn(index: number) {
        this.config.settings.columns.splice(index, 1);
        if (this.activeColumnIndex >= this.config.settings.columns.length) {
            this.activeColumnIndex = Math.max(0, this.config.settings.columns.length - 1);
        }
    }

    addItem(columnIndex: number) {
        if (!this.config.settings.columns[columnIndex].items) {
            this.config.settings.columns[columnIndex].items = [];
        }

        this.config.settings.columns[columnIndex].items.push({
            label: 'New Item',
            value: 'Value'
        });
    }

    removeItem(columnIndex: number, itemIndex: number) {
        this.config.settings.columns[columnIndex].items.splice(itemIndex, 1);
    }

    moveItemUp(columnIndex: number, itemIndex: number) {
        if (itemIndex > 0) {
            const items = this.config.settings.columns[columnIndex].items;
            [items[itemIndex - 1], items[itemIndex]] = [items[itemIndex], items[itemIndex - 1]];
        }
    }

    moveItemDown(columnIndex: number, itemIndex: number) {
        const items = this.config.settings.columns[columnIndex].items;
        if (itemIndex < items.length - 1) {
            [items[itemIndex], items[itemIndex + 1]] = [items[itemIndex + 1], items[itemIndex]];
        }
    }
}
