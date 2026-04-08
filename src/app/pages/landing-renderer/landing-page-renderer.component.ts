import { Component, OnInit, ViewChild, ViewContainerRef, OnDestroy, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WidgetService } from '@app/building-blocks/widget.service';
import { WidgetConfig } from '@app/building-blocks/widget-config';
import { WIDGET_TYPES } from '@app/building-blocks/widget-registry';
import { PageLayoutService } from '@app/building-blocks/page-layout.service';
import { ScrollRevealDirective } from '@app/building-blocks/scroll-reveal.directive';
import { Subscription } from 'rxjs';
import { AuthService } from '@app/auth/auth-service';
import { HttpHeaders } from '@angular/common/http';
import { TenantSettingServiceProxy, API_BASE_URL, TenantSettingDto, CustomPagesServiceProxy, PageListItemDto } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { TenantService } from '../../core/services/tenant.service';
import { PublicHeaderComponent } from '@app/shared/components/public-header/public-header.component';
import { NavConfigService } from '@app/core/services/nav-config.service';
import { NavConfigDto } from '@app/core/models/nav-config.model';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-landing-page-renderer',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective, RouterModule, PublicHeaderComponent],
    providers: [TenantSettingsService],
    template: `
        <div class="flex flex-col min-h-screen">
            <!-- Header -->
            <app-public-header
                [brandTitle]="_settings.siteTitle || _settings.title || tenantSettings?.tenantName || 'Mizo'"
                [logoUrl]="_settings.logo ? getDownloadUrl(_settings.logo) : null"
                [navbarPages]="navbarPages"
                [navConfig]="navConfig"
                [isLoggedIn]="isLoggedIn"
                [adminLink]="adminLink"
                [isStaticSite]="isStaticSite"
                [homeLink]="'/'"
                [registerUrl]="getRegisterUrl()"
                [showNavbarPagesOnMobile]="true"
                [darkTheme]="isHostTenant"
                (logoutClicked)="logout()"
            ></app-public-header>

            <!-- Main Content -->
            <main class="flex-1">
                <div class="landing-page-container">
                    <!-- Grid-based Layout for Normal Widgets -->
                    <div class="widget-grid" [ngStyle]="getGridStyles()">
                        <div *ngFor="let widget of normalWidgets" class="widget-item" [ngStyle]="getWidgetStyles(widget)" [ngClass]="getWidgetClasses(widget)" appScrollReveal>
                            <ng-container *ngComponentOutlet="getWidgetComponent(widget.type); inputs: { config: widget }"> </ng-container>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Floating Widgets (rendered outside grid) -->
            <ng-container *ngFor="let widget of floatingWidgets">
                <ng-container *ngComponentOutlet="getWidgetComponent(widget.type); inputs: { config: widget }"> </ng-container>
            </ng-container>

            <!-- Footer -->
            <footer [class]="isHostTenant ? 'bg-[#0a0820] border-t border-purple-900/40' : 'bg-gray-100 mt-8'">
                <div class="max-w-7xl mx-auto px-6 py-8">
                    <div *ngIf="isHostTenant" class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div class="md:col-span-2">
                            <p class="text-white font-bold text-lg mb-2">Mizo</p>
                            <p class="text-gray-400 text-sm max-w-xs">The complete platform for funeral service businesses. Professional website, member management, claims, and payments — all in one.</p>
                        </div>
                        <div>
                            <p class="text-white font-semibold text-sm mb-3">Platform</p>
                            <div class="space-y-2">
                                <a routerLink="/features" class="block text-gray-400 hover:text-purple-400 text-sm transition">Features</a>
                                <a routerLink="/pricing" class="block text-gray-400 hover:text-purple-400 text-sm transition">Pricing</a>
                                <a routerLink="/how-it-works" class="block text-gray-400 hover:text-purple-400 text-sm transition">How It Works</a>
                            </div>
                        </div>
                        <div>
                            <p class="text-white font-semibold text-sm mb-3">Company</p>
                            <div class="space-y-2">
                                <a routerLink="/contact" class="block text-gray-400 hover:text-purple-400 text-sm transition">Contact Us</a>
                                <a [href]="getRegisterUrl()" class="block text-gray-400 hover:text-purple-400 text-sm transition">Start Free Trial</a>
                                <a routerLink="/auth/login" class="block text-gray-400 hover:text-purple-400 text-sm transition">Login</a>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col md:flex-row justify-between items-center"
                         [class]="isHostTenant ? 'border-t border-purple-900/40 pt-6 text-gray-500 text-sm' : 'text-gray-600 text-sm'">
                        <p [class]="isHostTenant ? 'text-gray-500' : 'text-gray-600'">&copy; {{ currentYear }} Mizo. All rights reserved.</p>
                        <div class="mt-2 md:mt-0 space-x-4">
                            <a href="#" [class]="isHostTenant ? 'text-gray-500 hover:text-purple-400 transition' : 'hover:text-blue-600'">Privacy</a>
                            <a href="#" [class]="isHostTenant ? 'text-gray-500 hover:text-purple-400 transition' : 'hover:text-blue-600'">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    `,
    styles: [
        `
            @import '../../building-blocks/animations.scss';

            .landing-page-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 0;
            }

            .widget-grid {
                display: grid;
                width: 100%;
            }

            .widget-item {
                position: relative;
                overflow: hidden;
                /* The transition is now handled by the specific hover effect classes */
            }

            /* Responsive breakpoints */
            @media (max-width: 768px) {
                .hidden-mobile {
                    display: none !important;
                }
            }

            @media (min-width: 769px) and (max-width: 1024px) {
                .hidden-tablet {
                    display: none !important;
                }
            }

            @media (min-width: 1025px) {
                .hidden-desktop {
                    display: none !important;
                }
            }

            /* ── Mobile: collapse 12-column grid to single-column stack ── */
            @media (max-width: 576px) {
                .landing-page-container {
                    padding: 0 4px;
                }
                .widget-grid {
                    display: flex !important;
                    flex-direction: column !important;
                }
                .widget-item {
                    grid-column: unset !important;
                    width: 100% !important;
                    overflow: visible;
                }
            }
        `
    ]
})
export class LandingPageRendererComponent implements OnInit, OnDestroy {
    widgets: WidgetConfig[] = [];
    private widgetSubscription!: Subscription;
    private _jsonLdScript: HTMLScriptElement | null = null;
    currentYear: number = new Date().getFullYear();
    isLoggedIn = false; // replace this with real auth state
    adminLink = '/admin/dashboard';
    mobileMenuOpen = false;
    tenantIdHeader!: HttpHeaders;
    _settings: any = {};
    tenantSettings!: TenantSettingDto;
    isStaticSite = false;
    isHostTenant = false;
    navbarPages: PageListItemDto[] = [];
    navConfig: NavConfigDto | null = null;

