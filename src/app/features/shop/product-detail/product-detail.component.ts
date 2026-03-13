import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { ProductService, Product, ProductImage, ProductVariant } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="product-detail-page">
            <!-- Loading -->
            <div class="loading-state" *ngIf="loading">
                <div class="spinner"></div>
                <p>Loading product…</p>
            </div>

            <!-- Not found -->
            <div class="not-found" *ngIf="!loading && !product">
                <h2>Product Not Found</h2>
                <p>This product may have been removed or is unavailable.</p>
                <a routerLink="/shop" class="btn-back">← Back to Shop</a>
            </div>

            <!-- Product detail -->
            <div class="page-inner container" *ngIf="!loading && product">
                <nav class="breadcrumb">
                    <a routerLink="/">Home</a> /
                    <a routerLink="/shop">Shop</a> /
                    <span>{{ product.name }}</span>
                </nav>

                <div class="product-layout">
                    <!-- Images -->
                    <div class="product-images">
                        <div class="main-image" *ngIf="selectedImage">
                            <img [src]="selectedImage.imageUrl || selectedImage.url" [alt]="selectedImage.altText || product.name" />
                            <span class="badge sale" *ngIf="product.compareAtPrice && product.compareAtPrice > product.price">SALE</span>
                        </div>
                        <div class="no-image" *ngIf="!selectedImage">
                            <span class="icon">🛍️</span>
                        </div>
                        <div class="thumbnails" *ngIf="product.images && product.images.length > 1">
                            <img
                                *ngFor="let img of product.images"
                                [src]="img.imageUrl || img.url"
                                [alt]="img.altText || product.name"
                                (click)="selectedImage = img"
                                [class.active]="selectedImage === img"
                            />
                        </div>
                    </div>

                    <!-- Info -->
                    <div class="product-info">
                        <p class="product-category" *ngIf="product.category">{{ product.category }}</p>
                        <h1 class="product-title">{{ product.name }}</h1>

                        <p class="product-sku" *ngIf="product.sku">SKU: {{ product.sku }}</p>

                        <div class="price-block">
                            <span class="price">{{ currencySymbol }}{{ product.price | number:'1.2-2' }}</span>
                            <span class="compare-price" *ngIf="product.compareAtPrice && product.compareAtPrice > product.price">
                                {{ currencySymbol }}{{ product.compareAtPrice | number:'1.2-2' }}
                            </span>
                        </div>

                        <!-- Variants -->
                        <div class="variants" *ngIf="product.variants && product.variants.length > 0">
                            <label>Variant:</label>
                            <select (change)="selectVariant($event)">
                                <option value="">Select…</option>
                                <option *ngFor="let v of activeVariants" [value]="v.id">
                                    {{ v.name }}{{ v.priceAdjustment && v.priceAdjustment !== 0 ? ' (+' + currencySymbol + v.priceAdjustment + ')' : '' }}
                                </option>
                            </select>
                        </div>

                        <!-- Qty + Add to Cart -->
                        <div class="add-to-cart-row">
                            <div class="qty-control">
                                <button (click)="decrementQty()">−</button>
                                <span>{{ qty }}</span>
                                <button (click)="incrementQty()">+</button>
                            </div>
                            <button
                                class="btn-add-to-cart"
                                (click)="addToCart()"
                                [disabled]="!product.isActive || product.stockQuantity === 0"
                            >
                                {{ product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart' }}
                            </button>
                        </div>

                        <!-- Added confirmation -->
                        <p class="added-msg" *ngIf="addedMsg">✓ {{ addedMsg }}</p>

                        <!-- Description -->
                        <div class="description" *ngIf="product.description">
                            <p>{{ product.description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .product-detail-page { min-height: 60vh; padding: 2rem 0; }
        .container { max-width: 1100px; margin: 0 auto; padding: 0 1rem; }
        .loading-state, .not-found { text-align: center; padding: 4rem 1rem; }
        .spinner { width: 40px; height: 40px; border: 4px solid #eee; border-top-color: #007bff; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-back { color: #007bff; text-decoration: none; }
        .breadcrumb { font-size: 0.85rem; color: #aaa; margin-bottom: 1.5rem; }
        .breadcrumb a { color: #888; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .product-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: start; }
        @media(max-width: 700px) { .product-layout { grid-template-columns: 1fr; } }
        .main-image { position: relative; border-radius: 8px; overflow: hidden; background: #f8f8f8; aspect-ratio: 1; }
        .main-image img { width: 100%; height: 100%; object-fit: contain; }
        .no-image { background: #f0f0f0; border-radius: 8px; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
        .badge.sale { position: absolute; top: 12px; left: 12px; background: #e53e3e; color: white; padding: 3px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; }
        .thumbnails { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
        .thumbnails img { width: 64px; height: 64px; object-fit: cover; border-radius: 4px; border: 2px solid transparent; cursor: pointer; }
        .thumbnails img.active { border-color: #007bff; }
        .product-category { color: #888; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
        .product-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 8px; }
        .product-sku { color: #aaa; font-size: 0.8rem; margin: 0 0 12px; }
        .price-block { margin-bottom: 1rem; }
        .price { font-size: 1.5rem; font-weight: 700; color: #111; }
        .compare-price { font-size: 1rem; color: #aaa; text-decoration: line-through; margin-left: 8px; }
        .variants { margin-bottom: 1rem; }
        .variants label { font-size: 0.85rem; color: #666; display: block; margin-bottom: 4px; }
        .variants select { padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.9rem; }
        .add-to-cart-row { display: flex; gap: 12px; align-items: center; margin-bottom: 0.75rem; }
        .qty-control { display: flex; align-items: center; gap: 0; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
        .qty-control button { width: 34px; height: 34px; border: none; background: #f5f5f5; cursor: pointer; font-size: 1.1rem; }
        .qty-control button:hover { background: #ebebeb; }
        .qty-control span { padding: 0 12px; font-size: 0.95rem; min-width: 30px; text-align: center; }
        .btn-add-to-cart { flex: 1; padding: 0 24px; height: 36px; background: #007bff; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; }
        .btn-add-to-cart:hover:not(:disabled) { background: #0056b3; }
        .btn-add-to-cart:disabled { background: #aaa; cursor: default; }
        .added-msg { color: #28a745; font-size: 0.85rem; margin: 0 0 0.75rem; }
        .description { border-top: 1px solid #eee; padding-top: 1rem; margin-top: 0.5rem; font-size: 0.95rem; color: #555; line-height: 1.7; }
    `]
})
export class ProductDetailComponent implements OnInit {
    product: Product | null = null;
    selectedImage: ProductImage | null = null;
    selectedVariant: ProductVariant | null = null;
    loading = true;
    qty = 1;
    addedMsg = '';
    currencySymbol = '$';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private productService: ProductService,
        private cartService: CartService,
        private titleService: Title
    ) {}

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('productId');
        if (!id) { this.loading = false; return; }

        this.productService.getProduct(id).subscribe({
            next: (product) => {
                this.product = product;
                this.loading = false;
                if (product) {
                    this.titleService.setTitle(product.name);
                    const primary = product.images?.find(i => i.isPrimary) ?? product.images?.[0] ?? null;
                    this.selectedImage = primary;
                }
            },
            error: () => { this.loading = false; }
        });
    }

    get activeVariants(): ProductVariant[] {
        return this.product?.variants?.filter(v => v.isActive) ?? [];
    }

    selectVariant(event: Event): void {
        const id = (event.target as HTMLSelectElement).value;
        this.selectedVariant = this.product?.variants?.find(v => v.id === id) ?? null;
    }

    incrementQty(): void { this.qty++; }
    decrementQty(): void { if (this.qty > 1) this.qty--; }

    addToCart(): void {
        if (!this.product) return;
        const price = this.product.price + (this.selectedVariant?.priceAdjustment ?? 0);
        this.cartService.addItem(
            this.product.id,
            this.qty,
            price,
            this.product.name,
            {
                productImageUrl: this.selectedImage?.imageUrl ?? this.selectedImage?.url,
                productVariantId: this.selectedVariant?.id,
                variantName: this.selectedVariant?.name,
                sku: this.product.sku,
                stockQuantity: this.product.stockQuantity
            }
        );
        this.addedMsg = `${this.product.name} added to cart!`;
        setTimeout(() => this.addedMsg = '', 3000);
    }
}
