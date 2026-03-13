import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../core/services/product.service';

@Component({
    selector: 'app-product-card-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="editor-section">
            <h4>Product Card Settings</h4>

            <div class="field">
                <label>Product</label>
                <select [(ngModel)]="config.productId" (ngModelChange)="changed()">
                    <option [value]="null">— Select a product —</option>
                    <option *ngFor="let p of products" [value]="p.id">{{ p.name }}</option>
                </select>
            </div>

            <div class="field toggle-row"><label>Show Price</label><input type="checkbox" [(ngModel)]="config.showPrice" (ngModelChange)="changed()" /></div>
            <div class="field toggle-row"><label>Show SKU</label><input type="checkbox" [(ngModel)]="config.showSku" (ngModelChange)="changed()" /></div>
            <div class="field toggle-row"><label>Show Category</label><input type="checkbox" [(ngModel)]="config.showCategory" (ngModelChange)="changed()" /></div>
            <div class="field toggle-row"><label>Show Description</label><input type="checkbox" [(ngModel)]="config.showDescription" (ngModelChange)="changed()" /></div>
            <div class="field toggle-row"><label>Show Add to Cart</label><input type="checkbox" [(ngModel)]="config.showAddToCart" (ngModelChange)="changed()" /></div>

            <div class="field">
                <label>Image Mode</label>
                <select [(ngModel)]="config.imageMode" (ngModelChange)="changed()">
                    <option value="primary-only">Primary Image Only</option>
                    <option value="thumbnails">Primary + Thumbnails</option>
                    <option value="none">No Image</option>
                </select>
            </div>
            <div class="field">
                <label>Add to Cart Button Label</label>
                <input type="text" [(ngModel)]="config.addToCartLabel" (ngModelChange)="changed()" />
            </div>
            <div class="field">
                <label>Details Button Label</label>
                <input type="text" [(ngModel)]="config.detailsLabel" (ngModelChange)="changed()" />
            </div>
            <div class="field">
                <label>Currency Symbol</label>
                <input type="text" [(ngModel)]="config.currencySymbol" (ngModelChange)="changed()" style="width:60px" />
            </div>
            <div class="field"><label>Button Color</label><input type="color" [(ngModel)]="config.buttonColor" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Button Text Color</label><input type="color" [(ngModel)]="config.buttonTextColor" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Card Background</label><input type="color" [(ngModel)]="config.cardBackground" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Title Color</label><input type="color" [(ngModel)]="config.titleColor" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Price Color</label><input type="color" [(ngModel)]="config.priceColor" (ngModelChange)="changed()" /></div>
        </div>
    `,
    styles: [`
        .editor-section { padding: 1rem; }
        h4 { margin-bottom: 1rem; font-weight: 600; }
        .field { margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .toggle-row { flex-direction: row; align-items: center; justify-content: space-between; }
        label { font-size: 0.8rem; font-weight: 600; color: #555; }
        input[type=text], select { padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 4px; }
    `]
})
export class ProductCardEditorComponent implements OnInit {
    @Input() config: any = {};
    @Output() configChange = new EventEmitter<any>();

    products: Product[] = [];

    constructor(private productService: ProductService) {}

    ngOnInit(): void {
        this.productService.getActiveProducts().subscribe({ next: (p) => (this.products = p) });
    }

    changed() { this.configChange.emit(this.config); }
}
