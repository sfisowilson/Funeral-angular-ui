import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth-service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(
        protected authService: AuthService,
        protected router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const isAuthenticated = this.authService.isAuthenticated();
        const requiredRoles = route.data['roles'] as string[]; // Get required roles from route data

        if (!isAuthenticated) {
            return false;
        }

        if (requiredRoles && !this.authService.hasAnyRole(requiredRoles)) {
            this.authService.removeToken();
            return false;
        }

        return true;
    }
}
