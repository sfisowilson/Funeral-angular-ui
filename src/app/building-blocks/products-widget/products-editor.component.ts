import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-products-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="editor-container">
            <h3>Products Widget</h3>

            <h4>Layout</h4>
            <div class="form-group">
                <label>Card Style</label>
                <select class="form-control" [(ngModel)]="config.cardLayout" (ngModelChange)="onConfigChange()">
                    <option value="standard">Standard (image top, full info)</option>
                    <option value="compact">Compact (tile, image + name + price)</option>
                    <option value="list">List (horizontal row)</option>
                </select>
            </div>
            <div class="form-group">
                <label>Columns</label>
                <select class="form-control" [(ngModel)]="config.columns" (ngModelChange)="onConfigChange()">
                    <option [value]="2">2 Columns</option>
                    <option [value]="3">3 Columns</option>
                    <option [value]="4">4 Columns</option>
                </select>
            </div>
            <div class="form-group">
                <label>Products to Show</label>
                <input type="number" class="form-control" [(ngModel)]="config.productsToShow" (ngModelChange)="onConfigChange()" />
            </div>

            <h4>Content</h4>
            <div class="form-group">
                <label>Title</label>
                <input type="text" class="form-control" [(ngModel)]="config.title" (ngModelChange)="onConfigChange()" />
            </div>
            <div class="form-group">
                <label>Subtitle</label>
                <input type="text" class="form-control" [(ngModel)]="config.subtitle" (ngModelChange)="onConfigChange()" />
            </div>
            <div class="form-group">
                <label>Add to Cart Label</label>
                <input type="text" class="form-control" [(ngModel)]="config.addToCartLabel" (ngModelChange)="onConfigChange()" />
            </div>
            <div class="form-group">
                <label>View All Link</label>
                <input type="text" class="form-control" [(ngModel)]="config.viewAllLink" (ngModelChange)="onConfigChange()" />
            </div>
            <div class="form-group">
                <label>Currency Symbol</label>
                <input type="text" class="form-control" [(ngModel)]="config.currencySymbol" (ngModelChange)="onConfigChange()" style="max-width:80px" />
            </div>

            <h4>Show / Hide</h4>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showTitle" (ngModelChange)="onConfigChange()" /> Show Title</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showSubtitle" (ngModelChange)="onConfigChange()" /> Show Subtitle</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showFilters" (ngModelChange)="onConfigChange()" /> Show Filters</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showSort" (ngModelChange)="onConfigChange()" /> Show Sort</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showPrice" (ngModelChange)="onConfigChange()" /> Show Price</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showCategory" (ngModelChange)="onConfigChange()" /> Show Category Label</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showSku" (ngModelChange)="onConfigChange()" /> Show SKU</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showDescription" (ngModelChange)="onConfigChange()" /> Show Description</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showAddToCart" (ngModelChange)="onConfigChange()" /> Show Add to Cart Button</label></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showViewAll" (ngModelChange)="onConfigChange()" /> Show View All Button</label></div>

            <h4>Colors</h4>
            <div class="form-group"><label>Background</label><input type="color" class="form-control color-input" [(ngModel)]="config.backgroundColor" (ngModelChange)="onConfigChange()" /></div>
            <div class="form-group"><label>Card Background</label><input type="color" class="form-control color-input" [(ngModel)]="config.cardBackground" (ngModelChange)="onConfigChange()" /></div>
            <div class="form-group"><label>Title Color</label><input type="color" class="form-control color-input" [(ngModel)]="config.titleColor" (ngModelChange)="onConfigChange()" /></div>
            <div class="form-group"><label>Subtitle Color</label><input type="color" class="form-control color-input" [(ngModel)]="config.subtitleColor" (ngModelChange)="onConfigChange()" /></div>
            <div class="form-group"><label>Price Color</label><input type="color" class="form-control color-input" [(ngModel)]="config.priceColor" (ngModelChange)="onConfigChange()" /></div>
            <div class="form-group"><label>Button Color</label><input type="color" class="form-control color-input" [(ngModel)]="config.buttonColor" (ngModelChange)="onConfigChange()" /></div>
            <div class="form-group"><label>Button Text Color</label><input type="color" class="form-control color-input" [(ngModel)]="config.buttonTextColor" (ngModelChange)="onConfigChange()" /></div>
        </div>
    `,
    styles: [
        `
            .editor-container {
                padding: 1rem;
            }
            .form-group {
                margin-bottom: 1rem;
            }
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                font-weight: 500;
            }
            .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
            .color-input { height: 36px; padding: 2px; }
            h3, h4 { margin-bottom: 1rem; }
            h4 { font-size: 0.9rem; text-transform: uppercase; color: #666; border-top: 1px solid #eee; padding-top: 0.75rem; margin-top: 1rem; }
        `
    ]
})
export class ProductsEditorComponent implements OnInit {
    @Input() config: any = {};
    @Output() configChange = new EventEmitter<any>();

    ngOnInit(): void {
        if (!this.config.title) {
            this.config = {
                title: 'Our Products',
                subtitle: 'Browse our collection',
                showTitle: true,
                showSubtitle: true,
                showFilters: true,
                showCategoryFilter: true,
                showSort: true,
                showDescription: true,
                showViewAll: true,
                viewAllLink: '/shop',
                productsToShow: 8,
                columns: 4,
                cardLayout: 'standard',
                showPrice: true,
                showCategory: true,
                showSku: false,
                showAddToCart: true,
                addToCartLabel: 'Add to Cart',
                currencySymbol: 'R',
                backgroundColor: '#ffffff',
                titleColor: '#333333',
                priceColor: '#000000',
                buttonColor: '#007bff',
                buttonTextColor: '#ffffff',
                badgeColor: '#dc3545',
                cardBackground: '#ffffff'
            };
            this.onConfigChange();
        }
    }

    onConfigChange(): void {
        this.configChange.emit(this.config);
    }
}
