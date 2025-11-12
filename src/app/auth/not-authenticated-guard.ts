import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth-service';

@Injectable({
    providedIn: 'root'
})
export class NotAuthenticatedGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const isAuthenticated = this.authService.isAuthenticated();

        if (isAuthenticated) {
            // Do not redirect here, let the router continue evaluating routes
            return false;
        }

        return true;
    }
}
