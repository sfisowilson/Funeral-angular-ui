import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

export interface ProductFilter {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
}

/**
 * Shared service that keeps filter state in sync with URL query params.
 * Both the product-filter-widget (writes) and the products-widget (reads) subscribe to filters$.
 */
@Injectable({
    providedIn: 'root'
})
export class ProductFilterService {
    private _filters$ = new BehaviorSubject<ProductFilter>({});
    readonly filters$ = this._filters$.asObservable();

    get current(): ProductFilter {
        return this._filters$.value;
    }

    setFilters(filters: ProductFilter, router?: Router, route?: ActivatedRoute): void {
        this._filters$.next(filters);
        if (router && route) {
            const queryParams: any = {};
            if (filters.search) queryParams['q'] = filters.search;
            if (filters.category) queryParams['cat'] = filters.category;
            if (filters.minPrice != null) queryParams['min'] = filters.minPrice;
            if (filters.maxPrice != null) queryParams['max'] = filters.maxPrice;
            if (filters.sort) queryParams['sort'] = filters.sort;
            router.navigate([], { relativeTo: route, queryParams, queryParamsHandling: 'merge', replaceUrl: true });
        }
    }

    loadFromParams(params: any): void {
        this._filters$.next({
            search: params['q'] || '',
            category: params['cat'] || '',
            minPrice: params['min'] ? +params['min'] : undefined,
            maxPrice: params['max'] ? +params['max'] : undefined,
            sort: params['sort'] || ''
        });
    }

    reset(): void {
        this._filters$.next({});
    }
}
