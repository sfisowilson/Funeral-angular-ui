import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-featured-products-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="editor">
      <div class="form-group"><label>Title</label><input type="text" class="form-control" [(ngModel)]="config.title" (ngModelChange)="onChange()"></div>
      <div class="form-group"><label>Products to Show</label><input type="number" class="form-control" [(ngModel)]="config.productsToShow" (ngModelChange)="onChange()"></div>
      <div class="form-group"><label>Button Text</label><input type="text" class="form-control" [(ngModel)]="config.buttonText" (ngModelChange)="onChange()"></div>
      <div class="form-group"><label><input type="checkbox" [(ngModel)]="config.showTitle" (ngModelChange)="onChange()"> Show Title</label></div>
      <div class="form-group"><label>Background</label><input type="color" class="form-control" [(ngModel)]="config.backgroundColor" (ngModelChange)="onChange()"></div>
      <div class="form-group"><label>Button Color</label><input type="color" class="form-control" [(ngModel)]="config.buttonColor" (ngModelChange)="onChange()"></div>
    </div>
    `,
    styles: [`.editor { padding: 1rem; } .form-group { margin-bottom: 1rem; } label { display: block; margin-bottom: 0.5rem; } .form-control { width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; }`]
})
export class FeaturedProductsEditorComponent implements OnInit {
    @Input() config: any = {};
    @Output() configChange = new EventEmitter<any>();

    ngOnInit(): void {
        if (!this.config.title) {
            this.config = { title: 'Featured Products', showTitle: true, productsToShow: 3, buttonText: 'Shop Now', backgroundColor: '#f8f9fa', titleColor: '#333333', buttonColor: '#28a745', buttonTextColor: '#ffffff' };
            this.onChange();
        }
    }

    onChange(): void { this.configChange.emit(this.config); }
}
