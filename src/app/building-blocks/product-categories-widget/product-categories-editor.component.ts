import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-product-categories-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="editor">
      <div class="form-group"><label>Title</label><input type="text" class="form-control" [(ngModel)]="config.title" (ngModelChange)="onChange()"></div>
      <div class="form-group"><label>Columns</label><select class="form-control" [(ngModel)]="config.columns" (ngModelChange)="onChange()"><option [value]="2">2</option><option [value]="3">3</option><option [value]="4">4</option></select></div>
      <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showTitle" (ngModelChange)="onChange()"> Show Title</label></div>
      <div class="form-group"><label>Background</label><input type="color" class="form-control" [(ngModel)]="config.backgroundColor" (ngModelChange)="onChange()"></div>
    </div>
    `,
    styles: [`.editor { padding: 1rem; } .form-group { margin-bottom: 1rem; } label { display: block; margin-bottom: 0.5rem; } .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }`]
})
export class ProductCategoriesEditorComponent implements OnInit {
    @Input() config: any = {};
    @Output() configChange = new EventEmitter<any>();

    ngOnInit(): void {
        if (!this.config.title) {
            this.config = { title: 'Shop by Category', showTitle: true, columns: 4, backgroundColor: '#ffffff', titleColor: '#333333', cardBackground: '#f8f9fa' };
            this.onChange();
        }
    }

    onChange(): void { this.configChange.emit(this.config); }
}
