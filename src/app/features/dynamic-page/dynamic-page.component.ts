import { Component, OnInit, signal, Inject, ChangeDetectionStrategy, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomPagesServiceProxy, CustomPageDto, PageListItemDto, API_BASE_URL } from '../../core/services/service-proxies';
import { Meta, Title } from '@angular/platform-browser';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { WIDGET_RENDER_LOADERS } from '../../building-blocks/widget-render-loaders';
import { AuthService } from '@app/auth/auth-service';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { TenantService } from '../../core/services/tenant.service';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PublicHeaderComponent } from '@app/shared/components/public-header/public-header.component';

@Component({
    selector: 'app-dynamic-page',
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule, RouterModule, PublicHeaderComponent],
    providers: [TenantSettingsService],
    templateUrl: './dynamic-page.component.html',
    styleUrls: ['./dynamic-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicPageComponent implements OnInit {
    page = signal<CustomPageDto | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);

    // Lazy-loaded widget component cache — populated after page data arrives
    private readonly componentCache = new Map<string, Type<any>>();
    // Memoised sorted-widget list — rebuilt only when page() reference changes
    private _cachedSortedWidgets: any[] | null = null;
    private _cachedPageRef: CustomPageDto | null | undefined = undefined;
    currentYear = new Date().getFullYear();
    isLoggedIn = false;
    mobileMenuOpen = false;
    tenantSettings: any = {};
    _settings: any = {};
    isStaticSite = false;
    isHostTenant = false;
    navbarPages: PageListItemDto[] = [];
    footerPages: PageListItemDto[] = [];
    tenantIdHeader!: HttpHeaders;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private customPagesService: CustomPagesServiceProxy,
        private titleService: Title,
        private metaService: Meta,
        private authService: AuthService,
        private tenantSettingsService: TenantSettingsService,
        private tenantService: TenantService,
        @Inject(API_BASE_URL) private baseUrl: string
    ) {}

    ngOnInit(): void {
        // Check auth state
        this.isLoggedIn = this.authService.isAuthenticated();
        this.isHostTenant = this.tenantService.getTenantType() === 'host';

        // Set up tenant ID header
        const host = window.location.hostname;
        const subdomain = host.split('.')[0];
        let tenantId = '';
        if (subdomain && subdomain !== 'www' && subdomain !== environment.baseDomain?.split('.')[0]) {
            tenantId = subdomain;
        } else {
            tenantId = environment.hostSubdomain || '';
        }
        this.tenantIdHeader = new HttpHeaders().set('X-Tenant-ID', tenantId);

        // Load tenant settings
        this.tenantSettingsService.loadSettings().then((data: any) => {
            this.tenantSettings = data;
            this._settings = JSON.parse(this.tenantSettings.settings ?? '{}');
            this.isStaticSite = this._settings.isStaticSite || false;
        });

        // Load custom pages for navigation using public navbar/footer endpoints
        this.customPagesService.navbar().subscribe((response) => {
            const pages = response?.result || [];
            this.navbarPages = pages.filter((p) => p.isActive && p.showInNavbar).sort((a, b) => ((a as any).navbarOrder || 999) - ((b as any).navbarOrder || 999));
        });

        this.customPagesService.footer().subscribe((response) => {
            const pages = response?.result || [];
            this.footerPages = pages.filter((p) => p.isActive && p.showInFooter).sort((a, b) => ((a as any).footerOrder || 999) - ((b as any).footerOrder || 999));
        });

        this.route.params.subscribe((params) => {
            const slug = params['slug'];
            if (slug) {
                this.loadPage(slug);
            }
        });
    }

    loadPage(slug: string): void {
        this.loading.set(true);
        this.error.set(null);
        // Reset cache so the new page's widgets are re-resolved
        this._cachedSortedWidgets = null;
        this._cachedPageRef = undefined;

        this.customPagesService.slug(slug).subscribe({
            next: (response) => {
                const page = response?.result || null;
                this.page.set(page);
                this.updateMetaTags(page);
                // Preload the JS chunks for every widget type on this page in
                // parallel, then reveal the page.  Keeps loading=true during
                // the brief network round-trip so there's no empty flash.
                this.preloadWidgets(page?.content || []).then(() => {
                    this.loading.set(false);
                });
            },
            error: (error) => {
                console.error('Error loading page:', error);
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                console.error('Error details:', error);

                if (error.status === 404) {
                    this.error.set('Page not found');
                } else if (error.status === 401 || error.status === 403) {
                    // Redirect to login for protected pages
                    this.router.navigate(['/auth/login'], {
                        queryParams: { returnUrl: this.router.url }
                    });
                } else {
                    this.error.set('An error occurred while loading the page. Please check the browser console for details.');
                }
                this.loading.set(false);
            }
        });
    }

    private updateMetaTags(page: CustomPageDto): void {
        // Update page title
        this.titleService.setTitle(page.title || page.name || '');

        // Update meta description
        if (page.description) {
            this.metaService.updateTag({ name: 'description', content: page.description });
        }

        // Update Open Graph tags if meta tags are provided
        if (page.metaTags) {
            if (page.metaTags.ogTitle) {
                this.metaService.updateTag({ property: 'og:title', content: page.metaTags.ogTitle });
            }
            if (page.metaTags.ogDescription) {
                this.metaService.updateTag({ property: 'og:description', content: page.metaTags.ogDescription });
            }
            if (page.metaTags.ogImage) {
                this.metaService.updateTag({ property: 'og:image', content: page.metaTags.ogImage });
            }
            if (page.metaTags.keywords) {
                this.metaService.updateTag({ name: 'keywords', content: page.metaTags.keywords });
            }
        }
    }

    getSortedWidgets(): any[] {
        const currentPage = this.page();
        // Return memoised list when the page reference hasn't changed
        if (this._cachedSortedWidgets !== null && this._cachedPageRef === currentPage) {
            return this._cachedSortedWidgets;
        }
        this._cachedPageRef = currentPage;
        const dbWidgets: any[] = (currentPage as any)?.content || [];
        this._cachedSortedWidgets = dbWidgets
            .slice() // never mutate the original array
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((w: any, index: number) => {
                const rawConfig = w.config;
                const settings = rawConfig && typeof rawConfig === 'object' && rawConfig.settings
                    ? rawConfig.settings
                    : rawConfig ?? {};
                return {
                    id: w.id || w.Id || `widget-${index}`,
                    type: w.type || w.Type,
                    settings,
                    layout: rawConfig?.layout
                };
            });
        return this._cachedSortedWidgets;
    }

    /** O(1) lookup — component types are resolved into the Map by preloadWidgets() */
    getWidgetComponent(widgetType: string): Type<any> | null {
        return this.componentCache.get(widgetType) ?? null;
    }

    /**
     * Fetches the JS chunk for every widget type present on the page in parallel.
     * Only runs the loader once per type per session (Map cache).
     */
    private async preloadWidgets(dbWidgets: any[]): Promise<void> {
        const types = [...new Set(dbWidgets.map((w: any) => String(w.type)))];
        await Promise.all(
            types.map(async (type) => {
                if (this.componentCache.has(type)) return;
                const loader = WIDGET_RENDER_LOADERS[type];
                if (loader) {
                    const component = await loader();
                    this.componentCache.set(type, component);
                }
            })
        );
    }

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    getRegisterUrl(): string {
        return '/auth/register';
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/']);
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
}