    // Separate floating and normal widgets
    get normalWidgets(): WidgetConfig[] {
        return this.widgets.filter((widget) => {
            const widgetType = WIDGET_TYPES.find((t) => t.name === widget.type);
            return !widgetType?.floating;
        });
    }

    get floatingWidgets(): WidgetConfig[] {
        return this.widgets.filter((widget) => {
            const widgetType = WIDGET_TYPES.find((t) => t.name === widget.type);
            return widgetType?.floating === true;
        });
    }

    constructor(
        private widgetService: WidgetService,
        private tenantSettingService: TenantSettingsService,
        private tenantService: TenantService,
        private authService: AuthService,
        private router: Router,
        private titleService: Title,
        private metaService: Meta,
        @Inject(API_BASE_URL) private baseUrl: string,
        private pageLayoutService: PageLayoutService,
        private customPagesService: CustomPagesServiceProxy,
        private navConfigService: NavConfigService,
        @Inject(DOCUMENT) private document: Document
    ) {}

    ngOnInit(): void {
        this.tenantSettingService.loadSettings().then((data: any) => {
            this.tenantSettings = data;
            this._settings = JSON.parse(this.tenantSettings.settings ?? '{}');
            this.isStaticSite = this._settings.isStaticSite || false;
            const tenantTitle = this._settings.siteTitle || this._settings.title || this.tenantSettings.tenantName || 'Mizo';
            this.titleService.setTitle(tenantTitle + ' | All-in-One Business Platform');

            // Set meta description from tenant settings or fall back to default
            const siteDescription = this._settings.siteDescription ||
                'The complete platform for businesses — professional website, member management, claims and payments. Go live in minutes.';
            this.metaService.updateTag({ name: 'description', content: siteDescription });
            this.metaService.updateTag({ property: 'og:type',        content: 'website' });
            this.metaService.updateTag({ property: 'og:site_name',   content: tenantTitle });
            this.metaService.updateTag({ property: 'og:title',       content: tenantTitle });
            this.metaService.updateTag({ property: 'og:description', content: siteDescription });
            this.metaService.updateTag({ name: 'twitter:title',       content: tenantTitle });
            this.metaService.updateTag({ name: 'twitter:description', content: siteDescription });

            // Canonical: use actual origin so tenant subdomains & custom domains
            // get their own canonical URL instead of pointing at mizo.co.za.
            const canonicalUrl = this.document.location.origin + '/';
            this.updateCanonical(canonicalUrl);

            // og:url + og:image (use tenant logo if available)
            this.metaService.updateTag({ property: 'og:url', content: canonicalUrl });
            const logoUrl = this._settings.logoUrl || this._settings.logo || '';
            if (logoUrl) {
                this.metaService.updateTag({ property: 'og:image', content: logoUrl });
                this.metaService.updateTag({ name: 'twitter:image', content: logoUrl });
            }

            // Google Search Console verification (if tenant has code in settings)
            const verificationCode = this._settings.googleVerificationCode || '';
            if (verificationCode) {
                this.metaService.updateTag({ name: 'google-site-verification', content: verificationCode });
            }

            // JSON-LD Organization schema
            this.injectOrganizationSchema(tenantTitle, canonicalUrl, logoUrl);
        });

        this.isLoggedIn = this.authService.isAuthenticated();
        this.adminLink = this.authService.getFirstAccessibleAdminRoute();
        this.isHostTenant = this.tenantService.getTenantType() === 'host';

        this.customPagesService.slug('home').subscribe({
            next: (response) => {
                const homePage = response?.result;
                if (homePage?.isActive && this.router.url === '/') {
                    this.router.navigateByUrl('/home');
                }
            },
            error: () => {
                // no custom home page - keep landing page as default root
            }
        });

        // Load custom pages for navigation using the public navbar endpoint
        // (navbar() is AllowAnonymous - safe for unauthenticated public visitors)
        this.customPagesService.navbar().subscribe((response) => {
            const pages = response?.result || [];
            this.navbarPages = pages
                .filter((p: any) => p.isActive && p.showInNavbar)
                .sort((a: any, b: any) => (a.navbarOrder || 999) - (b.navbarOrder || 999));
        });

        // Load the structured nav config (mega menu / submenu support).
        // Falls back gracefully: if no config exists, navbarPages is used instead.
        this.navConfigService.get().subscribe({
            next: (config) => {
                if (config?.items?.length) {
                    this.navConfig = config;
                }
            },
            error: () => {
                // no nav config saved yet — public header will fall back to navbarPages
            }
        });

        // Use subdomain if present, otherwise use hostSubdomain from environment
        const host = window.location.hostname;
        const subdomain = host.split('.')[0];
        let tenantId = '';
        if (subdomain && subdomain !== 'www' && subdomain !== environment.baseDomain.split('.')[0]) {
            tenantId = subdomain;
        } else {
            // fallback to hostSubdomain from environment file
            tenantId = environment.hostSubdomain;
        }
        this.tenantIdHeader = new HttpHeaders().set('X-Tenant-ID', tenantId);

        this.widgetSubscription = this.widgetService.widgets$.subscribe((widgets: WidgetConfig[]) => {
            this.widgets = widgets;
            // Initialize layout for widgets that don't have one
            this.widgets.forEach((widget) => {
                if (!widget.layout) {
                    this.pageLayoutService.initializeWidgetLayout(widget);
                }
            });
        });
    }

