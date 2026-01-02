import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Category } from '../../core/services/product.service';

@Component({
    selector: 'app-product-categories-widget',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="categories-widget" [ngStyle]="getStyles()">
      <div class="container">
        <h2 *ngIf="config.showTitle">{{ config.title }}</h2>
        <div class="categories-grid" [class.grid-2]="config.columns === 2" [class.grid-3]="config.columns === 3" [class.grid-4]="config.columns === 4">
          <a *ngFor="let category of categories" [href]="'/products?category=' + category.slug" class="category-card" [ngStyle]="getCardStyles()">
            <img *ngIf="category.image" [src]="category.image" [alt]="category.name">
            <div class="category-overlay"><h3>{{ category.name }}</h3></div>
          </a>
        </div>
      </div>
    </div>
    `,
    styles: [`
    .categories-widget { padding: 3rem 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    h2 { text-align: center; margin-bottom: 2rem; }
    .categories-grid { display: grid; gap: 1.5rem; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .category-card { position: relative; height: 200px; border-radius: 8px; overflow: hidden; text-decoration: none; }
    .category-card img { width: 100%; height: 100%; object-fit: cover; }
    .category-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; }
    .category-overlay h3 { color: white; font-size: 1.5rem; text-align: center; }
    @media (max-width: 768px) { .categories-grid { grid-template-columns: 1fr !important; } }
    `]
})
export class ProductCategoriesWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Shop by Category',
        showTitle: true,
        columns: 4,
        backgroundColor: '#ffffff',
        titleColor: '#333333',
        cardBackground: '#f8f9fa'
    };
    categories: Category[] = [];

    constructor(private productService: ProductService) {}

    ngOnInit(): void {
        this.productService.getCategories().subscribe({
            next: (data: Category[]) => this.categories = data.filter(c => c.isActive),
            error: (_error: any) => console.error('Error loading categories')
        });
    }

    getStyles() { return { backgroundColor: this.config.backgroundColor, color: this.config.titleColor }; }
    getCardStyles() { return { backgroundColor: this.config.cardBackground }; }
}
