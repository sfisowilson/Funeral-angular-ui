import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../core/services/product.service';

@Component({
    selector: 'app-products-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="products-widget" [ngStyle]="getContainerStyles()">
      <div class="container">
        <h2 *ngIf="config.showTitle" [ngStyle]="getTitleStyles()">{{ config.title }}</h2>
        <p *ngIf="config.showSubtitle" class="subtitle">{{ config.subtitle }}</p>
        
        <div class="filters" *ngIf="config.showFilters">
          <input type="text" class="search-box" placeholder="Search products..." [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()">
          <select class="category-filter" [(ngModel)]="selectedCategory" (ngModelChange)="applyFilters()" *ngIf="config.showCategoryFilter">
            <option value="">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
        </div>

        <div class="products-grid" [class.grid-2]="config.columns === 2" [class.grid-3]="config.columns === 3" [class.grid-4]="config.columns === 4">
          <div class="product-card" *ngFor="let product of filteredProducts.slice(0, config.productsToShow)" [ngStyle]="getCardStyles()">
            <div class="product-image">
              <img [src]="(product.images && product.images[0]?.imageUrl) || product.images?.[0]?.url || '/assets/placeholder.png'" [alt]="product.name">
              <span class="sale-badge" *ngIf="product.compareAtPrice && product.compareAtPrice > product.price" [ngStyle]="getBadgeStyles()">SALE</span>
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-description" *ngIf="config.showDescription">{{ product.shortDescription || product.description }}</p>
              <div class="product-pricing">
                <span class="price" [ngStyle]="getPriceStyles()">\${{ product.price | number:'1.2-2' }}</span>
                <span class="compare-price" *ngIf="product.compareAtPrice && product.compareAtPrice > product.price">\${{ product.compareAtPrice | number:'1.2-2' }}</span>
              </div>
              <button class="btn-add-to-cart" [ngStyle]="getButtonStyles()" (click)="addToCart(product)">{{ config.buttonText }}</button>
            </div>
          </div>
        </div>

        <div class="text-center mt-4" *ngIf="config.showViewAll">
          <a [href]="config.viewAllLink" class="btn-view-all" [ngStyle]="getButtonStyles()">View All Products</a>
        </div>
      </div>
    </div>
    `,
    styles: [`
    .products-widget { padding: 4rem 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    h2 { text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .filters { display: flex; gap: 1rem; margin-bottom: 2rem; justify-content: center; }
    .search-box, .category-filter { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 4px; }
    .products-grid { display: grid; gap: 2rem; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    .product-card { border: 1px solid #eee; border-radius: 8px; overflow: hidden; transition: transform 0.3s; }
    .product-card:hover { transform: translateY(-5px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .product-image { position: relative; overflow: hidden; }
    .product-image img { width: 100%; height: 300px; object-fit: cover; }
    .sale-badge { position: absolute; top: 10px; right: 10px; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; font-weight: bold; }
    .product-info { padding: 1.5rem; }
    .product-name { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .product-description { color: #666; font-size: 0.875rem; margin-bottom: 1rem; }
    .product-pricing { margin-bottom: 1rem; }
    .price { font-size: 1.5rem; font-weight: bold; }
    .compare-price { text-decoration: line-through; color: #999; margin-left: 0.5rem; }
    .btn-add-to-cart, .btn-view-all { width: 100%; padding: 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
    @media (max-width: 768px) {
      .products-grid { grid-template-columns: 1fr !important; }
    }
    `]
})
export class ProductsWidgetComponent implements OnInit {
    @Input() config: any = {
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

    products: Product[] = [];
    filteredProducts: Product[] = [];
    categories: string[] = [];
    searchTerm = '';
    selectedCategory = '';

    constructor(private productService: ProductService) {}

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.productService.getActiveProducts().subscribe({
            next: (data: Product[]) => {
                this.products = data;
                this.categories = [...new Set(data.map((p: Product) => p.category).filter((c): c is string => c !== undefined))];
                this.applyFilters();
            },
            error: (_error: any) => console.error('Error loading products')
        });
    }

    applyFilters(): void {
        this.filteredProducts = this.products.filter(p => {
            const matchesSearch = !this.searchTerm || p.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesCategory = !this.selectedCategory || p.category === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }

    addToCart(product: Product): void {
        alert(`${product.name} added to cart!`);
    }

    getContainerStyles() { return { backgroundColor: this.config.backgroundColor }; }
    getTitleStyles() { return { color: this.config.titleColor }; }
    getPriceStyles() { return { color: this.config.priceColor }; }
    getBadgeStyles() { return { backgroundColor: this.config.badgeColor, color: 'white' }; }
    getCardStyles() { return { backgroundColor: this.config.cardBackground }; }
    getButtonStyles() { return { backgroundColor: this.config.buttonColor, color: this.config.buttonTextColor }; }
}
