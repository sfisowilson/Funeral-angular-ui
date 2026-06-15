import { APP_INITIALIZER, Inject, Injectable, NgModule } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { APP_BOOTSTRAP_LISTENER } from '@angular/core';
import { Router } from '@angular/router';
import { API_BASE_URL, TenantSettingServiceProxy, TenantSettingDto } from './service-proxies';
import { SpinnerService } from './spinner.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TenantSettingsService {
    private settings: TenantSettingDto | undefined;
    private settingsLoaded = false; // true once the first successful load completes (even if result is null)
    private settingsPromise: Promise<any> | null = null;
    tenantIdHeader!: HttpHeaders;
    private parsedSettings: any | null = null;

    constructor(
        private tenantService: TenantSettingServiceProxy,
        private router: Router,
        private spinnerService: SpinnerService,
        private http: HttpClient,
        @Inject(API_BASE_URL) private baseUrl: string
    ) {}

    get currentSettings(): TenantSettingDto | undefined {
        return this.settings;
    }

    loadSettings(): Promise<any> {
        const host = window.location.hostname;
        // Extract subdomain intelligently to handle multi-level TLDs like dev.co.za or mizo.co.za
        // For dev.co.za: subdomain = '' (empty, it's the host)
        // For tenant.dev.co.za: subdomain = 'tenant'
        const baseDomain = environment.baseDomain;
        let subdomain = '';
        if (host.endsWith(baseDomain) && host !== baseDomain) {
            // Remove the base domain and the trailing dot
            subdomain = host.substring(0, host.length - baseDomain.length - 1);
        }

        // Only set the header if there's an actual subdomain (not the base domain)
        if (subdomain && subdomain !== 'www') {
            this.tenantIdHeader = new HttpHeaders().set('X-Tenant-ID', subdomain);
        }

        if (this.settingsLoaded) {
            return Promise.resolve(this.settings);
        }

        if (this.settingsPromise) {
            return this.settingsPromise;
        }

        this.spinnerService.show();
        this.settingsPromise = this.tenantService
            .tenantSetting_GetCurrentTenantSettings()
            .toPromise()
            .then((response) => {
                this.settings = response.result;
                this.settingsLoaded = true; // Mark as loaded even if result is null
                this.parsedSettings = null;
                this.spinnerService.hide();
                return this.settings;
            })
            .catch((error) => {
                console.error('Error loading tenant settings:', error);
                this.spinnerService.hide();
                // Note: do not reset settingsPromise here — keeping the settled (rejected)
                // promise prevents repeated spinner flashes on subsequent loadSettings() calls.
                // Callers that need a retry should call refreshSettings() explicitly.
                throw error;
            });
        return this.settingsPromise;
    }

    getSettings(): any {
        return this.settings;
    }

    refreshSettings(): Promise<any> {
        // Clear cache to force reload
        this.settings = undefined;
        this.settingsLoaded = false;
        this.settingsPromise = null;
        this.parsedSettings = null;
        return this.loadSettings();
    }

    downloadFile(fileId: string, fileType: string): Observable<Blob> {
        let url = `${this.baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
        // Include tenant header for multi-tenant file access (same as getDownloadUrl)
        if (this.tenantIdHeader && this.tenantIdHeader.has('X-Tenant-ID')) {
            url += `?X-Tenant-ID=${this.tenantIdHeader.get('X-Tenant-ID')}`;
        }
        let acceptHeader = 'application/octet-stream';
        if (fileType === 'css') {
            acceptHeader = 'text/css';
        }
        return this.http.get(url, {
            responseType: 'blob',
            headers: { Accept: acceptHeader }
        });
    }

    getDownloadUrl(fileId: string | undefined): string {
        if (!fileId) {
            return '';
        }
        let url = `${this.baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
        if (this.tenantIdHeader && this.tenantIdHeader.has('X-Tenant-ID')) {
            url += `?X-Tenant-ID=${this.tenantIdHeader.get('X-Tenant-ID')}`;
        }
        return url;
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }

    hasFeature(featureName: string): boolean {
        const parsedSettings = this.getParsedSettings();
        // Check if feature is explicitly enabled
        return parsedSettings[featureName] === true || parsedSettings[featureName] === 'true';
    }

    private getParsedSettings(): any {
        if (!this.settings || !this.settings.settings) {
            return {};
        }

        if (this.parsedSettings) {
            return this.parsedSettings;
        }

        try {
            this.parsedSettings = JSON.parse(this.settings.settings);
        } catch (error) {
            console.error('Error parsing tenant settings:', error);
            this.parsedSettings = {};
        }

        return this.parsedSettings;
    }

    getMemberNumberLabel(): string {
        const parsed = this.getParsedSettings();
        return parsed.memberNumberConfig?.label || 'Member Number';
    }

    isMemberNumberEnabled(): boolean {
        const parsed = this.getParsedSettings();
        return parsed.memberNumberConfig?.enabled === true;
    }
}

export function initializeApp(tenantSettingsService: TenantSettingsService) {
    return () => tenantSettingsService.loadSettings();
}

export const appInitializerProvider = {
    provide: APP_INITIALIZER,
    useFactory: initializeApp,
    deps: [TenantSettingsService],
    multi: true
};
