import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { CustomPagesServiceProxy, MemberProfileCompletionServiceProxy } from '../services/service-proxies';
import { AuthService } from '../../auth/auth-service';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProfileCompletionGuard implements CanActivate {
    constructor(
        private router: Router,
        private authService: AuthService,
        private profileService: MemberProfileCompletionServiceProxy,
        private customPagesService: CustomPagesServiceProxy
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

        // Check profile completion status and onboarding page configuration
        // Fetch all pages to find the configured blocking onboarding page dynamically.
        return forkJoin({
            statusResponse: this.profileService.profileCompletion_GetMyStatus(),
            pagesResponse: this.customPagesService.all()
        }).pipe(
            map(({ statusResponse, pagesResponse }) => {
                const status = statusResponse.result;
                const pages = pagesResponse.result || [];
                
                console.log('ProfileCompletionGuard: Status:', status);
                console.log('ProfileCompletionGuard: Pages found:', pages.length);

                // Find the active page configured as blocking onboarding
                const onboardingPage = pages.find((p) => p.isActive && p.isOnboardingPage && p.isBlockingOnboarding);

                if (onboardingPage) {
                    console.log('ProfileCompletionGuard: Found Blocking Onboarding Page:', onboardingPage.slug);
                } else {
                    console.warn('ProfileCompletionGuard: NO Blocking Onboarding Page configured.');
                }

                // If there is no blocking onboarding page configured, do not enforce redirect
                if (!onboardingPage) {
                    return true;
                }

                // If profile is complete, allow navigation
                if (status.isComplete) {
                    return true;
                }
                
                console.warn('ProfileCompletionGuard: Profile Incomplete. Redirecting to:', onboardingPage.slug);

                // Profile incomplete and blocking onboarding enabled: redirect to onboarding page by slug
                const slug = onboardingPage.slug;
                if (!slug) {
                    return true;
                }

                this.router.navigate(['/', slug], {
                    queryParams: { returnUrl: state.url }
                });
                return false;
            }),
            catchError((error) => {
                console.error('Error checking profile completion or onboarding page configuration:', error);
                
                // IMPORTANT: Fail OPEN behavior.
                // If API fails (e.g. 500 error), we let the user proceed rather than locking them out.
                // This might be why valid errors (like database failure) result in access granted.
                
                // On error, allow navigation (fail open for better UX)
                return of(true);
            })
        );
    }
}
