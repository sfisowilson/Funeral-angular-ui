import { Component, OnInit, signal, Inject, ChangeDetectionStrategy, Type } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
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
import { NavConfigService } from '@app/core/services/nav-config.service';
import { NavConfigDto } from '@app/core/models/nav-config.model';

@Component({
    selector: 'app-dynamic-page',
    standalone: true,
    imports: [CommonModule, ProgressSpinnerModule, RouterModule, PublicHeaderComponent],
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
    private _cachedSortedFooterWidgets: any[] | null = null;
    currentYear = new Date().getFullYear();
    isLoggedIn = false;
    mobileMenuOpen = false;
    // Signals for async data — required for OnPush change detection to pick up updates
    tenantSettings = signal<any>({});
    _settings = signal<any>({});
    navbarPages = signal<PageListItemDto[]>([]);
    navConfig = signal<NavConfigDto | null>(null);
    /** True once navbar + navConfig API calls have settled (success or error). */
    navReady = signal(false);
    /** Promise that resolves when navbar + navConfig calls settle — used to gate initial page reveal. */
    private navDataPromise: Promise<void> | null = null;
    isStaticSite = false;
    isHostTenant = false;
    footerPages: PageListItemDto[] = [];
    tenantIdHeader!: HttpHeaders;
    adminMemberId = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private customPagesService: CustomPagesServiceProxy,
        private titleService: Title,
        private metaService: Meta,
        private authService: AuthService,
        private tenantSettingsService: TenantSettingsService,
        private tenantService: TenantService,
        @Inject(API_BASE_URL) private baseUrl: string,
        private navConfigService: NavConfigService,
        @Inject(DOCUMENT) private document: Document
    ) {}

    ngOnInit(): void {
        // Check auth state
        this.isLoggedIn = this.authService.isAuthenticated();
        this.isHostTenant = this.tenantService.getTenantType() === 'host';
        this.adminMemberId = this.route.snapshot.queryParamMap.get('adminMemberId') || '';

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

        // Use the root-singleton TenantSettingsService (already loaded by APP_INITIALIZER).
        // If for any reason settings aren't cached yet, loadSettings() returns the cached promise.
        const settingsPromise = this.tenantSettingsService.loadSettings().then((data: any) => {
            this.tenantSettings.set(data);
            const parsed = this.parseSettingsJson(data.settings ?? '{}');
            this._settings.set(parsed);
            this.isStaticSite = parsed.isStaticSite || false;
            // Preload any global footer widget types
            const globalFooterConfig = parsed.footerConfig || [];
            if (globalFooterConfig.length > 0) {
                this.preloadWidgets(globalFooterConfig);
            }
        });

        // Load custom pages for navigation using public navbar/footer endpoints
        const navbarPromise = new Promise<void>((resolve) => {
            this.customPagesService.navbar().subscribe({
                next: (response) => {
                    const pages = response?.result || [];
                    this.navbarPages.set(
                        pages.filter((p) => p.isActive && p.showInNavbar)
                            .sort((a, b) => ((a as any).navbarOrder || 999) - ((b as any).navbarOrder || 999))
                    );
                    resolve();
                },
                error: () => resolve()
            });
        });

        this.customPagesService.footer().subscribe((response) => {
            const pages = response?.result || [];
            this.footerPages = pages.filter((p) => p.isActive && p.showInFooter).sort((a, b) => ((a as any).footerOrder || 999) - ((b as any).footerOrder || 999));
        });

        // Load structured nav config (mega menu / submenu support)
        const navConfigPromise = new Promise<void>((resolve) => {
            this.navConfigService.get().subscribe({
                next: (config) => {
                    if (config?.items?.length) {
                        this.navConfig.set(config);
                    }
                    resolve();
                },
                error: () => resolve() // no config saved yet — fall back to navbarPages
            });
        });

        // Mark nav as ready once both navbar and navConfig calls have settled.
        // Store the promise so loadPage() can await it before revealing the page.
        this.navDataPromise = Promise.all([navbarPromise, navConfigPromise]).then(() => {
            this.navReady.set(true);
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
        this._cachedSortedFooterWidgets = null;
        this._widgetInputsCache.clear();
        // Remove any previously injected block CSS to prevent accumulation
        this.removeBlockCssTags();

        this.customPagesService.slug(slug).subscribe({
            next: (response) => {
                const page = response?.result || null;
                this.page.set(page);
                this.updateMetaTags(page);
                // Inject block-level custom CSS from the page content
                this.injectBlockCustomCss(page?.content ?? []);
                this.injectBlockCustomCss((page as any)?.footerContent ?? []);
                // Preload widget chunks AND await nav data (first load only).
                // This ensures the header never renders with empty menu or missing logo.
                Promise.all([
                    this.preloadWidgets([...(page?.content || []), ...((page as any)?.footerContent || [])]),
                    this.navDataPromise ?? Promise.resolve()
                ]).then(() => {
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
        const description = page.description || (page.metaTags as any)?.ogDescription || '';
        if (description) {
            this.metaService.updateTag({ name: 'description', content: description });
        }

        // Update Open Graph tags if meta tags are provided
        if (page.metaTags) {
            const ogTitle = page.metaTags.ogTitle || page.title || page.name || '';
            const s = this._settings();
            const ts = this.tenantSettings();
            const tenantName = s.siteTitle || s.title || ts.tenantName || 'Mizo';
            this.metaService.updateTag({ property: 'og:type',      content: 'website' });
            this.metaService.updateTag({ property: 'og:site_name', content: tenantName });
            this.metaService.updateTag({ property: 'og:title',     content: ogTitle });
            this.metaService.updateTag({ name: 'twitter:title',    content: ogTitle });
            if (page.metaTags.ogDescription) {
                this.metaService.updateTag({ property: 'og:description',     content: page.metaTags.ogDescription });
                this.metaService.updateTag({ name: 'twitter:description',    content: page.metaTags.ogDescription });
            }
            if (page.metaTags.ogImage) {
                this.metaService.updateTag({ property: 'og:image', content: page.metaTags.ogImage });
                this.metaService.updateTag({ name: 'twitter:image', content: page.metaTags.ogImage });
            }
            if (page.metaTags.keywords) {
                this.metaService.updateTag({ name: 'keywords', content: page.metaTags.keywords });
            }
        }

        // Canonical URL — use explicit value from page, or derive from current URL
        const canonical = (page as any).canonicalUrl || this.document.location.href.split('?')[0];
        this.updateCanonical(canonical);
        this.metaService.updateTag({ property: 'og:url', content: canonical });
    }

    private updateCanonical(url: string): void {
        let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            this.document.head.appendChild(link);
        }
        link.setAttribute('href', url);
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

    getSortedFooterWidgets(): any[] {
        const currentPage = this.page();
        if (!currentPage) return [];

        // Per-page override takes priority; fall back to global footer config from tenant settings
        const pageFooter: any[] = (currentPage as any)?.footerContent || [];
        const rawWidgets: any[] = pageFooter.length > 0 ? pageFooter : (this._settings().footerConfig || []);

        if (rawWidgets.length === 0) return [];

        if (this._cachedSortedFooterWidgets !== null) return this._cachedSortedFooterWidgets;

        this._cachedSortedFooterWidgets = rawWidgets
            .slice()
            .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            .map((w: any, index: number) => {
                const rawConfig = w.config;
                const settings =
                    rawConfig && typeof rawConfig === 'object' && rawConfig.settings
                        ? rawConfig.settings
                        : rawConfig ?? {};
                return {
                    id: w.id || w.Id || `fw-${index}`,
                    type: w.type || w.Type,
                    settings,
                    layout: rawConfig?.layout
                };
            });
        return this._cachedSortedFooterWidgets;
    }

    /** O(1) lookup — component types are resolved into the Map by preloadWidgets() */
    getWidgetComponent(widgetType: string): Type<any> | null {
        return this.componentCache.get(widgetType) ?? null;
    }

    // Stable reference cache — prevents ngComponentOutlet from triggering unnecessary
    // setInput / ngOnChanges on child widgets when the underlying values haven't changed.
    private _widgetInputsCache = new Map<string, Record<string, any>>();

    getWidgetInputs(widget: any): Record<string, any> {
        const widgetId = widget?.id || widget?.Id || '';
        const cacheKey = widgetId + '|' + (this.adminMemberId || '');
        let cached = this._widgetInputsCache.get(cacheKey);
        if (!cached) {
            cached = { config: widget };
            if (this.adminMemberId) {
                cached['adminMemberId'] = this.adminMemberId;
            }
            this._widgetInputsCache.set(cacheKey, cached);
        }
        return cached;
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
        return this.isHostTenant ? '/auth/tenant-register' : '/auth/register';
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

    // ─── Block-level custom CSS injection ──────────────────────

    /**
     * Removes all previously injected block-css-* style tags from <head>
     * to prevent stale styles from accumulating across page navigations.
     */
    private removeBlockCssTags(): void {
        const tags = this.document.querySelectorAll('style[id^="block-css-"]');
        tags.forEach((el) => el.remove());
    }

    /**
     * Walks the widget content array and injects <style> tags for any
     * block that has a customCss value in its BlockStyles.
     * Handles both the legacy flat format and the v3 __v3_document format.
     * Uses the same & → #block-{id} substitution as the builder canvas.
     */
    private injectBlockCustomCss(content: any[]): void {
        if (!content || !Array.isArray(content)) return;

        for (const widget of content) {
            const config = widget?.config;
            if (!config) continue;

            // v3 document format: walk sections → columns → blocks
            if (widget.type === '__v3_document' && config.sections) {
                for (const section of config.sections) {
                    for (const column of section.columns ?? []) {
                        for (const block of column.blocks ?? []) {
                            this.injectSingleBlockCss(block.id, block.blockStyles?.customCss);
                            // Recurse into child blocks (container widgets)
                            if (block.children?.length) {
                                this.walkChildBlocks(block.children);
                            }
                        }
                    }
                }
                continue;
            }

            // Legacy flat format: check blockStyles directly on the widget config
            // Some widgets store blockStyles at the top level of config
            if (config.blockStyles?.customCss) {
                this.injectSingleBlockCss(widget.id, config.blockStyles.customCss);
            }

            // Also check nested settings.blockStyles (alternative pattern)
            if (config.settings?.blockStyles?.customCss) {
                this.injectSingleBlockCss(widget.id, config.settings.blockStyles.customCss);
            }

            // Recurse into children
            if (config.children?.length) {
                this.walkChildBlocks(config.children);
            }
        }
    }

    /** Recursively walks child block arrays for nested container widgets. */
    private walkChildBlocks(children: any[]): void {
        if (!children || !Array.isArray(children)) return;
        for (const child of children) {
            if (child.blockStyles?.customCss) {
                this.injectSingleBlockCss(child.id, child.blockStyles.customCss);
            }
            if (child.children?.length) {
                this.walkChildBlocks(child.children);
            }
        }
    }

    /**
     * Creates or updates a <style id="block-css-{blockId}"> element.
     * Substitutes & with #block-{blockId} (same pattern as the builder canvas).
     */
    private injectSingleBlockCss(blockId: string, customCss?: string | null): void {
        if (!blockId || !customCss?.trim()) return;

        const styleId = `block-css-${blockId}`;
        const resolvedCss = customCss.replace(/&/g, `#block-${blockId}`);

        let styleEl = this.document.getElementById(styleId) as HTMLStyleElement | null;
        if (!styleEl) {
            styleEl = this.document.createElement('style') as HTMLStyleElement;
            styleEl.id = styleId;
            this.document.head.appendChild(styleEl);
        }
        styleEl.textContent = resolvedCss;
    }

    /**
     * Safely parses tenant settings JSON, handling base64-encoded values
     * from MySQL TO_BASE64().
     */
    private parseSettingsJson(raw: string): any {
        if (!raw) return {};
        if (/^\s*[{\[]/.test(raw)) {
            return JSON.parse(raw);
        }
        const cleaned = raw.replace(/[\n\r\s]/g, '');
        return JSON.parse(atob(cleaned));
    }
}
