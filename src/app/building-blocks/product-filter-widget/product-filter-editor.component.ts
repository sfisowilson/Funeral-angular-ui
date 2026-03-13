import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-product-filter-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="editor-section">
            <h4>Filter Widget Settings</h4>

            <div class="field">
                <label>Filter Position</label>
                <select [(ngModel)]="config.filterPosition" (ngModelChange)="changed()">
                    <option value="top-bar">Top Bar</option>
                    <option value="sidebar">Sidebar</option>
                </select>
            </div>

            <div class="field toggle-row">
                <label>Show Search</label>
                <input type="checkbox" [(ngModel)]="config.showSearch" (ngModelChange)="changed()" />
            </div>
            <div class="field" *ngIf="config.showSearch">
                <label>Search Placeholder</label>
                <input type="text" [(ngModel)]="config.searchPlaceholder" (ngModelChange)="changed()" />
            </div>

            <div class="field toggle-row">
                <label>Show Category Filter</label>
                <input type="checkbox" [(ngModel)]="config.showCategoryFilter" (ngModelChange)="changed()" />
            </div>
            <div class="field toggle-row">
                <label>Show Price Filter</label>
                <input type="checkbox" [(ngModel)]="config.showPriceFilter" (ngModelChange)="changed()" />
            </div>
            <div class="field toggle-row">
                <label>Show Sort</label>
                <input type="checkbox" [(ngModel)]="config.showSort" (ngModelChange)="changed()" />
            </div>
            <div class="field toggle-row">
                <label>Show Label</label>
                <input type="checkbox" [(ngModel)]="config.showLabel" (ngModelChange)="changed()" />
            </div>
            <div class="field" *ngIf="config.showLabel">
                <label>Label Text</label>
                <input type="text" [(ngModel)]="config.label" (ngModelChange)="changed()" />
            </div>
            <div class="field">
                <label>Panel Background</label>
                <input type="color" [(ngModel)]="config.panelBackground" (ngModelChange)="changed()" />
            </div>
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
export class ProductFilterEditorComponent {
    @Input() config: any = {};
    @Output() configChange = new EventEmitter<any>();
    changed() { this.configChange.emit(this.config); }
}
