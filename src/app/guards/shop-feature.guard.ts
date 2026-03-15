import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { TenantFeatureService } from '../core/services/tenant-feature.service';

export const shopFeatureGuard: CanActivateFn = (_route, _state) => {
    const featureService = inject(TenantFeatureService);
    const router = inject(Router);

    return featureService.hasShop().pipe(
        map((hasShop) => {
            if (hasShop) return true;
            // Shop not enabled on this plan — redirect to home
            return router.createUrlTree(['/']);
        }),
        catchError(() => {
            // If the feature check fails (network error, not yet set up, etc.), allow through
            return of(true);
        })
    );
};
