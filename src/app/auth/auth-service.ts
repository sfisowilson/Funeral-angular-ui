import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    logout() {
        // Remove the token from local storage
        this.removeToken();
    }
    private tokenKey = 'auth_token';
    private jwtHelper = new JwtHelperService();
    private decodedUserToken: any = null;

    constructor() {}

    init(): Promise<void> {
        return new Promise((resolve) => {
            this.loadToken();
            resolve();
        });
    }

    private loadToken(): void {
        const token = this.getToken();
        if (token && !this.jwtHelper.isTokenExpired(token)) {
            this.decodedUserToken = this.jwtHelper.decodeToken(token);
        } else {
            this.decodedUserToken = null;
        }
    }

    setToken(token: string): Observable<boolean> {
        localStorage.setItem(this.tokenKey, token);
        this.decodedUserToken = this.jwtHelper.decodeToken(token);
        return of(true);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    removeToken(): void {
        localStorage.removeItem(this.tokenKey);
        this.decodedUserToken = null;
    }

    decodeToken(): any {
        return this.decodedUserToken;
    }

    isAuthenticated(): boolean {
        const token = this.getToken();


        if (!token) {
            console.log('- Result: No token found');
            return false;
        }

        const isExpired = this.jwtHelper.isTokenExpired(token);

        if (isExpired) {
            console.log('- Result: Token is expired');
            this.decodedUserToken = null; // Clear expired token
            return false;
        }

        // If we have a token and it's not expired, ensure decoded token is set
        if (!this.decodedUserToken) {
            console.log('- Re-decoding token...');
            this.decodedUserToken = this.jwtHelper.decodeToken(token);
        }

        const isAuthenticated = !!this.decodedUserToken;
        return isAuthenticated;
    }

    getRoles(): string[] {
        if (!this.decodedUserToken) return [];

        let roles = this.decodedUserToken.roles;

        // Handle case where roles might be a JSON string
        if (typeof roles === 'string') {
            try {
                roles = JSON.parse(roles);
            } catch (e) {
                console.warn('Failed to parse roles from token:', roles);
                return [];
            }
        }

        return Array.isArray(roles) ? roles : [];
    }

    getPermissions(): string[] {
        if (!this.decodedUserToken) return [];

        let permissions = this.decodedUserToken.permissions;

        // Handle case where permissions might be a JSON string
        if (typeof permissions === 'string') {
            try {
                permissions = JSON.parse(permissions);
            } catch (e) {
                console.warn('Failed to parse permissions from token:', permissions);
                return [];
            }
        }

        return Array.isArray(permissions) ? permissions : [];
    }

    hasRole(role: string): boolean {
        return this.getRoles().includes(role);
    }

    hasAnyRole(roles: string[]): boolean {
        const userRoles = this.getRoles();
        return roles.some((role) => userRoles.includes(role));
    }

    hasPermission(permission: string): boolean {
        if (!this.isAuthenticated() || !this.getPermissions().length) {
            return false;
        }
        return this.getPermissions().includes(permission);
    }

    hasAnyPermission(permissions: string[]): boolean {
        return permissions.some((permission) => this.getPermissions().includes(permission));
    }

    getUserId(): string | null {
        if (!this.decodedUserToken) return null;
        // Check common JWT claims for user ID
        return this.decodedUserToken.sub || 
               this.decodedUserToken.userId || 
               this.decodedUserToken.nameid || 
               this.decodedUserToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
               null;
    }

    getUserEmail(): string | null {
        if (!this.decodedUserToken) return null;
        return this.decodedUserToken.email || 
               this.decodedUserToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
               null;
    }

    getTenantType(): number | null {
        if (!this.decodedUserToken) return null;
        const tenantType = this.decodedUserToken.tenantType;
        return tenantType ? parseInt(tenantType, 10) : null;
    }

    getTenantTypeName(): string | null {
        if (!this.decodedUserToken) return null;
        return this.decodedUserToken.tenantTypeName || null;
    }

    getPlanName(): string | null {
        if (!this.decodedUserToken) return null;
        return this.decodedUserToken.planName || null;
    }

    isBasicPlan(): boolean {
        const planName = this.getPlanName();
        return planName?.toLowerCase().includes('basic') || false;
    }
}
