import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BenefitItem, BenefitCategory } from './benefits-checklist-widget.component';

@Component({
    selector: 'app-benefits-checklist-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './benefits-checklist-editor.component.html',
    styleUrls: ['./benefits-checklist-editor.component.scss']
})
export class BenefitsChecklistEditorComponent implements OnInit {
    @Input() config: any;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    activeCategoryIndex = 0;
    settings: any;

    ngOnInit() {
        console.log('BenefitsChecklistEditorComponent initialized with config:', this.config);
        
        // Fix: Use config directly instead of config.settings
        if (!this.config) {
            this.config = {};
        }

        // Initialize defaults
        if (!this.config.title) {
            this.config.title = 'Everything You Need, All in One Place';
        }

        if (!this.config.subtitle) {
            this.config.subtitle = 'No separate systems, no hidden costs, no technical headaches';
        }

        if (this.config.useCategories === undefined) {
            this.config.useCategories = false;
        }

        if (!this.config.benefits || this.config.benefits.length === 0) {
            this.config.benefits = [
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

        if (!this.config.categories) {
            this.config.categories = [];
        }

        if (this.config.columns === undefined) {
            this.config.columns = 2;
        }

        if (this.config.titleColor === undefined) {
            this.config.titleColor = 'var(--text-color, #000000)';
        }

        if (this.config.subtitleColor === undefined) {
            this.config.subtitleColor = 'var(--muted-color, #6c757d)';
        }

        if (this.config.backgroundColor === undefined) {
            this.config.backgroundColor = 'var(--surface-card, #ffffff)';
        }

        if (this.config.iconColor === undefined) {
            this.config.iconColor = 'var(--success-color, #198754)';
        }

        if (this.config.textColor === undefined) {
            this.config.textColor = 'var(--text-color, #212529)';
        }

        if (this.config.padding === undefined) {
            this.config.padding = 40;
        }

        if (this.config.allowExpand === undefined) {
            this.config.allowExpand = true;
        }
    }

    
    onSave() {
        console.log('BenefitsChecklistEditorComponent onSave called', this.config);
        
        // Fix: Use config directly instead of config.settings
        this.settings = JSON.parse(JSON.stringify(this.config));
        this.update.emit(this.settings);
    }

    addBenefit() {
        if (!this.config.benefits) {
            this.config.benefits = [];
        }

        this.config.benefits.push({
            icon: 'bi bi-check-circle-fill',
            text: 'New benefit'
        });
    }

    removeBenefit(index: number) {
        this.config.benefits.splice(index, 1);
    }

    addCategory() {
        if (!this.config.categories) {
            this.config.categories = [];
        }

        this.config.categories.push({
            name: 'New Category',
            items: [],
            expanded: true
        });

        this.activeCategoryIndex = this.config.categories.length - 1;
    }

    removeCategory(index: number) {
        this.config.categories.splice(index, 1);
        if (this.activeCategoryIndex >= this.config.categories.length) {
            this.activeCategoryIndex = Math.max(0, this.config.categories.length - 1);
        }
    }

    addItemToCategory(categoryIndex: number) {
        if (!this.config.categories[categoryIndex].items) {
            this.config.categories[categoryIndex].items = [];
        }

        this.config.categories[categoryIndex].items.push({
            icon: 'bi bi-check-circle-fill',
            text: 'New item'
        });
    }

    removeItemFromCategory(categoryIndex: number, itemIndex: number) {
        this.config.categories[categoryIndex].items.splice(itemIndex, 1);
    }
}
