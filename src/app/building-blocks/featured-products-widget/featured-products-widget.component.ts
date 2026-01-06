import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService, Product } from '../../core/services/product.service';
import { ProductServiceProxy } from '@app/core/services/service-proxies';

@Component({
    selector: 'app-featured-products-widget',
    standalone: true,
  imports: [CommonModule],
    providers: [ProductService, ProductServiceProxy],
    template: `
    <div class="featured-products" [ngStyle]="getStyles()">
      <div class="container">
        <h2 *ngIf="config.showTitle">{{ config.title }}</h2>
        <div class="products-row">
          <div class="product-item" *ngFor="let product of products.slice(0, config.productsToShow)">
            <img [src]="(product.images && product.images[0]?.imageUrl) || product.images?.[0]?.url || '/assets/placeholder.png'" [alt]="product.name">
            <h3>{{ product.name }}</h3>
            <p class="price">\${{ product.price | number:'1.2-2' }}</p>
            <button class="btn-buy" [ngStyle]="getButtonStyles()">{{ config.buttonText }}</button>
          </div>
        </div>
      </div>
    </div>
    `,
    styles: [`
    .featured-products { padding: 3rem 0; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
    h2 { text-align: center; margin-bottom: 2rem; font-size: 2rem; }
    .products-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
    .product-item { text-align: center; }
    .product-item img { width: 100%; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem; }
    .product-item h3 { font-size: 1.125rem; margin-bottom: 0.5rem; }
    .price { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
    .btn-buy { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; }
    `]
})
export class FeaturedProductsWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Featured Products',
        showTitle: true,
        productsToShow: 3,
        buttonText: 'Shop Now',
        backgroundColor: '#f8f9fa',
        titleColor: '#333333',
        buttonColor: '#28a745',
        buttonTextColor: '#ffffff'
    };
    products: Product[] = [];

    constructor(private productService: ProductService) {}

    ngOnInit(): void {
        this.productService.getFeaturedProducts().subscribe({
            next: (data: Product[]) => this.products = data,
            error: (_error: any) => console.error('Error loading featured products')
        });
    }

    getStyles() { return { backgroundColor: this.config.backgroundColor, color: this.config.titleColor }; }
    getButtonStyles() { return { backgroundColor: this.config.buttonColor, color: this.config.buttonTextColor }; }
}
