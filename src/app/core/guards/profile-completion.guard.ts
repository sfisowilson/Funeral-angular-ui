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
        // Use the slug endpoint for the onboarding page so that only admins can manage
        // custom pages, but members can still be redirected to view the onboarding page.
        return forkJoin({
            statusResponse: this.profileService.profileCompletion_GetMyStatus(),
            pageResponse: this.customPagesService.slug('member-onboarding')
        }).pipe(
            map(({ statusResponse, pageResponse }) => {
                const status = statusResponse.result;
                const onboardingPage = pageResponse.result;

                const isBlocking = onboardingPage?.isOnboardingPage && onboardingPage?.isBlockingOnboarding;

                // If there is no blocking onboarding page configured, do not enforce redirect
                if (!isBlocking) {
                    return true;
                }

                // If profile is complete, allow navigation
                if (status.isComplete) {
                    return true;
                }

                // Profile incomplete and blocking onboarding enabled: redirect to onboarding page by slug
                const slug = onboardingPage?.slug || 'member-onboarding';
                this.router.navigate(['/', slug], {
                    queryParams: { returnUrl: state.url }
                });
                return false;
            }),
            catchError(error => {
                console.error('Error checking profile completion or onboarding page configuration:', error);
                // On error, allow navigation (fail open for better UX)
                return of(true);
            })
        );
    }
}
