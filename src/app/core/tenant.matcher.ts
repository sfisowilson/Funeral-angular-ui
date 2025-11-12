import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { TenantService, TenantType } from './services/tenant.service';

export const tenantMatcher = (allowedTypes: TenantType[]): CanMatchFn => {
    return () => {
        const tenantService = inject(TenantService);
        const tenantType = tenantService.getTenantType();
        return allowedTypes.includes(tenantType);
    };
};
