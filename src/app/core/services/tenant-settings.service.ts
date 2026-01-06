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
    private settingsPromise: Promise<any> | null = null;
    tenantIdHeader!: HttpHeaders;

    constructor(
        private tenantService: TenantSettingServiceProxy,
        private router: Router,
        private spinnerService: SpinnerService,
        private http: HttpClient,
        @Inject(API_BASE_URL) private baseUrl: string
    ) {}

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

        if (this.settings) {
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
                this.settings = response;
                this.spinnerService.hide();
                return this.settings;
            })
            .catch((error) => {
                console.error('Error loading tenant settings:', error);
                this.spinnerService.hide();
                this.router.navigate(['/notfound']);
                this.settingsPromise = null; // Reset on error to allow retries
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
        this.settingsPromise = null;
        return this.loadSettings();
    }

    downloadFile(fileId: string, fileType: string): Observable<Blob> {
        const url = `${this.baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
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
        console.log('Download URL:', url);
        console.log('Tenant ID Header:', this.tenantIdHeader);
        if (this.tenantIdHeader && this.tenantIdHeader.has('X-Tenant-ID')) {
            url += `?X-Tenant-ID=${this.tenantIdHeader.get('X-Tenant-ID')}`;
        }
        return url;
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }

    hasFeature(featureName: string): boolean {
        if (!this.settings || !this.settings.settings) {
            return false;
        }
        
        try {
            const parsedSettings = JSON.parse(this.settings.settings);
            // Check if feature is explicitly enabled
            return parsedSettings[featureName] === true || parsedSettings[featureName] === 'true';
        } catch (error) {
            console.error('Error parsing tenant settings:', error);
            return false;
        }
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
