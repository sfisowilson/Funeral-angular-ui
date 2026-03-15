import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService, Product, ProductVariant } from '../../core/services/product.service';
import { CartService, CartItem } from '../../core/services/cart.service';
import { ProductFilterService } from '../../core/services/product-filter.service';

@Component({
    selector: 'app-products-widget',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
        <div class="products-widget" [ngStyle]="getContainerStyles()">
            <div class="pw-container">
                <h2 *ngIf="config.showTitle" [ngStyle]="getTitleStyles()">{{ config.title }}</h2>
                <p *ngIf="config.showSubtitle" class="pw-subtitle">{{ config.subtitle }}</p>

                <!-- Filter / Sort bar -->
                <div class="pw-filters" *ngIf="config.showFilters || config.showSort">
                    <input *ngIf="config.showFilters" type="text" class="pw-search" placeholder="Search products…"
                        [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" />
                    <select *ngIf="config.showFilters && config.showCategoryFilter" class="pw-select"
                        [(ngModel)]="selectedCategory" (ngModelChange)="applyFilters()">
                        <option value="">All Categories</option>
                        <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                    </select>
                    <select *ngIf="config.showSort" class="pw-select" [(ngModel)]="sortOrder" (ngModelChange)="applyFilters()">
                        <option value="">Sort: Default</option>
                        <option value="price-asc">Price: Low → High</option>
                        <option value="price-desc">Price: High → Low</option>
                        <option value="name-asc">Name A–Z</option>
                        <option value="name-desc">Name Z–A</option>
                    </select>
                </div>

                <!-- ── STANDARD layout ──────────────────────────────────── -->
                <ng-container *ngIf="(config.cardLayout || 'standard') === 'standard'">
                    <div class="pw-grid pw-grid-standard"
                         [class.cols-2]="config.columns === 2"
                         [class.cols-3]="config.columns === 3"
                         [class.cols-4]="config.columns === 4">
                        <ng-container *ngIf="filteredProducts.length > 0; else noProducts">
                            <div class="pw-card pw-card--standard"
                                 *ngFor="let p of filteredProducts.slice(0, config.productsToShow)"
                                 [ngStyle]="getCardStyles()"
                                 [class.oos]="p.stockQuantity === 0"
                                 (click)="openModal(p)">
                                <div class="pw-img-wrap">
                                    <img [src]="getPrimaryImage(p)" [alt]="p.name" />
                                    <span class="pw-badge pw-badge--sale" *ngIf="p.compareAtPrice && p.compareAtPrice > p.price" [ngStyle]="getBadgeStyles()">SALE</span>
                                    <span class="pw-badge pw-badge--oos" *ngIf="p.stockQuantity === 0">Out of Stock</span>
                                    <span class="pw-badge pw-badge--incart" *ngIf="getCartQty(p.id) > 0">&#10003; {{ getCartQty(p.id) }} in cart</span>
                                </div>
                                <div class="pw-info">
                                    <p class="pw-cat" *ngIf="config.showCategory && p.category">{{ p.category }}</p>
                                    <h3 class="pw-name">{{ p.name }}</h3>
                                    <p class="pw-sku" *ngIf="config.showSku && p.sku">SKU: {{ p.sku }}</p>
                                    <p class="pw-desc" *ngIf="config.showDescription">{{ p.shortDescription || p.description }}</p>
                                    <div class="pw-pricing" *ngIf="config.showPrice !== false">
                                        <span class="pw-price" [ngStyle]="getPriceStyles()">{{ config.currencySymbol || 'R' }}{{ p.price | number:'1.2-2' }}</span>
                                        <span class="pw-compare" *ngIf="p.compareAtPrice && p.compareAtPrice > p.price">{{ config.currencySymbol || 'R' }}{{ p.compareAtPrice | number:'1.2-2' }}</span>
                                    </div>
                                    <button class="pw-btn-cart" [ngStyle]="getButtonStyles()"
                                            *ngIf="config.showAddToCart"
                                            [disabled]="p.stockQuantity === 0"
                                            [class.pw-btn-cart--incart]="getCartQty(p.id) > 0"
                                            (click)="$event.stopPropagation(); addToCartDirect(p)">
                                        {{ p.stockQuantity === 0 ? 'Out of Stock' : getCartQty(p.id) > 0 ? '+ Add More' : (config.addToCartLabel || 'Add to Cart') }}
                                    </button>
                                </div>
                            </div>
                        </ng-container>
                        <ng-template #noProducts>
                            <p class="pw-empty">No products available yet. Check back soon!</p>
                        </ng-template>
                    </div>
                </ng-container>

                <!-- ── COMPACT tile layout ────────────────────────────────── -->
                <ng-container *ngIf="config.cardLayout === 'compact'">
                    <div class="pw-grid pw-grid-compact"
                         [class.cols-2]="config.columns === 2"
                         [class.cols-3]="config.columns === 3"
                         [class.cols-4]="config.columns === 4">
                        <ng-container *ngIf="filteredProducts.length > 0; else noProductsC">
                            <div class="pw-card pw-card--compact"
                                 *ngFor="let p of filteredProducts.slice(0, config.productsToShow)"
                                 [ngStyle]="getCardStyles()"
                                 [class.oos]="p.stockQuantity === 0"
                                 (click)="openModal(p)">
                                <div class="pw-compact-img">
                                    <img [src]="getPrimaryImage(p)" [alt]="p.name" />
                                    <span class="pw-badge pw-badge--sale" *ngIf="p.compareAtPrice && p.compareAtPrice > p.price" [ngStyle]="getBadgeStyles()">SALE</span>
                                    <span class="pw-badge pw-badge--oos" *ngIf="p.stockQuantity === 0">OOS</span>
                                    <span class="pw-badge pw-badge--incart" *ngIf="getCartQty(p.id) > 0">&#10003; {{ getCartQty(p.id) }}</span>
                                </div>
                                <div class="pw-compact-footer" [ngStyle]="getCardStyles()">
                                    <p class="pw-compact-name">{{ p.name }}</p>
                                    <p class="pw-compact-price" *ngIf="config.showPrice !== false" [ngStyle]="getPriceStyles()">{{ config.currencySymbol || 'R' }}{{ p.price | number:'1.2-2' }}</p>
                                </div>
                            </div>
                        </ng-container>
                        <ng-template #noProductsC>
                            <p class="pw-empty">No products available yet.</p>
                        </ng-template>
                    </div>
                </ng-container>

                <!-- ── LIST layout ────────────────────────────────────────── -->
                <ng-container *ngIf="config.cardLayout === 'list'">
                    <div class="pw-list">
                        <ng-container *ngIf="filteredProducts.length > 0; else noProductsL">
                            <div class="pw-card pw-card--list"
                                 *ngFor="let p of filteredProducts.slice(0, config.productsToShow)"
                                 [ngStyle]="getCardStyles()"
                                 [class.oos]="p.stockQuantity === 0"
                                 (click)="openModal(p)">
                                <div class="pw-list-img">
                                    <img [src]="getPrimaryImage(p)" [alt]="p.name" />
                                    <span class="pw-badge pw-badge--sale" *ngIf="p.compareAtPrice && p.compareAtPrice > p.price" [ngStyle]="getBadgeStyles()">SALE</span>
                                    <span class="pw-badge pw-badge--incart" *ngIf="getCartQty(p.id) > 0">&#10003; {{ getCartQty(p.id) }}</span>
                                </div>
                                <div class="pw-list-info">
                                    <p class="pw-cat" *ngIf="config.showCategory && p.category">{{ p.category }}</p>
                                    <h3 class="pw-name">{{ p.name }}</h3>
                                    <p class="pw-sku" *ngIf="config.showSku && p.sku">SKU: {{ p.sku }}</p>
                                    <p class="pw-desc" *ngIf="config.showDescription">{{ p.shortDescription || p.description }}</p>
                                </div>
                                <div class="pw-list-right">
                                    <div class="pw-pricing" *ngIf="config.showPrice !== false">
                                        <span class="pw-price" [ngStyle]="getPriceStyles()">{{ config.currencySymbol || 'R' }}{{ p.price | number:'1.2-2' }}</span>
                                        <span class="pw-compare" *ngIf="p.compareAtPrice && p.compareAtPrice > p.price">{{ config.currencySymbol || 'R' }}{{ p.compareAtPrice | number:'1.2-2' }}</span>
                                    </div>
                                    <button class="pw-btn-cart" [ngStyle]="getButtonStyles()"
                                            *ngIf="config.showAddToCart"
                                            [disabled]="p.stockQuantity === 0"
                                            [class.pw-btn-cart--incart]="getCartQty(p.id) > 0"
                                            (click)="$event.stopPropagation(); addToCartDirect(p)">
                                        {{ p.stockQuantity === 0 ? 'Out of Stock' : getCartQty(p.id) > 0 ? '+ Add More' : (config.addToCartLabel || 'Add to Cart') }}
                                    </button>
                                </div>
                            </div>
                        </ng-container>
                        <ng-template #noProductsL>
                            <p class="pw-empty">No products available yet.</p>
                        </ng-template>
                    </div>
                </ng-container>

                <div class="pw-view-all" *ngIf="config.showViewAll">
                    <a [routerLink]="config.viewAllLink || '/shop'" class="pw-btn-view-all" [ngStyle]="getButtonStyles()">{{ config.viewAllLabel || 'View All Products' }}</a>
                </div>
            </div>
        </div>

        <!-- ═══════════════ FLOATING CART BAR ═══════════════ -->
        <div class="pw-cart-bar" *ngIf="cartCount > 0">
            <span class="pw-cart-bar-text">&#128722; {{ cartCount }} item{{ cartCount !== 1 ? 's' : '' }} in your cart</span>
            <a class="pw-cart-bar-btn" [routerLink]="['/cart']" [ngStyle]="getButtonStyles()">View Cart &rarr;</a>
        </div>

        <!-- ═══════════════ QUICK-VIEW MODAL ═══════════════ -->
        <div class="pw-modal-backdrop" *ngIf="selectedProduct" (click)="closeModal()">
            <div class="pw-modal" (click)="$event.stopPropagation()">
                <button class="pw-modal-close" (click)="closeModal()">&#10005;</button>

                <div class="pw-modal-body">
                    <!-- Left: images -->
                    <div class="pw-modal-images">
                        <div class="pw-modal-main-img">
                            <img [src]="modalImage" [alt]="selectedProduct.name" />
                            <span class="pw-badge pw-badge--sale pw-badge--lg"
                                  *ngIf="selectedProduct.compareAtPrice && selectedProduct.compareAtPrice > selectedProduct.price">SALE</span>
                        </div>
                        <div class="pw-modal-thumbs" *ngIf="selectedProduct.images && selectedProduct.images.length > 1">
                            <img *ngFor="let img of selectedProduct.images.slice(0, 6)"
                                 [src]="img.imageUrl || img.url || '/assets/placeholder.png'"
                                 [alt]="img.altText || selectedProduct.name"
                                 class="pw-thumb"
                                 [class.pw-thumb--active]="(img.imageUrl || img.url) === modalImage"
                                 (click)="modalImage = img.imageUrl || img.url || ''" />
                        </div>
                    </div>

                    <!-- Right: details -->
                    <div class="pw-modal-details">
                        <p class="pw-modal-cat" *ngIf="selectedProduct.category">{{ selectedProduct.category }}</p>
                        <h2 class="pw-modal-name">{{ selectedProduct.name }}</h2>
                        <p class="pw-modal-sku" *ngIf="selectedProduct.sku">SKU: {{ selectedProduct.sku }}</p>

                        <div class="pw-modal-pricing">
                            <span class="pw-modal-price" [ngStyle]="getPriceStyles()">{{ config.currencySymbol || 'R' }}{{ selectedProduct.price | number:'1.2-2' }}</span>
                            <span class="pw-modal-compare"
                                  *ngIf="selectedProduct.compareAtPrice && selectedProduct.compareAtPrice > selectedProduct.price">
                                {{ config.currencySymbol || 'R' }}{{ selectedProduct.compareAtPrice | number:'1.2-2' }}
                            </span>
                        </div>

                        <p class="pw-modal-desc">{{ selectedProduct.shortDescription || selectedProduct.description }}</p>

                        <!-- Tags -->
                        <div class="pw-modal-tags" *ngIf="selectedProduct.tags && selectedProduct.tags.length">
                            <span class="pw-tag" *ngFor="let tag of selectedProduct.tags">{{ tag }}</span>
                        </div>

                        <!-- Variants -->
                        <ng-container *ngIf="selectedProduct.variants && selectedProduct.variants.length">
                            <div class="pw-modal-variants">
                                <p class="pw-modal-variant-label">Options</p>
                                <div class="pw-variant-pills">
                                    <button *ngFor="let v of selectedProduct.variants"
                                            class="pw-variant-pill"
                                            [class.pw-variant-pill--active]="selectedVariant?.id === v.id"
                                            [class.pw-variant-pill--oos]="v.stockQuantity === 0"
                                            [disabled]="v.stockQuantity === 0"
                                            (click)="selectVariant(v)">
                                        {{ v.name }}
                                        <span *ngIf="v.priceAdjustment && v.priceAdjustment !== 0">
                                            ({{ v.priceAdjustment > 0 ? '+' : '' }}{{ config.currencySymbol || 'R' }}{{ v.priceAdjustment | number:'1.2-2' }})
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </ng-container>

                        <!-- Quantity + Add to Cart -->
                        <div class="pw-modal-actions">
                            <div class="pw-qty-stepper">
                                <button class="pw-qty-btn" (click)="modalQty = modalQty > 1 ? modalQty - 1 : 1">−</button>
                                <span class="pw-qty-val">{{ modalQty }}</span>
                                <button class="pw-qty-btn" (click)="modalQty = modalQty + 1">+</button>
                            </div>
                            <button class="pw-btn-modal-cart" [ngStyle]="getButtonStyles()"
                                    [disabled]="selectedProduct.stockQuantity === 0"
                                    (click)="addToCartFromModal()">
                                {{ selectedProduct.stockQuantity === 0 ? 'Out of Stock' : (config.addToCartLabel || 'Add to Cart') }}
                            </button>
                        </div>
                        <p class="pw-modal-toast" *ngIf="modalAdded">&#10003; Added to cart!</p>
                        <p class="pw-modal-incart" *ngIf="selectedProduct && getCartQty(selectedProduct.id) > 0 && !modalAdded">
                            &#10003; {{ getCartQty(selectedProduct.id) }} already in your cart &mdash;
                            <a [routerLink]="['/cart']" (click)="closeModal()">view cart</a>
                        </p>

                        <a class="pw-modal-full-link" [routerLink]="['/product', selectedProduct.id]" (click)="closeModal()">
                            View full details &rarr;
                        </a>

                        <p class="pw-modal-stock" *ngIf="selectedProduct.trackInventory && selectedProduct.stockQuantity > 0 && selectedProduct.stockQuantity <= (selectedProduct.lowStockThreshold || 5)">
                            Only {{ selectedProduct.stockQuantity }} left in stock!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .products-widget { padding: 4rem 0; }
        .pw-container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        h2 { text-align: center; margin-bottom: 0.5rem; }
        .pw-subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
        .pw-filters { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 2rem; justify-content: center; }
        .pw-search, .pw-select { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 6px; font-size: 0.875rem; }
        /* STANDARD */
        .pw-grid-standard { display: grid; gap: 1.5rem; grid-template-columns: repeat(2, 1fr); }
        .pw-grid-standard.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .pw-grid-standard.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .pw-grid-standard.cols-4 { grid-template-columns: repeat(4, 1fr); }
        .pw-card--standard { border: 1px solid #eee; border-radius: 10px; overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; }
        .pw-card--standard:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
        .pw-card--standard .pw-img-wrap { position: relative; }
        .pw-card--standard .pw-img-wrap img { width: 100%; height: 240px; object-fit: cover; display: block; }
        .pw-card--standard .pw-info { padding: 1rem; flex: 1; display: flex; flex-direction: column; }
        .pw-card--standard.oos .pw-img-wrap img { opacity: 0.55; }
        /* COMPACT */
        .pw-grid-compact { display: grid; gap: 1rem; grid-template-columns: repeat(2, 1fr); }
        .pw-grid-compact.cols-2 { grid-template-columns: repeat(2, 1fr); }
        .pw-grid-compact.cols-3 { grid-template-columns: repeat(3, 1fr); }
        .pw-grid-compact.cols-4 { grid-template-columns: repeat(4, 1fr); }
        .pw-card--compact { border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; border: 1px solid #eee; }
        .pw-card--compact:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,.12); }
        .pw-compact-img { position: relative; }
        .pw-compact-img img { width: 100%; height: 180px; object-fit: cover; display: block; }
        .pw-card--compact.oos .pw-compact-img img { opacity: 0.55; }
        .pw-compact-footer { padding: 0.6rem 0.75rem; }
        .pw-compact-name { font-size: 0.85rem; font-weight: 600; margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pw-compact-price { font-size: 0.9rem; font-weight: 700; margin: 0; }
        /* LIST */
        .pw-list { display: flex; flex-direction: column; gap: 1rem; }
        .pw-card--list { display: flex; align-items: center; gap: 1rem; border: 1px solid #eee; border-radius: 10px; overflow: hidden; cursor: pointer; transition: box-shadow 0.2s; padding-right: 1rem; }
        .pw-card--list:hover { box-shadow: 0 4px 16px rgba(0,0,0,.1); }
        .pw-list-img { position: relative; flex-shrink: 0; }
        .pw-list-img img { width: 120px; height: 120px; object-fit: cover; display: block; }
        .pw-list-info { flex: 1; padding: 0.75rem 0; }
        .pw-list-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; min-width: 120px; }
        .pw-card--list.oos .pw-list-img img { opacity: 0.55; }
        /* Shared elements */
        .pw-cat { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
        .pw-name { font-size: 1rem; font-weight: 700; margin: 0 0 4px; }
        .pw-sku  { font-size: 0.72rem; color: #bbb; margin: 0 0 6px; }
        .pw-desc { font-size: 0.82rem; color: #666; line-height: 1.5; margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .pw-pricing { margin-bottom: 0.75rem; }
        .pw-price { font-size: 1.1rem; font-weight: 700; }
        .pw-compare { text-decoration: line-through; color: #aaa; margin-left: 0.5rem; font-size: 0.875rem; }
        .pw-badge { position: absolute; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; }
        .pw-badge--sale { top: 8px; right: 8px; background: #e11d48; color: #fff; }
        .pw-badge--oos  { top: 8px; left: 8px;  background: #718096; color: #fff; }
        .pw-btn-cart { width: 100%; padding: 0.6rem 1rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; margin-top: auto; }
        .pw-btn-cart:disabled { opacity: 0.5; cursor: not-allowed; }
        .pw-btn-view-all { display: inline-block; padding: 0.75rem 2rem; border-radius: 6px; text-decoration: none; font-weight: 600; }
        .pw-view-all { text-align: center; margin-top: 2.5rem; }
        .pw-empty { grid-column: 1/-1; text-align: center; color: #aaa; font-style: italic; padding: 3rem 0; }
        /* Mobile */
        @media (max-width: 768px) {
            .pw-grid-standard.cols-3, .pw-grid-standard.cols-4 { grid-template-columns: repeat(2, 1fr); }
            .pw-grid-compact.cols-3,  .pw-grid-compact.cols-4  { grid-template-columns: repeat(2, 1fr); }
            .pw-list-img img { width: 90px; height: 90px; }
        }
        @media (max-width: 480px) {
            .pw-grid-standard { grid-template-columns: 1fr !important; }
            .pw-grid-compact  { grid-template-columns: repeat(2, 1fr) !important; }
        }
        /* MODAL */
        .pw-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.55); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: pwFadeIn 0.18s ease; }
        @keyframes pwFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pw-modal { background: #fff; border-radius: 14px; width: 100%; max-width: 860px; max-height: 90vh; overflow-y: auto; position: relative; animation: pwSlideUp 0.18s ease; }
        @keyframes pwSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .pw-modal-close { position: absolute; top: 12px; right: 14px; border: none; background: #f1f5f9; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 1rem; z-index: 1; color: #333; }
        .pw-modal-close:hover { background: #e2e8f0; }
        .pw-modal-body { display: grid; grid-template-columns: 1fr 1fr; }
        .pw-modal-images { padding: 1.5rem; background: #f8f9fa; border-radius: 14px 0 0 14px; }
        .pw-modal-main-img { position: relative; margin-bottom: 0.75rem; }
        .pw-modal-main-img img { width: 100%; height: 320px; object-fit: cover; border-radius: 8px; display: block; }
        .pw-badge--lg { font-size: 0.8rem; padding: 4px 10px; }
        .pw-modal-thumbs { display: flex; gap: 6px; flex-wrap: wrap; }
        .pw-thumb { width: 58px; height: 58px; object-fit: cover; border-radius: 6px; cursor: pointer; border: 2px solid transparent; opacity: 0.65; transition: opacity 0.15s, border-color 0.15s; }
        .pw-thumb:hover, .pw-thumb--active { opacity: 1; border-color: #3b82f6; }
        .pw-modal-details { padding: 1.75rem 1.75rem 1.75rem 1.5rem; display: flex; flex-direction: column; }
        .pw-modal-cat { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 6px; }
        .pw-modal-name { font-size: 1.5rem; font-weight: 700; margin: 0 0 6px; line-height: 1.3; }
        .pw-modal-sku { font-size: 0.75rem; color: #bbb; margin: 0 0 1rem; }
        .pw-modal-pricing { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 1rem; }
        .pw-modal-price { font-size: 1.8rem; font-weight: 700; }
        .pw-modal-compare { font-size: 1rem; text-decoration: line-through; color: #aaa; }
        .pw-modal-desc { font-size: 0.9rem; color: #555; line-height: 1.65; margin-bottom: 1rem; }
        .pw-modal-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1rem; }
        .pw-tag { font-size: 0.72rem; background: #f1f5f9; color: #555; padding: 2px 10px; border-radius: 99px; }
        .pw-modal-variants { margin-bottom: 1.25rem; }
        .pw-modal-variant-label { font-size: 0.8rem; font-weight: 600; color: #444; margin-bottom: 6px; }
        .pw-variant-pills { display: flex; flex-wrap: wrap; gap: 6px; }
        .pw-variant-pill { padding: 0.35rem 0.85rem; border-radius: 99px; border: 1.5px solid #cbd5e1; background: #fff; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
        .pw-variant-pill:hover { border-color: #3b82f6; }
        .pw-variant-pill--active { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; font-weight: 600; }
        .pw-variant-pill--oos { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
        .pw-modal-actions { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .pw-qty-stepper { display: flex; align-items: center; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .pw-qty-btn { width: 36px; height: 40px; border: none; background: #f8fafc; cursor: pointer; font-size: 1.1rem; line-height: 1; }
        .pw-qty-btn:hover { background: #e2e8f0; }
        .pw-qty-val { width: 40px; text-align: center; font-weight: 600; font-size: 0.95rem; }
        .pw-btn-modal-cart { flex: 1; padding: 0.7rem 1.25rem; border: none; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: opacity 0.15s; }
        .pw-btn-modal-cart:disabled { opacity: 0.5; cursor: not-allowed; }
        .pw-modal-toast { color: #16a34a; font-size: 0.82rem; margin: 0; }
        .pw-modal-full-link { display: inline-block; font-size: 0.875rem; color: #3b82f6; text-decoration: none; margin-top: 0.75rem; font-weight: 500; }
        .pw-modal-full-link:hover { text-decoration: underline; }
        .pw-modal-stock { font-size: 0.8rem; color: #b45309; margin-top: 0.5rem; font-weight: 500; }
        .pw-modal-incart { font-size: 0.82rem; color: #16a34a; margin: 0.25rem 0; }
        .pw-modal-incart a { color: #2563eb; text-decoration: underline; cursor: pointer; }
        /* In-cart badge on cards */
        .pw-badge--incart { bottom: 8px; left: 8px; top: auto; background: #16a34a; color: #fff; }
        /* In-cart button state */
        .pw-btn-cart--incart { outline: 2px solid #16a34a; outline-offset: -2px; }
        /* Floating cart bar */
        .pw-cart-bar {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #1e293b; color: #fff;
            display: flex; align-items: center; justify-content: space-between;
            padding: 0.85rem 1.5rem;
            z-index: 9000;
            box-shadow: 0 -4px 16px rgba(0,0,0,.18);
            animation: pwSlideUp 0.2s ease;
        }
        .pw-cart-bar-text { font-size: 0.95rem; font-weight: 500; }
        .pw-cart-bar-btn {
            padding: 0.5rem 1.25rem; border-radius: 8px;
            text-decoration: none; font-weight: 700; font-size: 0.875rem;
            transition: opacity 0.15s; white-space: nowrap;
        }
        .pw-cart-bar-btn:hover { opacity: 0.88; }
        @media (max-width: 480px) {
            .pw-cart-bar { padding: 0.75rem 1rem; }
            .pw-cart-bar-text { font-size: 0.82rem; }
        }
        @media (max-width: 640px) {
            .pw-modal-body { grid-template-columns: 1fr; }
            .pw-modal-images { border-radius: 14px 14px 0 0; padding: 1rem; }
            .pw-modal-main-img img { height: 220px; }
            .pw-modal-details { padding: 1.25rem; }
        }
    `]
})
export class ProductsWidgetComponent implements OnInit, OnDestroy {
    @Input() config: any = {
        title: 'Our Products',
        subtitle: 'Browse our collection',
        showTitle: true,
        showSubtitle: true,
        showFilters: true,
        showCategoryFilter: true,
        showSort: true,
        showDescription: true,
        showViewAll: true,
        viewAllLink: '/shop',
        viewAllLabel: 'View All Products',
        productsToShow: 8,
        columns: 4,
        cardLayout: 'standard',
        // Display toggles
        showPrice: true,
        showSku: false,
        showCategory: true,
        showAddToCart: true,
        addToCartLabel: 'Add to Cart',
        currencySymbol: 'R',
        // Colours
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
    sortOrder = '';
    minPrice: number | undefined;
    maxPrice: number | undefined;

    // Cart state
    cartQtyMap: Record<string, number> = {};
    cartCount = 0;

    // Modal state
    selectedProduct: Product | null = null;
    modalImage = '';
    modalQty = 1;
    selectedVariant: ProductVariant | null = null;
    modalAdded = false;

    private _filterSub?: Subscription;
    private _cartSub?: Subscription;

    constructor(
        private productService: ProductService,
        private cartService: CartService,
        private router: Router,
        private route: ActivatedRoute,
        private filterService: ProductFilterService
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            if (params['cat']) {
                this.filterService.loadFromParams(params);
            } else {
                // No cat param — reset stale filter service state to prevent previous
                // category selection from filtering out products on page load
                this.filterService.reset();
                this.selectedCategory = '';
                this.applyFilters();
            }
        });

        // Subscribe to shared filter service (driven by product-filter-widget on the same page)
        this._filterSub = this.filterService.filters$.subscribe(f => {
            if (f.search   !== undefined) this.searchTerm      = f.search;
            if (f.category !== undefined) this.selectedCategory = f.category ?? '';
            if (f.sort     !== undefined) this.sortOrder        = f.sort;
            if (f.minPrice !== undefined) this.minPrice         = f.minPrice;
            if (f.maxPrice !== undefined) this.maxPrice         = f.maxPrice;
            this.applyFilters();
        });

        this._cartSub = this.cartService.cart$.subscribe((items: CartItem[]) => {
            this.cartQtyMap = {};
            items.forEach(i => {
                this.cartQtyMap[i.productId] = (this.cartQtyMap[i.productId] || 0) + i.quantity;
            });
            this.cartCount = items.reduce((s, i) => s + i.quantity, 0);
        });

        this.loadProducts();
    }

    ngOnDestroy(): void {
        this._filterSub?.unsubscribe();
        this._cartSub?.unsubscribe();
    }

    @HostListener('document:keydown.escape')
    onEscape(): void { this.closeModal(); }

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

    // Direct add to cart (from card button, bypasses modal)
    addToCartDirect(product: Product): void {
        this.cartService.addItem(product.id, 1, product.price, product.name, {
            productImageUrl: this.getPrimaryImage(product),
            sku: product.sku,
            stockQuantity: product.stockQuantity
        });
    }

    openModal(product: Product): void {
        this.selectedProduct = product;
        this.modalImage = this.getPrimaryImage(product);
        this.modalQty = 1;
        this.selectedVariant = null;
        this.modalAdded = false;
        document.body.style.overflow = 'hidden';
    }

    closeModal(): void {
        this.selectedProduct = null;
        document.body.style.overflow = '';
    }

    selectVariant(v: ProductVariant): void {
        this.selectedVariant = v;
    }

    addToCartFromModal(): void {
        if (!this.selectedProduct) return;
        const effectivePrice = this.selectedProduct.price + (this.selectedVariant?.priceAdjustment ?? 0);
        this.cartService.addItem(
            this.selectedProduct.id,
            this.modalQty,
            effectivePrice,
            this.selectedProduct.name,
            {
                productImageUrl: this.modalImage,
                sku: this.selectedVariant?.sku ?? this.selectedProduct.sku,
                stockQuantity: this.selectedVariant?.stockQuantity ?? this.selectedProduct.stockQuantity,
                productVariantId: this.selectedVariant?.id,
                variantName: this.selectedVariant?.name
            }
        );
        this.modalAdded = true;
        setTimeout(() => (this.modalAdded = false), 2500);
    }

    applyFilters(): void {
        let result = this.products.filter((p) => {
            const matchesSearch   = !this.searchTerm      || p.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesCategory = !this.selectedCategory || p.category === this.selectedCategory;
            const matchesMin      = this.minPrice == null  || p.price >= this.minPrice;
            const matchesMax      = this.maxPrice == null  || p.price <= this.maxPrice;
            return matchesSearch && matchesCategory && matchesMin && matchesMax;
        });
        // Sort
        if (this.sortOrder === 'price-asc')  result = result.sort((a, b) => a.price - b.price);
        else if (this.sortOrder === 'price-desc') result = result.sort((a, b) => b.price - a.price);
        else if (this.sortOrder === 'name-asc')   result = result.sort((a, b) => a.name.localeCompare(b.name));
        else if (this.sortOrder === 'name-desc')  result = result.sort((a, b) => b.name.localeCompare(a.name));
        this.filteredProducts = result;
    }

    getPrimaryImage(product: Product): string {
        const primary = product.images?.find(i => i.isPrimary);
        const first   = product.images?.[0];
        return primary?.imageUrl ?? primary?.url ?? first?.imageUrl ?? first?.url ?? '/assets/placeholder.png';
    }

    getContainerStyles() {
        return { backgroundColor: this.config.backgroundColor };
    }
    getTitleStyles() {
        return { color: this.config.titleColor };
    }
    getPriceStyles() {
        return { color: this.config.priceColor };
    }
    getBadgeStyles() {
        return { backgroundColor: this.config.badgeColor, color: 'white' };
    }
    getCardStyles() {
        return { backgroundColor: this.config.cardBackground };
    }
    getButtonStyles() {
        return { backgroundColor: this.config.buttonColor, color: this.config.buttonTextColor };
    }

    getCartQty(productId: string): number {
        return this.cartQtyMap[productId] || 0;
    }
}
