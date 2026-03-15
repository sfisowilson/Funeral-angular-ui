import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService, Category } from '../../core/services/product.service';

@Component({
    selector: 'app-product-categories-widget',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <div class="cw-root" [ngStyle]="getContainerStyles()">
            <div class="cw-container" [ngStyle]="getPaddingStyles()">
                <h2 *ngIf="config.showTitle" [ngStyle]="getTitleStyles()">{{ config.title }}</h2>
                <p *ngIf="categories.length === 0" class="cw-empty">No categories available yet.</p>

                <!-- ── PILLS style ─────────────────────────────────────── -->
                <ng-container *ngIf="(config.displayStyle || 'pills') === 'pills'">
                    <div class="cw-pills">
                        <a *ngFor="let cat of categories"
                           [routerLink]="['/shop']"
                           [queryParams]="{cat: cat.slug || cat.name}"
                           class="cw-pill"
                           [ngStyle]="getPillStyles()">
                            <span *ngIf="cat.image || cat.imageUrl" class="cw-pill-img-wrap">
                                <img [src]="cat.image || cat.imageUrl" [alt]="cat.name" class="cw-pill-img" />
                            </span>
                            {{ cat.name }}
                        </a>
                    </div>
                </ng-container>

                <!-- ── SMALL TILES style ──────────────────────────────── -->
                <ng-container *ngIf="config.displayStyle === 'small-tiles'">
                    <div class="cw-tile-grid"
                         [class.cg-4]="config.columns === 4 || !config.columns"
                         [class.cg-5]="config.columns === 5"
                         [class.cg-6]="config.columns === 6"
                         [class.cg-3]="config.columns === 3">
                        <a *ngFor="let cat of categories"
                           [routerLink]="['/shop']"
                           [queryParams]="{cat: cat.slug || cat.name}"
                           class="cw-tile"
                           [ngStyle]="getTileCardStyles()">
                            <div class="cw-tile-img-wrap" [ngStyle]="getTileImgWrapStyles()">
                                <img *ngIf="cat.image || cat.imageUrl" [src]="cat.image || cat.imageUrl" [alt]="cat.name" class="cw-tile-img" />
                                <span *ngIf="!cat.image && !cat.imageUrl" class="cw-tile-icon">&#127991;</span>
                            </div>
                            <p class="cw-tile-name" [ngStyle]="getTileNameStyles()">{{ cat.name }}</p>
                        </a>
                    </div>
                </ng-container>

                <!-- ── BANNER cards style ─────────────────────────────── -->
                <ng-container *ngIf="config.displayStyle === 'banners'">
                    <div class="cw-banner-grid"
                         [class.cbg-2]="config.columns === 2"
                         [class.cbg-3]="config.columns === 3"
                         [class.cbg-4]="config.columns === 4">
                        <a *ngFor="let cat of categories"
                           [routerLink]="['/shop']"
                           [queryParams]="{cat: cat.slug || cat.name}"
                           class="cw-banner"
                           [ngStyle]="getBannerCardStyles()">
                            <img *ngIf="cat.image || cat.imageUrl" [src]="cat.image || cat.imageUrl" [alt]="cat.name" />
                            <div class="cw-banner-no-img" *ngIf="!cat.image && !cat.imageUrl" [ngStyle]="getNoImgStyles()">
                                <span>&#127991;</span>
                            </div>
                            <div class="cw-banner-overlay">
                                <h3 [ngStyle]="getCardTextStyles()">{{ cat.name }}</h3>
                            </div>
                        </a>
                    </div>
                </ng-container>

                <!-- ── DROPDOWN style ─────────────────────────────────── -->
                <ng-container *ngIf="config.displayStyle === 'dropdown'">
                    <div class="cw-dropdown-wrap">
                        <select class="cw-select" (change)="onDropdownChange($event)">
                            <option value="">Browse by category…</option>
                            <option *ngFor="let cat of categories" [value]="cat.slug || cat.name">{{ cat.name }}</option>
                        </select>
                    </div>
                </ng-container>

            </div>
        </div>
    `,
    styles: [`
        .cw-root { }
        .cw-container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
        h2 { text-align: center; margin-bottom: 1.5rem; font-size: 1.75rem; }
        .cw-empty { text-align: center; color: #999; font-style: italic; padding: 2rem 0; }
        /* PILLS */
        .cw-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
        .cw-pill {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 0.45rem 1.1rem; border-radius: 99px;
            text-decoration: none; font-size: 0.875rem; font-weight: 500;
            transition: transform 0.15s, box-shadow 0.15s;
            white-space: nowrap;
        }
        .cw-pill:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,.12); }
        .cw-pill-img-wrap { width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
        .cw-pill-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        /* SMALL TILES */
        .cw-tile-grid { display: grid; gap: 1rem; grid-template-columns: repeat(4, 1fr); }
        .cw-tile-grid.cg-3 { grid-template-columns: repeat(3, 1fr); }
        .cw-tile-grid.cg-4 { grid-template-columns: repeat(4, 1fr); }
        .cw-tile-grid.cg-5 { grid-template-columns: repeat(5, 1fr); }
        .cw-tile-grid.cg-6 { grid-template-columns: repeat(6, 1fr); }
        .cw-tile {
            display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
            text-decoration: none; cursor: pointer;
            padding: 0.75rem 0.5rem;
            border-radius: 10px;
            transition: transform 0.15s, box-shadow 0.15s;
        }
        .cw-tile:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(0,0,0,.1); }
        .cw-tile-img-wrap {
            width: 90px; height: 90px; border-radius: 50%; overflow: hidden;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
        }
        .cw-tile-img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .cw-tile-icon { font-size: 2rem; }
        .cw-tile-name { font-size: 0.8rem; font-weight: 600; text-align: center; margin: 0; }
        /* BANNERS */
        .cw-banner-grid { display: grid; gap: 1.5rem; grid-template-columns: repeat(4, 1fr); }
        .cw-banner-grid.cbg-2 { grid-template-columns: repeat(2, 1fr); }
        .cw-banner-grid.cbg-3 { grid-template-columns: repeat(3, 1fr); }
        .cw-banner-grid.cbg-4 { grid-template-columns: repeat(4, 1fr); }
        .cw-banner {
            position: relative; height: 200px; border-radius: 8px; overflow: hidden;
            text-decoration: none; cursor: pointer; display: block;
            transition: transform .2s, box-shadow .2s;
        }
        .cw-banner:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.15); }
        .cw-banner img { width: 100%; height: 100%; object-fit: cover; }
        .cw-banner-no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; }
        .cw-banner-overlay { position: absolute; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; }
        .cw-banner-overlay h3 { font-size: 1.1rem; font-weight: 700; text-align: center; padding: 0 .75rem; text-shadow: 0 1px 4px rgba(0,0,0,.4); }
        /* DROPDOWN */
        .cw-dropdown-wrap { display: flex; justify-content: center; }
        .cw-select { padding: 0.65rem 1.5rem; border: 1.5px solid #ddd; border-radius: 8px; font-size: 1rem; min-width: 260px; cursor: pointer; }
        /* Mobile */
        @media (max-width: 768px) {
            .cw-banner-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .cw-tile-grid   { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 480px) {
            .cw-banner-grid { grid-template-columns: 1fr !important; }
            .cw-tile-grid   { grid-template-columns: repeat(2, 1fr) !important; }
            .cw-tile-img-wrap { width: 70px; height: 70px; }
        }
    `]
})
export class ProductCategoriesWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Shop by Category',
        showTitle: true,
        displayStyle: 'pills',
        columns: 4,
        backgroundColor: '#ffffff',
        titleColor: '#333333',
        cardBackground: '#f0f4ff',
        cardTextColor: '#333333',
        accentColor: '#007bff',
        borderRadius: 8,
        padding: 50
    };
    categories: Category[] = [];

    constructor(private productService: ProductService, private router: Router) {}

    ngOnInit(): void {
        this.productService.getCategories().subscribe({
            next: (data: Category[]) => (this.categories = data.filter((c) => c.isActive)),
            error: (_err: any) => console.error('Error loading categories')
        });
    }

    getContainerStyles() {
        return { backgroundColor: this.config.backgroundColor };
    }
    getPaddingStyles() {
        const p = this.config.padding ?? 50;
        return { paddingTop: p + 'px', paddingBottom: p + 'px' };
    }
    getTitleStyles() {
        return { color: this.config.titleColor };
    }
    // Pills
    getPillStyles() {
        return {
            backgroundColor: this.config.cardBackground || '#f0f4ff',
            color: this.config.cardTextColor || '#333333',
            border: '1.5px solid ' + (this.config.accentColor || '#007bff') + '22'
        };
    }
    // Small tiles
    getTileCardStyles() {
        return { backgroundColor: this.config.cardBackground || '#f8f9fa' };
    }
    getTileImgWrapStyles() {
        return { backgroundColor: this.config.accentColor || '#007bff' };
    }
    getTileNameStyles() {
        return { color: this.config.cardTextColor || '#333333' };
    }
    // Banners
    getBannerCardStyles() {
        return {
            backgroundColor: this.config.cardBackground,
            borderRadius: (this.config.borderRadius ?? 8) + 'px'
        };
    }
    getNoImgStyles() {
        return { backgroundColor: this.config.accentColor || this.config.cardBackground };
    }
    getCardTextStyles() {
        return { color: this.config.cardTextColor || '#ffffff' };
    }
    // Dropdown
    onDropdownChange(event: Event): void {
        const val = (event.target as HTMLSelectElement).value;
        if (val) this.router.navigate(['/shop'], { queryParams: { cat: val } });
    }
}
