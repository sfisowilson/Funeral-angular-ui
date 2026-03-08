import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export type TenantType = 'host' | 'tenant' | 'landing' | 'unknown';

@Injectable({
    providedIn: 'root'
})
export class TenantService {
    private currentTenantType: TenantType = 'unknown';
    private tenantId: string | null = null;

    constructor() {}

    async determineTenant(): Promise<void> {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        const baseDomain = environment.baseDomain;
        const hostSubdomain = environment.hostSubdomain;

        console.log('Determining tenant:', { hostname, baseDomain, hostSubdomain, parts });

        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.currentTenantType = 'host';
            this.tenantId = 'host';
            console.log('✅ Detected as HOST (localhost)');
        }
        // Check for host subdomain (host.funeral.com)
        else if (hostname === `${hostSubdomain}.${baseDomain}`) {
            this.currentTenantType = 'host';
            this.tenantId = 'host';
            console.log('✅ Detected as HOST (subdomain match)');
        }
        // Check for base domain without subdomain (funeral.com)
        else if (hostname === baseDomain) {
            this.currentTenantType = 'host';
            this.tenantId = 'host';
            console.log('✅ Detected as HOST (base domain)');
        }
        // Check for tenant subdomain (e.g., tenant1.funeral.com)
        else if (hostname.endsWith(`.${baseDomain}`)) {
            // Extract subdomain (first part before baseDomain)
            const subdomain = hostname.replace(`.${baseDomain}`, '').split('.').pop() || '';
            if (subdomain && subdomain !== 'www' && subdomain !== hostSubdomain) {
                this.currentTenantType = 'tenant';
                this.tenantId = subdomain;
                console.log('✅ Detected as TENANT:', subdomain);
            } else {
                // www or empty subdomain = landing page
                this.currentTenantType = 'landing';
                this.tenantId = null;
                console.log('✅ Detected as LANDING (www or empty)');
            }
        }
        // Custom domain: a fully-qualified domain that is not under baseDomain
        // e.g. "www.riverside-memorial.com". Pass the full hostname to the backend
        // as the X-Tenant-ID header; the backend will match it against CustomDomain.
        else if (hostname.includes('.')) {
            this.currentTenantType = 'tenant';
            this.tenantId = hostname;
            console.log('✅ Detected as TENANT (custom domain):', hostname);
        }
        // Default to landing page
        else {
            this.currentTenantType = 'landing';
            this.tenantId = null;
            console.log('✅ Detected as LANDING (default)');
        }
    }

    getTenantType(): TenantType {
        return this.currentTenantType;
    }

    getTenantId(): string | null {
        return this.tenantId;
    }

    setCurrentTenant(tenantId: string): void {
        this.tenantId = tenantId;
    }
}
