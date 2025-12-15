import { Component, OnInit } from '@angular/core';
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
    config: any;
    activeCategoryIndex = 0;

    ngOnInit() {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Initialize defaults
        if (!this.config.settings.title) {
            this.config.settings.title = 'Everything You Need, All in One Place';
        }

        if (!this.config.settings.subtitle) {
            this.config.settings.subtitle = 'No separate systems, no hidden costs, no technical headaches';
        }

        if (this.config.settings.useCategories === undefined) {
            this.config.settings.useCategories = false;
        }

        if (!this.config.settings.benefits || this.config.settings.benefits.length === 0) {
            this.config.settings.benefits = [
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

        if (!this.config.settings.categories) {
            this.config.settings.categories = [];
        }

        if (this.config.settings.columns === undefined) {
            this.config.settings.columns = 2;
        }

        if (this.config.settings.titleColor === undefined) {
            this.config.settings.titleColor = '#000000';
        }

        if (this.config.settings.subtitleColor === undefined) {
            this.config.settings.subtitleColor = '#6c757d';
        }

        if (this.config.settings.backgroundColor === undefined) {
            this.config.settings.backgroundColor = '#ffffff';
        }

        if (this.config.settings.iconColor === undefined) {
            this.config.settings.iconColor = '#198754';
        }

        if (this.config.settings.textColor === undefined) {
            this.config.settings.textColor = '#212529';
        }

        if (this.config.settings.padding === undefined) {
            this.config.settings.padding = 40;
        }

        if (this.config.settings.allowExpand === undefined) {
            this.config.settings.allowExpand = true;
        }
    }

    addBenefit() {
        if (!this.config.settings.benefits) {
            this.config.settings.benefits = [];
        }

        this.config.settings.benefits.push({
            icon: 'bi bi-check-circle-fill',
            text: 'New benefit'
        });
    }

    removeBenefit(index: number) {
        this.config.settings.benefits.splice(index, 1);
    }

    addCategory() {
        if (!this.config.settings.categories) {
            this.config.settings.categories = [];
        }

        this.config.settings.categories.push({
            name: 'New Category',
            items: [],
            expanded: true
        });

        this.activeCategoryIndex = this.config.settings.categories.length - 1;
    }

    removeCategory(index: number) {
        this.config.settings.categories.splice(index, 1);
        if (this.activeCategoryIndex >= this.config.settings.categories.length) {
            this.activeCategoryIndex = Math.max(0, this.config.settings.categories.length - 1);
        }
    }

    addItemToCategory(categoryIndex: number) {
        if (!this.config.settings.categories[categoryIndex].items) {
            this.config.settings.categories[categoryIndex].items = [];
        }

        this.config.settings.categories[categoryIndex].items.push({
            icon: 'bi bi-check-circle-fill',
            text: 'New item'
        });
    }

    removeItemFromCategory(categoryIndex: number, itemIndex: number) {
        this.config.settings.categories[categoryIndex].items.splice(itemIndex, 1);
    }
}