    ngOnDestroy(): void {
        if (this.widgetSubscription) {
            this.widgetSubscription.unsubscribe();
        }
        if (this._jsonLdScript) {
            this._jsonLdScript.remove();
            this._jsonLdScript = null;
        }
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

    private injectOrganizationSchema(name: string, url: string, logoUrl: string): void {
        if (this._jsonLdScript) {
            this._jsonLdScript.remove();
        }
        const schema: any = {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name,
            url
        };
        if (logoUrl) {
            schema.logo = logoUrl;
        }
        const script = this.document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schema);
        this.document.head.appendChild(script);
        this._jsonLdScript = script;
    }

    logout(): void {
        this.isLoggedIn = false;
        this.mobileMenuOpen = false;
        this.authService.logout();
    }

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    getGridStyles(): any {
        return this.pageLayoutService.getContainerGridStyles();
    }

    getWidgetStyles(widget: WidgetConfig): any {
        const baseStyles = this.pageLayoutService.calculateGridStyles(widget);
        const layout = widget.layout;

        // Add animation CSS variables if animations enabled
        if (layout?.animationEnabled && layout.animationType !== 'none') {
            return {
                ...baseStyles,
                '--animation-duration': `${layout.animationDuration || 600}ms`,
                '--animation-delay': `${layout.animationDelay || 0}ms`,
                '--animation-easing': layout.animationEasing || 'ease'
            };
        }

        return baseStyles;
    }

    getWidgetClasses(widget: WidgetConfig): string[] {
        const classes = this.pageLayoutService.getResponsiveClasses(widget);
        const layout = widget.layout;

        // Add animation classes
        if (layout?.animationEnabled && layout.animationType && layout.animationType !== 'none') {
            classes.push('widget-animated');
            classes.push(`animate-${layout.animationType}`);
        } else {
            classes.push('no-animation');
        }

        // Add hover effect classes
        const hoverEffect = layout?.hoverEffect || 'lift';
        if (hoverEffect !== 'none') {
            classes.push(`widget-hover-${hoverEffect}`);
        }

        return classes;
    }

    getResponsiveClasses(widget: WidgetConfig): string[] {
        return this.pageLayoutService.getResponsiveClasses(widget);
    }

    getWidgetComponent(widgetType: string): any {
        const type = WIDGET_TYPES.find((t) => t.name === widgetType);
        return type?.component;
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

    getRegisterUrl(): string {
        return this.tenantService.getTenantType() === 'host' ? '/auth/tenant-register' : '/auth/register';
    }
}
