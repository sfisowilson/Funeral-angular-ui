import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantSettingServiceProxy } from './services/service-proxies';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ThemeService } from './services/theme.service';

@NgModule({
    declarations: [],
    imports: [CommonModule],
    providers: [TenantSettingServiceProxy, ThemeService]
})
export class CoreModule {
    constructor(
        @Optional() @SkipSelf() parentModule: CoreModule,
        private themeService: ThemeService
    ) {
        if (parentModule) {
            throw new Error('CoreModule is already loaded. Import it in the AppModule only');
        }
        this.themeService.loadTenantCss();
    }
}
