import { Directive, Injector, OnInit } from '@angular/core';
import { TenantSettingsService } from './services/tenant-settings.service';
import { TenantService } from './services/tenant.service';
import { SpinnerService } from './services/spinner.service';
import { FileUploadServiceProxy } from './services/service-proxies';

@Directive()
export abstract class TenantBaseComponent implements OnInit {
    protected tenantSettingsService: TenantSettingsService;
    protected tenantService: TenantService;
    protected spinnerService: SpinnerService;
    protected fileUploadServiceProxy: FileUploadServiceProxy;
    tenantSettings: any;
    loading = true;

    constructor(protected injector: Injector) {
        this.tenantSettingsService = injector.get(TenantSettingsService);
        this.tenantService = injector.get(TenantService);
        this.spinnerService = injector.get(SpinnerService);
        this.fileUploadServiceProxy = injector.get(FileUploadServiceProxy);
    }

    async ngOnInit() {
        try {
            // Determine tenant from hostname first
            console.log('TenantBaseComponent.ngOnInit: calling determineTenant...');
            await this.tenantService.determineTenant();
            console.log('TenantBaseComponent.ngOnInit: determineTenant complete, tenant type =', this.tenantService.getTenantType());
            await this.loadTenantSettings();
        } catch (error) {
            console.error('Error in TenantBaseComponent.ngOnInit:', error);
        }
    }

    async loadTenantSettings() {
        this.spinnerService.show();
        this.tenantSettings = this.tenantSettingsService.getSettings();
        this.loading = false;
        this.spinnerService.hide();
        // Set session prefs, etc.
    }

    showSpinner(): void {
        this.spinnerService.show();
    }

    hideSpinner(): void {
        this.spinnerService.hide();
    }

    // Add more helpers as needed
}
