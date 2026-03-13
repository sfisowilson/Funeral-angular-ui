import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductFilterService, ProductFilter } from '../../core/services/product-filter.service';

@Component({
    selector: 'app-product-filter-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="filter-widget" [ngStyle]="getContainerStyles()">
            <div class="filter-inner" [class.sidebar]="config.filterPosition === 'sidebar'" [class.topbar]="config.filterPosition !== 'sidebar'">
                <h3 class="filter-title" *ngIf="config.showLabel">{{ config.label || 'Filter Products' }}</h3>

                <!-- Keyword search -->
                <div class="filter-group" *ngIf="config.showSearch">
                    <label class="filter-label">Search</label>
                    <input type="text" class="filter-input" placeholder="{{ config.searchPlaceholder || 'Search...' }}" [(ngModel)]="search" (ngModelChange)="apply()" />
                </div>

                <!-- Category -->
                <div class="filter-group" *ngIf="config.showCategoryFilter">
                    <label class="filter-label">Category</label>
                    <select class="filter-select" [(ngModel)]="category" (ngModelChange)="apply()">
                        <option value="">All Categories</option>
                        <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                    </select>
                </div>

                <!-- Price range -->
                <div class="filter-group" *ngIf="config.showPriceFilter">
                    <label class="filter-label">Price Range</label>
                    <div class="price-inputs">
                        <input type="number" class="filter-input price-input" placeholder="Min" [(ngModel)]="minPrice" (ngModelChange)="apply()" min="0" />
                        <span class="price-sep">–</span>
                        <input type="number" class="filter-input price-input" placeholder="Max" [(ngModel)]="maxPrice" (ngModelChange)="apply()" min="0" />
                    </div>
                </div>

                <!-- Sort -->
                <div class="filter-group" *ngIf="config.showSort">
                    <label class="filter-label">Sort by</label>
                    <select class="filter-select" [(ngModel)]="sort" (ngModelChange)="apply()">
                        <option value="">Default</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="name-asc">Name A–Z</option>
                    </select>
                </div>

                <!-- Reset -->
                <button class="btn-reset" (click)="reset()" *ngIf="hasActiveFilter()">Clear Filters</button>
            </div>
        </div>
    `,
    styles: [`
        .filter-widget { padding: 1rem 0; }
        .filter-inner.topbar {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: flex-end;
        }
        .filter-inner.sidebar {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }
        .filter-title { font-weight: 700; margin: 0 0 0.5rem; font-size: 1rem; }
        .filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
        .filter-label { font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: #666; }
        .filter-input, .filter-select {
            padding: 0.5rem 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 0.875rem;
        }
        .price-inputs { display: flex; gap: 0.5rem; align-items: center; }
        .price-input { width: 90px; }
        .price-sep { color: #999; }
        .btn-reset {
            padding: 0.5rem 1rem;
            background: transparent;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            color: #666;
        }
        .btn-reset:hover { background: #f5f5f5; }
        @media (max-width: 600px) {
            .filter-inner.topbar { flex-direction: column; }
        }
    `]
})
export class ProductFilterWidgetComponent implements OnInit, OnDestroy {
    @Input() config: any = {
        filterPosition: 'top-bar',
        showLabel: false,
        label: 'Filter Products',
        showSearch: true,
        searchPlaceholder: 'Search products...',
        showCategoryFilter: true,
        showPriceFilter: true,
        showSort: true,
        panelBackground: '#f8f8f8',
        panelBorderColor: '#eeeeee'
    };

    @Input() categories: string[] = [];

    search = '';
    category = '';
    minPrice: number | undefined;
    maxPrice: number | undefined;
    sort = '';

    private _destroy$ = new Subject<void>();

    constructor(
        private filterService: ProductFilterService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        // Sync initial state from URL
        this.route.queryParams.pipe(takeUntil(this._destroy$)).subscribe((params) => {
            this.search = params['q'] || '';
            this.category = params['cat'] || '';
            this.minPrice = params['min'] ? +params['min'] : undefined;
            this.maxPrice = params['max'] ? +params['max'] : undefined;
            this.sort = params['sort'] || '';
            this.filterService.loadFromParams(params);
        });
    }

    ngOnDestroy(): void {
        this._destroy$.next();
        this._destroy$.complete();
    }

    apply(): void {
        const filter: ProductFilter = {
            search: this.search || undefined,
            category: this.category || undefined,
            minPrice: this.minPrice,
            maxPrice: this.maxPrice,
            sort: this.sort || undefined
        };
        this.filterService.setFilters(filter, this.router, this.route);
    }

    reset(): void {
        this.search = '';
        this.category = '';
        this.minPrice = undefined;
        this.maxPrice = undefined;
        this.sort = '';
        this.filterService.reset();
        this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }

    hasActiveFilter(): boolean {
        return !!(this.search || this.category || this.minPrice || this.maxPrice || this.sort);
    }

    getContainerStyles() {
        return {
            background: this.config.panelBackground,
            borderBottom: this.config.filterPosition !== 'sidebar' ? `1px solid ${this.config.panelBorderColor}` : 'none',
            padding: this.config.filterPosition === 'sidebar' ? '1.5rem' : '1rem 1.5rem',
            borderRadius: '6px'
        };
    }
}
