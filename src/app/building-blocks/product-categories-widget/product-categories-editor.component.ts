import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-product-categories-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="editor">
            <h4>Display Style</h4>
            <div class="form-group">
                <label>Style</label>
                <select class="form-control" [(ngModel)]="config.displayStyle" (ngModelChange)="onChange()">
                    <option value="pills">Pills / Chips (compact horizontal tags)</option>
                    <option value="small-tiles">Small Tiles (circular icon + name)</option>
                    <option value="banners">Banners (large image cards)</option>
                    <option value="dropdown">Dropdown select</option>
                </select>
            </div>
            <div class="form-group" *ngIf="config.displayStyle !== 'pills' && config.displayStyle !== 'dropdown'">
                <label>Columns</label>
                <select class="form-control" [(ngModel)]="config.columns" (ngModelChange)="onChange()">
                    <option [value]="2">2</option>
                    <option [value]="3">3</option>
                    <option [value]="4">4</option>
                    <option [value]="5">5</option>
                    <option [value]="6">6</option>
                </select>
            </div>

            <h4>Content</h4>
            <div class="form-group"><label>Title</label><input type="text" class="form-control" [(ngModel)]="config.title" (ngModelChange)="onChange()" /></div>
            <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showTitle" (ngModelChange)="onChange()" /> Show Title</label></div>
            <div class="form-group">
                <label>Section Padding (px)</label>
                <input type="number" class="form-control" [(ngModel)]="config.padding" (ngModelChange)="onChange()" />
            </div>

            <h4>Colors</h4>
            <div class="form-group"><label>Background</label><input type="color" class="form-control color-input" [(ngModel)]="config.backgroundColor" (ngModelChange)="onChange()" /></div>
            <div class="form-group"><label>Title Color</label><input type="color" class="form-control color-input" [(ngModel)]="config.titleColor" (ngModelChange)="onChange()" /></div>
            <div class="form-group"><label>Card / Pill Background</label><input type="color" class="form-control color-input" [(ngModel)]="config.cardBackground" (ngModelChange)="onChange()" /></div>
            <div class="form-group"><label>Card / Pill Text Color</label><input type="color" class="form-control color-input" [(ngModel)]="config.cardTextColor" (ngModelChange)="onChange()" /></div>
            <div class="form-group"><label>Accent Color</label><input type="color" class="form-control color-input" [(ngModel)]="config.accentColor" (ngModelChange)="onChange()" /></div>
        </div>
    `,
    styles: [
        `
            .editor { padding: 1rem; }
            .form-group { margin-bottom: 1rem; }
            label { display: block; margin-bottom: 0.5rem; }
            .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
            .color-input { height: 36px; padding: 2px; }
            h4 { font-size: 0.9rem; text-transform: uppercase; color: #666; border-top: 1px solid #eee; padding-top: 0.75rem; margin: 1rem 0 0.75rem; }
            h4:first-child { border-top: none; margin-top: 0; }
        `
    ]
})
export class ProductCategoriesEditorComponent implements OnInit {
    @Input() config: any = {};
    @Output() configChange = new EventEmitter<any>();

    ngOnInit(): void {
        if (!this.config.title) {
            this.config = {
                title: 'Shop by Category',
                showTitle: true,
                displayStyle: 'pills',
                columns: 4,
                padding: 50,
                backgroundColor: '#ffffff',
                titleColor: '#333333',
                cardBackground: '#f0f4ff',
                cardTextColor: '#333333',
                accentColor: '#007bff'
            };
            this.onChange();
        }
    }

    onChange(): void {
        this.configChange.emit(this.config);
    }
}
