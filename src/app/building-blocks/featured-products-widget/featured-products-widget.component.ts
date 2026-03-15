import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService, Product } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
    selector: 'app-featured-products-widget',
    standalone: true,
    imports: [CommonModule, RouterModule],
    providers: [ProductService],
    template: `
        <div class="featured-products" [ngStyle]="getContainerStyles()">
            <div class="container" [ngStyle]="getPaddingStyles()">
                <div class="section-header" *ngIf="config.title">
                    <h2 [ngStyle]="getTitleStyles()">{{ config.title }}</h2>
                    <p *ngIf="config.subtitle" [ngStyle]="getSubtitleStyles()">{{ config.subtitle }}</p>
                </div>

                <!-- Empty state -->
                <p *ngIf="products.length === 0" class="empty-msg">No products available yet.</p>

                <div class="products-grid" [ngStyle]="getGridStyles()">
                    <div class="product-card" *ngFor="let product of products.slice(0, config.productsToShow || 8)" [ngStyle]="getCardStyles()">
                        <!-- Image -->
                        <a [routerLink]="['/product', product.id]" class="product-image-link">
                            <div class="product-image">
                                <img [src]="getPrimaryImage(product)" [alt]="product.name" />
                                <span class="sale-badge" *ngIf="product.compareAtPrice && product.compareAtPrice > product.price" [ngStyle]="getBadgeStyles()">SALE</span>
                            </div>
                        </a>
                        <div class="product-info">
                            <a [routerLink]="['/product', product.id]" class="product-name-link">
                                <h3 class="product-name" [ngStyle]="getCardTitleStyles()">{{ product.name }}</h3>
                            </a>
                            <p class="product-price" [ngStyle]="getPriceStyles()">
                                {{ config.currencySymbol || 'R' }}{{ product.price | number:'1.2-2' }}
                                <span class="compare-price" *ngIf="product.compareAtPrice && product.compareAtPrice > product.price">
                                    {{ config.currencySymbol || 'R' }}{{ product.compareAtPrice | number:'1.2-2' }}
                                </span>
                            </p>
                            <button class="btn-buy" [ngStyle]="getButtonStyles()" (click)="addToCart(product)" [disabled]="product.stockQuantity === 0">
                                {{ product.stockQuantity === 0 ? 'Out of Stock' : (config.buttonText || 'Add to Cart') }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- View All -->
                <div class="view-all-row" *ngIf="config.showViewAll">
                    <a [routerLink]="config.viewAllLink || '/shop'" class="btn-view-all" [ngStyle]="getViewAllStyles()">
                        {{ config.viewAllText || 'View All Products' }}
                    </a>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .featured-products { }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        .section-header { text-align: center; margin-bottom: 2rem; }
        .section-header h2 { font-size: 2rem; margin-bottom: 0.5rem; }
        .section-header p { font-size: 1rem; }
        .empty-msg { text-align: center; color: #999; font-style: italic; padding: 2rem 0; }
        .products-grid { display: grid; gap: 2rem; }
        .product-card { border-radius: 8px; overflow: hidden; transition: box-shadow .2s; }
        .product-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.12); }
        .product-image-link { display: block; }
        .product-image { overflow: hidden; position: relative; }
        .product-image img { width: 100%; height: 260px; object-fit: cover; display: block; transition: transform .3s; }
        .product-card:hover .product-image img { transform: scale(1.04); }
        .sale-badge { position: absolute; top: 10px; right: 10px; padding: 3px 10px; border-radius: 4px; font-size: .75rem; font-weight: 700; }
        .product-info { padding: 1.25rem; }
        .product-name-link { text-decoration: none; color: inherit; }
        .product-name { font-size: 1.1rem; margin: 0 0 .5rem; }
        .product-price { font-size: 1.25rem; font-weight: 700; margin: 0 0 1rem; }
        .compare-price { font-size: .9rem; font-weight: 400; text-decoration: line-through; color: #999; margin-left: .5rem; }
        .btn-buy { width: 100%; padding: .75rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: .875rem; transition: opacity .2s; }
        .btn-buy:disabled { opacity: .5; cursor: not-allowed; }
        .view-all-row { text-align: center; margin-top: 2.5rem; }
        .btn-view-all { display: inline-block; padding: .85rem 2rem; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: .95rem; }
        @media (max-width: 768px) { .products-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .products-grid { grid-template-columns: 1fr !important; } }
    `]
})
export class FeaturedProductsWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Featured Products',
        subtitle: '',
        showTitle: true,
        productsToShow: 8,
        columns: 4,
        buttonText: 'Add to Cart',
        backgroundColor: '#ffffff',
        titleColor: '#333333',
        subtitleColor: '#666666',
        priceColor: '#111111',
        badgeColor: '#dc3545',
        cardBackground: '#ffffff',
        buttonColor: '#007bff',
        buttonTextColor: '#ffffff',
        currencySymbol: 'R',
        showViewAll: false,
        viewAllLink: '/shop',
        viewAllText: 'View All Products',
        padding: 60
    };
    products: Product[] = [];

    constructor(
        private productService: ProductService,
        private cartService: CartService
    ) {}

    ngOnInit(): void {
        this.productService.getFeaturedProducts().subscribe({
            next: (data: Product[]) => (this.products = data),
            error: (_err: any) => console.error('Error loading featured products')
        });
    }

    getPrimaryImage(product: Product): string {
        const p = product.images?.find(i => i.isPrimary);
        const f = product.images?.[0];
        return p?.imageUrl ?? p?.url ?? f?.imageUrl ?? f?.url ?? '/assets/placeholder.png';
    }

    addToCart(product: Product): void {
        this.cartService.addItem(product.id, 1, product.price, product.name, {
            productImageUrl: this.getPrimaryImage(product),
            sku: product.sku,
            stockQuantity: product.stockQuantity
        });
    }

    getContainerStyles() {
        return { backgroundColor: this.config.backgroundColor };
    }
    getPaddingStyles() {
        const p = this.config.padding ?? 60;
        return { paddingTop: p + 'px', paddingBottom: p + 'px' };
    }
    getTitleStyles() {
        return { color: this.config.titleColor };
    }
    getSubtitleStyles() {
        return { color: this.config.subtitleColor };
    }
    getGridStyles() {
        const cols = this.config.columns || 4;
        return { gridTemplateColumns: `repeat(${cols}, 1fr)` };
    }
    getCardStyles() {
        return { backgroundColor: this.config.cardBackground };
    }
    getCardTitleStyles() {
        return { color: this.config.titleColor };
    }
    getPriceStyles() {
        return { color: this.config.priceColor };
    }
    getBadgeStyles() {
        return { backgroundColor: this.config.badgeColor, color: '#fff' };
    }
    getButtonStyles() {
        return { backgroundColor: this.config.buttonColor, color: this.config.buttonTextColor };
    }
    getViewAllStyles() {
        return { backgroundColor: this.config.buttonColor, color: this.config.buttonTextColor };
    }
}
