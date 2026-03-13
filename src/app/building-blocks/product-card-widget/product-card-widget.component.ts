import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProductService, Product } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';

@Component({
    selector: 'app-product-card-widget',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="product-card-widget" [ngStyle]="getContainerStyles()">
            <div class="card-inner" [ngStyle]="getCardStyles()" *ngIf="product; else noProduct">
                <div class="card-image" *ngIf="config.imageMode !== 'none'">
                    <img [src]="activeImage || getPrimaryImage()" [alt]="product.name" />
                    <span class="sale-badge" *ngIf="product.compareAtPrice && product.compareAtPrice > product.price">SALE</span>
                </div>

                <!-- Thumbnail row -->
                <div class="thumbnails" *ngIf="config.imageMode === 'thumbnails' && product.images && product.images.length > 1">
                    <img *ngFor="let img of product.images.slice(0, 5)"
                         [src]="img.imageUrl || img.url || '/assets/placeholder.png'"
                         [alt]="img.altText || product.name"
                         class="thumb"
                         [class.active]="(img.imageUrl || img.url) === activeImage"
                         (click)="activeImage = img.imageUrl || img.url || ''" />
                </div>

                <div class="card-body">
                    <p class="card-category" *ngIf="config.showCategory && product.category">{{ product.category }}</p>
                    <h3 class="card-title" [ngStyle]="getTitleStyles()">{{ product.name }}</h3>
                    <p class="card-sku" *ngIf="config.showSku && product.sku">SKU: {{ product.sku }}</p>
                    <p class="card-desc" *ngIf="config.showDescription">{{ config.descriptionLength ? (product.description || '' | slice:0:config.descriptionLength) + '...' : product.description }}</p>

                    <div class="card-price" *ngIf="config.showPrice">
                        <span class="price" [ngStyle]="getPriceStyles()">{{ config.currencySymbol || '$' }}{{ product.price | number:'1.2-2' }}</span>
                        <span class="compare-price" *ngIf="product.compareAtPrice && product.compareAtPrice > product.price">{{ config.currencySymbol || '$' }}{{ product.compareAtPrice | number:'1.2-2' }}</span>
                    </div>

                    <div class="card-actions">
                        <button *ngIf="config.showAddToCart"
                                class="btn-action"
                                [ngStyle]="getButtonStyles()"
                                [disabled]="product.trackInventory && product.stockQuantity <= 0"
                                (click)="addToCart()">
                            {{ product.trackInventory && product.stockQuantity <= 0 ? 'Out of Stock' : (config.addToCartLabel || 'Add to Cart') }}
                        </button>
                        <button class="btn-details" [ngStyle]="getSecondaryButtonStyles()" (click)="goToProduct()">
                            {{ config.detailsLabel || 'View Details' }}
                        </button>
                    </div>
                    <p class="added-toast" *ngIf="added">&#10003; Added to cart!</p>
                </div>
            </div>
            <ng-template #noProduct>
                <p class="no-product-msg">No product selected. Configure this widget to pick a product.</p>
            </ng-template>
        </div>
    `,
    styles: [`
        .product-card-widget { padding: 2rem 0; }
        .card-inner {
            max-width: 480px;
            margin: 0 auto;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .card-image { position: relative; }
        .card-image img { width: 100%; height: 340px; object-fit: cover; display: block; }
        .sale-badge {
            position: absolute; top: 10px; left: 10px;
            background: #e11d48; color: #fff;
            padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 700;
        }
        .thumbnails { display: flex; gap: 6px; padding: 8px; background: #f5f5f5; }
        .thumb {
            width: 56px; height: 56px; object-fit: cover; border-radius: 4px;
            cursor: pointer; opacity: 0.65; transition: opacity 0.2s;
            border: 2px solid transparent;
        }
        .thumb:hover, .thumb.active { opacity: 1; border-color: #007bff; }
        .card-body { padding: 1.5rem; }
        .card-category { font-size: 0.75rem; text-transform: uppercase; color: #999; margin: 0 0 4px; }
        .card-title { font-size: 1.4rem; font-weight: 700; margin: 0 0 6px; }
        .card-sku { font-size: 0.75rem; color: #bbb; margin: 0 0 8px; }
        .card-desc { font-size: 0.9rem; color: #555; line-height: 1.6; margin-bottom: 1rem; }
        .card-price { margin-bottom: 1rem; }
        .price { font-size: 1.6rem; font-weight: 700; }
        .compare-price { text-decoration: line-through; color: #aaa; margin-left: 0.5rem; }
        .card-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .btn-action, .btn-details {
            flex: 1; padding: 0.7rem 1rem;
            border: none; border-radius: 4px; cursor: pointer;
            font-weight: 600; font-size: 0.875rem; min-width: 120px;
        }
        .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
        .added-toast { color: #16a34a; font-size: 0.8rem; margin-top: 6px; }
        .no-product-msg { color: #aaa; text-align: center; padding: 2rem; font-style: italic; }
    `]
})
export class ProductCardWidgetComponent implements OnInit {
    @Input() config: any = {
        productId: null,
        showPrice: true,
        showSku: false,
        showCategory: false,
        showDescription: true,
        descriptionLength: 160,
        imageMode: 'primary-only',
        showAddToCart: true,
        addToCartLabel: 'Add to Cart',
        detailsLabel: 'View Details',
        currencySymbol: '$',
        backgroundColor: '#ffffff',
        cardBackground: '#ffffff',
        titleColor: '#222222',
        priceColor: '#111111',
        buttonColor: '#007bff',
        buttonTextColor: '#ffffff',
        secondaryButtonColor: '#f3f4f6',
        secondaryButtonTextColor: '#333333'
    };

    product: Product | null = null;
    activeImage = '';
    added = false;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private router: Router
    ) {}

    ngOnInit(): void {
        if (this.config.productId) {
            this.productService.getProduct(this.config.productId).subscribe({
                next: (p) => { this.product = p; this.activeImage = this.getPrimaryImage(); },
                error: () => console.error('Could not load product for card widget')
            });
        }
    }

    getPrimaryImage(): string {
        if (!this.product?.images?.length) return '/assets/placeholder.png';
        const primary = this.product.images.find((i) => i.isPrimary);
        return primary?.imageUrl || this.product.images[0]?.imageUrl || '/assets/placeholder.png';
    }

    addToCart(): void {
        if (!this.product) return;
        this.cartService.addItem(this.product.id, 1, this.product.price, this.product.name, {
            productImageUrl: this.activeImage || this.getPrimaryImage(),
            sku: this.product.sku,
            stockQuantity: this.product.stockQuantity
        });
        this.added = true;
        setTimeout(() => (this.added = false), 2200);
    }

    goToProduct(): void {
        if (!this.product) return;
        this.router.navigate(['/product', this.product.id]);
    }

    getContainerStyles() { return { backgroundColor: this.config.backgroundColor }; }
    getCardStyles() { return { backgroundColor: this.config.cardBackground }; }
    getTitleStyles() { return { color: this.config.titleColor }; }
    getPriceStyles() { return { color: this.config.priceColor }; }
    getButtonStyles() { return { backgroundColor: this.config.buttonColor, color: this.config.buttonTextColor }; }
    getSecondaryButtonStyles() { return { backgroundColor: this.config.secondaryButtonColor, color: this.config.secondaryButtonTextColor }; }
}
