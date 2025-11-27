import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TenantFeaturesDto {
    identityVerification: boolean;
    maxVerificationsPerMonth: number;
    enhancedVerification: boolean;
    quickIdCheck: boolean;
    bulkVerification: boolean;
    verificationHistory: boolean;
    verificationsUsedThisMonth: number;
    verificationLimitReached: boolean;
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
}
