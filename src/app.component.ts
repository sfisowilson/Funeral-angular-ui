import { Component, OnInit, Inject } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { SpinnerComponent } from './app/shared/components/spinner/spinner.component';
import { AuthService } from './app/auth/auth-service';
import { ThemeService } from './app/core/services/theme.service';
import { filter } from 'rxjs/operators';
import { TenantSettingsService } from './app/core/services/tenant-settings.service';
import { API_BASE_URL, TenantSettingDto } from './app/core/services/service-proxies';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, SpinnerComponent],
    template: `<app-spinner></app-spinner><router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
    jsonSettings: any = {};
    constructor(
        private authService: AuthService,
        private themeService: ThemeService,
        private router: Router,
        private tenantSettingsService: TenantSettingsService,
        @Inject(API_BASE_URL) private baseUrl: string,
        private titleService: Title
    ) {}

    ngOnInit(): void {
        this.setThemeBasedOnAuth();
        this.loadFavicon();

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.setThemeBasedOnAuth();
        });
    }

    private setThemeBasedOnAuth(): void {
        const isAuthenticated = this.authService.isAuthenticated();
        if (isAuthenticated) {
            this.themeService.loadTenantCss(); // Load tenant CSS
        } else {
            this.themeService.loadTenantCss(); // Load tenant CSS
        }
    }

    private loadFavicon(): void {
        this.tenantSettingsService
            .loadSettings()
            .then((settings: TenantSettingDto) => {
                this.jsonSettings = JSON.parse(settings.settings || '{}');
                if (this.jsonSettings.favicon) {
                    let faviconUrl = this.tenantSettingsService.getDownloadUrl(this.jsonSettings.favicon);

                    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
                    if (link) {
                        link.setAttribute('type', 'image/x-icon');
                        link.setAttribute('rel', 'icon');
                        link.setAttribute('href', faviconUrl);
                        document.getElementsByTagName('head')[0].appendChild(link);
                    }
                }

                // Set document title from tenant settings or fallback
                const tenantTitle = (this.jsonSettings && (this.jsonSettings.siteTitle || this.jsonSettings.title)) || settings.tenantName || 'Funeral App';
                console.log('Setting document title to:', tenantTitle, 'from settings:', settings);
                try {
                    this.titleService.setTitle(tenantTitle);
                } catch (e) {
                    console.warn('Unable to set document title:', e);
                }
            })
            .catch((error) => {
                console.error('Error loading favicon:', error);
            });
    }
}
