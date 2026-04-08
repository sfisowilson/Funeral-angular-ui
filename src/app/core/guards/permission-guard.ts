import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate } from '@angular/router';
import { AuthService } from '../../auth/auth-service';
import { TenantService } from '../services/tenant.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router,
        private tenantService: TenantService
    ) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const requiredRoles = route.data['roles'] as string[];
        const requiredPermissions = route.data['permissions'] as string[];
        const requiredTenantType = route.data['tenantType'] as string;

        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/auth/login']);
            return false;
        }

        const tenantType = this.tenantService.getTenantType();
        if (requiredTenantType && tenantType !== requiredTenantType) {
            this.router.navigate(['/notfound']);
            return false;
        }

        if (requiredRoles && !this.authService.hasAnyRole(requiredRoles)) {
            if (state.url.startsWith('/admin')) {
                this.redirectToFirstAccessibleAdminPage();
            } else {
                this.router.navigate(['/notfound']);
            }
            return false;
        }

        if (requiredPermissions && !this.authService.hasAnyPermission(requiredPermissions)) {
            if (state.url.startsWith('/admin')) {
                this.redirectToFirstAccessibleAdminPage();
            } else {
                this.router.navigate(['/notfound']);
            }
            return false;
        }

        return true;
    }

    private redirectToFirstAccessibleAdminPage(): void {
        this.router.navigate([this.authService.getFirstAccessibleAdminRoute()]);
    }
}
