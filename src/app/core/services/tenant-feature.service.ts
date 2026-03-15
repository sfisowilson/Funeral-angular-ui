import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// NOTE: TenantServiceProxy exists but doesn't include tenant_GetCurrentTenantFeatures method
// This endpoint may need to be added to the backend's Swagger documentation

export interface TenantFeaturesDto {
    identityVerification: boolean;
    maxVerificationsPerMonth: number;
    enhancedVerification: boolean;
    quickIdCheck: boolean;
    bulkVerification: boolean;
    verificationHistory: boolean;
    verificationsUsedThisMonth: number;
    verificationLimitReached: boolean;
    // E-commerce
    hasShop: boolean;
    allowGuestCheckout: boolean;
    maxProducts: number | null;
    maxProductImagesPerProduct: number | null;
    currentProductCount: number | null;
}

@Injectable({
    providedIn: 'root'
})
export class TenantFeatureService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getCurrentTenantFeatures(): Observable<TenantFeaturesDto> {
        return this.http.get<TenantFeaturesDto>(`${this.baseUrl}/api/Tenant/Tenant_GetCurrentTenantFeatures`).pipe(shareReplay(1));
    }

    hasShop(): Observable<boolean> {
        return this.getCurrentTenantFeatures().pipe(map((f) => f.hasShop !== false));
    }

    allowGuestCheckout(): Observable<boolean> {
        return this.getCurrentTenantFeatures().pipe(map((f) => f.allowGuestCheckout === true));
    }

    /** Returns null when there is no limit (unlimited plan). */
    getProductLimit(): Observable<{ max: number | null; current: number | null; imagesPerProduct: number | null }> {
        return this.getCurrentTenantFeatures().pipe(
            map((f) => ({
                max: f.maxProducts ?? null,
                current: f.currentProductCount ?? null,
                imagesPerProduct: f.maxProductImagesPerProduct ?? null
            }))
        );
    }

    isAtProductLimit(): Observable<boolean> {
        return this.getProductLimit().pipe(
            map((l) => l.max !== null && l.current !== null && l.current >= l.max)
        );
    }
}
