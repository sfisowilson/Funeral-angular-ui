import { Inject, Injectable, Optional } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { API_BASE_URL } from './service-proxies';

export interface EnabledOnboardingStepLite {
  id?: string;
  stepType?: any;
  stepKey?: string;
  stepLabel?: string;
  formId?: string | null;
  dynamicEntityTypeKey?: string | null;
  dynamicEntityTypeId?: string | null;
  listDisplayConfig?: string | null;
  isEnabled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingStepConfigurationClient {
  private readonly baseUrl: string;
  private enabledSteps$?: Observable<EnabledOnboardingStepLite[]>;
  private allSteps$?: Observable<EnabledOnboardingStepLite[]>;

  constructor(
    private http: HttpClient,
    @Optional() @Inject(API_BASE_URL) baseUrl?: string
  ) {
    this.baseUrl = baseUrl ?? '';
  }

  /**
   * Returns enabled onboarding steps for the current tenant.
   * Endpoint is POST (no body required) and is available for members.
   */
  getEnabledSteps(): Observable<EnabledOnboardingStepLite[]> {
    if (!this.enabledSteps$) {
      const url = `${this.baseUrl}/api/OnboardingStepConfiguration/OnboardingStepConfiguration_GetEnabledSteps`;
      this.enabledSteps$ = this.http
        .post<EnabledOnboardingStepLite[]>(url, {})
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }

    return this.enabledSteps$;
  }

  /**
   * Returns all onboarding steps for the current tenant (enabled + disabled).
   * Useful for resolving widget configuration issues.
   */
  getAllSteps(): Observable<EnabledOnboardingStepLite[]> {
    if (!this.allSteps$) {
      const url = `${this.baseUrl}/api/OnboardingStepConfiguration/OnboardingStepConfiguration_GetAll`;
      this.allSteps$ = this.http
        .post<EnabledOnboardingStepLite[]>(url, {})
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }

    return this.allSteps$;
  }
}
