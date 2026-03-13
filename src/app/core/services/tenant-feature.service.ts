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
}

@Injectable({
    providedIn: 'root'
})
export class TenantFeatureService {
    private baseUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getCurrentTenantFeatures(): Observable<TenantFeaturesDto> {
        return this.http.get<TenantFeaturesDto>(`${this.baseUrl}/api/Tenant/Tenant_GetCurrentTenantFeatures`);
    }

    hasShop(): Observable<boolean> {
        return this.getCurrentTenantFeatures().pipe(map((f) => f.hasShop === true));
    }

    allowGuestCheckout(): Observable<boolean> {
        return this.getCurrentTenantFeatures().pipe(map((f) => f.allowGuestCheckout === true));
    }
}
