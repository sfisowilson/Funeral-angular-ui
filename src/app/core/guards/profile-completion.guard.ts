import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { MemberProfileCompletionServiceProxy } from '../services/service-proxies';
import { AuthService } from '../../auth/auth-service';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProfileCompletionGuard implements CanActivate {
    constructor(
        private router: Router,
        private authService: AuthService,
        private profileService: MemberProfileCompletionServiceProxy
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        // Skip check for certain routes
        const skipCheck = route.data['skipProfileCheck'] === true;
        if (skipCheck) {
            return of(true);
        }

        // Allow admins to bypass
        if (this.authService.hasRole('TenantAdmin') || this.authService.hasRole('HostAdmin')) {
            return of(true);
        }

        // Check if user is a member (has Member role)
        const isMember = this.authService.hasRole('Member');
        if (!isMember) {
            return of(true); // Not a member, allow access
        }

        // Check profile completion status
        return this.profileService.profileCompletion_GetMyStatus().pipe(
            map(status => {
                if (status.isComplete) {
                    return true;
                } else {
                    // Profile incomplete, redirect to onboarding
                    this.router.navigate(['/member-onboarding'], {
                        queryParams: { returnUrl: state.url }
                    });
                    return false;
                }
            }),
            catchError(error => {
                console.error('Error checking profile completion:', error);
                // On error, allow navigation (fail open for better UX)
                return of(true);
            })
        );
    }
}
