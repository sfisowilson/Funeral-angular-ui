import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductServiceProxy, ProductDto, CreateProductDto, UpdateProductDto, CategoryDto, CreateCategoryDto, ProductStatsDto } from './service-proxies';

export interface Product {
    id: string;
    name: string;
    sku?: string;
    description?: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    cost?: number;
    stockQuantity: number;
    lowStockThreshold?: number;
    trackInventory: boolean;
    isActive: boolean;
    isFeatured: boolean;
    category?: string;
    categoryId?: string;
    tags?: string[];
    images?: ProductImage[];
    variants?: ProductVariant[];
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    weight?: number;
    length?: number;
    width?: number;
    height?: number;
    weightUnit?: string;
    dimensionUnit?: string;
}

export interface ProductImage {
    id?: string;
    imageUrl: string;
    url?: string; // Alias for imageUrl
    altText?: string;
    displayOrder: number;
    isPrimary: boolean;
}

export interface ProductVariant {
    id?: string;
    name: string;
    variantType?: string;
    sku?: string;
    priceAdjustment?: number;
    stockQuantity: number;
    isActive: boolean;
}

export interface Category {
    id?: string;
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    imageUrl?: string;
    parentCategoryId?: string;
    displayOrder?: number;
    isActive: boolean;
}

export interface ProductStats {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalInventoryValue: number;
    featuredProducts: number;
    totalCategories: number;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    constructor(private productProxy: ProductServiceProxy) {}

    getProducts(isActive?: boolean, categoryId?: string): Observable<Product[]> {
        return this.productProxy.product_GetAll(isActive, categoryId).pipe(map((r: any) => r?.result ?? r ?? []));
    }

    getActiveProducts(): Observable<Product[]> {
        return this.getProducts(true);
    }

    getFeaturedProducts(): Observable<Product[]> {
        return this.productProxy.product_GetAll(true, undefined).pipe(map((r: any) => r?.result ?? r ?? []));
    }

    getProduct(id: string): Observable<Product> {
        return this.productProxy.product_GetById(id).pipe(map((r: any) => r?.result ?? r));
    }

    createProduct(product: Product): Observable<Product> {
        const mapped = { ...product, categoryId: product.categoryId ?? product.category };
        const dto = CreateProductDto.fromJS(mapped);
        return this.productProxy.product_Create(dto).pipe(map((r: any) => r?.result ?? r));
    }

    updateProduct(id: string, product: Product): Observable<Product> {
        const mapped = { ...product, id, categoryId: product.categoryId ?? product.category };
        const dto = UpdateProductDto.fromJS(mapped);
        return this.productProxy.product_Update(dto).pipe(map((r: any) => r?.result ?? r));
    }

    deleteProduct(id: string): Observable<void> {
        return this.productProxy.product_Delete(id).pipe(map(() => undefined));
    }

    updateInventory(productId: string, stockQuantity: number, variantId?: string): Observable<void> {
        // Inventory update would need a separate endpoint - for now just return empty observable
        return new Observable((observer) => {
            observer.next();
            observer.complete();
        });
    }

    getCategories(): Observable<Category[]> {
        return this.productProxy.category_GetAll().pipe(map((r: any) => r?.result ?? r ?? []));
    }

    createCategory(category: Category): Observable<Category> {
        const dto = new CreateCategoryDto(category as any);
        return this.productProxy.category_Create(dto).pipe(map((r: any) => r?.result ?? r));
    }

    getProductStats(): Observable<ProductStats> {
        return this.productProxy.product_GetStats().pipe(
            map((response: any) => {
                const d = response?.result ?? response?.data ?? response ?? {};
                return {
                    totalProducts: d.totalProducts || 0,
                    activeProducts: d.activeProducts || 0,
                    lowStockProducts: d.lowStockProducts || 0,
                    totalInventoryValue: d.totalInventoryValue || 0,
                    featuredProducts: d.featuredProducts || 0,
                    totalCategories: d.totalCategories || 0
                };
            })
        );
    }

    searchProducts(query: string): Observable<Product[]> {
        // Search would typically filter on the client side or use a dedicated endpoint
        return this.getProducts();
    }
}
