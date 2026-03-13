import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-cart-summary-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="editor-section">
            <h4>Cart Summary Settings</h4>
            <div class="field"><label>Title</label><input type="text" [(ngModel)]="config.title" (ngModelChange)="changed()" /></div>
            <div class="field toggle-row"><label>Show Title</label><input type="checkbox" [(ngModel)]="config.showTitle" (ngModelChange)="changed()" /></div>
            <div class="field toggle-row"><label>Show Thumbnails</label><input type="checkbox" [(ngModel)]="config.showThumbnails" (ngModelChange)="changed()" /></div>
            <div class="field toggle-row"><label>Show Coupon Field</label><input type="checkbox" [(ngModel)]="config.showCouponField" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Empty Message</label><input type="text" [(ngModel)]="config.emptyMessage" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Checkout Button Label</label><input type="text" [(ngModel)]="config.checkoutLabel" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Currency Symbol</label><input type="text" [(ngModel)]="config.currencySymbol" (ngModelChange)="changed()" style="width:60px" /></div>
            <div class="field"><label>Shop Link</label><input type="text" [(ngModel)]="config.shopLink" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Button Color</label><input type="color" [(ngModel)]="config.buttonColor" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Button Text Color</label><input type="color" [(ngModel)]="config.buttonTextColor" (ngModelChange)="changed()" /></div>
            <div class="field"><label>Background Color</label><input type="color" [(ngModel)]="config.backgroundColor" (ngModelChange)="changed()" /></div>
        </div>
    `,
    styles: [`
        .editor-section { padding: 1rem; }
        h4 { margin-bottom: 1rem; font-weight: 600; }
        .field { margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .toggle-row { flex-direction: row; align-items: center; justify-content: space-between; }
        label { font-size: 0.8rem; font-weight: 600; color: #555; }
        input[type=text] { padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 4px; }
    `]
})
export class CartSummaryEditorComponent {
    @Input() config: any = {};
    @Output() configChange = new EventEmitter<any>();
    changed() { this.configChange.emit(this.config); }
}
