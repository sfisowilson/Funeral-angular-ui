import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-products-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="editor-container">
      <h3>Products Widget Configuration</h3>
      
      <div class="form-group">
        <label>Title</label>
        <input type="text" class="form-control" [(ngModel)]="config.title" (ngModelChange)="onConfigChange()">
      </div>

      <div class="form-group">
        <label>Subtitle</label>
        <input type="text" class="form-control" [(ngModel)]="config.subtitle" (ngModelChange)="onConfigChange()">
      </div>

      <div class="form-group">
        <label>Products to Show</label>
        <input type="number" class="form-control" [(ngModel)]="config.productsToShow" (ngModelChange)="onConfigChange()">
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
        <label>Button Text</label>
        <input type="text" class="form-control" [(ngModel)]="config.buttonText" (ngModelChange)="onConfigChange()">
      </div>

      <div class="form-group">
        <label>View All Link</label>
        <input type="text" class="form-control" [(ngModel)]="config.viewAllLink" (ngModelChange)="onConfigChange()">
      </div>

      <div class="form-group">
        <label><input type="checkbox" [(ngModel)]="config.showTitle" (ngModelChange)="onConfigChange()"> Show Title</label>
      </div>

      <div class="form-group">
        <label><input type="checkbox" [(ngModel)]="config.showSubtitle" (ngModelChange)="onConfigChange()"> Show Subtitle</label>
      </div>

      <div class="form-group">
        <label><input type="checkbox" [(ngModel)]="config.showFilters" (ngModelChange)="onConfigChange()"> Show Filters</label>
      </div>

      <div class="form-group">
        <label><input type="checkbox" [(ngModel)]="config.showDescription" (ngModelChange)="onConfigChange()"> Show Description</label>
      </div>

      <div class="form-group">
        <label><input type="checkbox" [(ngModel)]="config.showViewAll" (ngModelChange)="onConfigChange()"> Show View All Button</label>
      </div>

      <h4>Colors</h4>
      <div class="form-group">
        <label>Background Color</label>
        <input type="color" class="form-control" [(ngModel)]="config.backgroundColor" (ngModelChange)="onConfigChange()">
      </div>

      <div class="form-group">
        <label>Title Color</label>
        <input type="color" class="form-control" [(ngModel)]="config.titleColor" (ngModelChange)="onConfigChange()">
      </div>

      <div class="form-group">
        <label>Button Color</label>
        <input type="color" class="form-control" [(ngModel)]="config.buttonColor" (ngModelChange)="onConfigChange()">
      </div>

      <div class="form-group">
        <label>Button Text Color</label>
        <input type="color" class="form-control" [(ngModel)]="config.buttonTextColor" (ngModelChange)="onConfigChange()">
      </div>
    </div>
    `,
    styles: [`
    .editor-container { padding: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }
    h3, h4 { margin-bottom: 1rem; }
    `]
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
                showDescription: true,
                showViewAll: true,
                viewAllLink: '/products',
                productsToShow: 8,
                columns: 4,
                buttonText: 'Add to Cart',
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
