import { Component, OnInit, ViewChild, ViewContainerRef, OnDestroy, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { WidgetService } from '@app/building-blocks/widget.service';
import { WidgetConfig } from '@app/building-blocks/widget-config';
import { WIDGET_TYPES } from '@app/building-blocks/widget-registry';
import { PageLayoutService } from '@app/building-blocks/page-layout.service';
import { ScrollRevealDirective } from '@app/building-blocks/scroll-reveal.directive';
import { Subscription } from 'rxjs';
import { AuthService } from '@app/auth/auth-service';
import { HttpHeaders } from '@angular/common/http';
import { TenantSettingServiceProxy, API_BASE_URL, TenantSettingDto } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { TenantService } from '../../core/services/tenant.service';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-landing-page-renderer',
    standalone: true,
    imports: [CommonModule, ScrollRevealDirective],
    providers: [TenantSettingsService],
    template: `
        <div class="flex flex-col min-h-screen">
            <!-- Header -->
            <header class="bg-white shadow-md">
                <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                
                    <div class="text-xl font-bold text-gray-800 d-flex items-center">
                        <img *ngIf="_settings.logo" [src]="getDownloadUrl(_settings.logo)" alt="Logo" class="mt-4 rounded-md" style="max-height: 70px" />
                        <span *ngIf="!_settings.logo"> {{_settings.siteTitle || _settings.title || tenantSettings?.tenantName || 'Mizo'}}</span>
                    </div>
                    <nav class="hidden md:flex space-x-6">
                        <a href="#" class="text-gray-600 hover:text-blue-600 transition">Home</a>
                        <ng-container *ngIf="!isStaticSite && !isLoggedIn">
                            <a [href]="getRegisterUrl()" class="text-blue-600 hover:underline font-semibold">Register</a>
                            <a href="/auth/login" class="text-blue-600 hover:underline font-semibold">Login</a>
                        </ng-container>

                        <ng-container *ngIf="!isStaticSite && isLoggedIn">
                            <a href="/admin/dashboard" class="text-gray-600 hover:text-blue-600 transition">Dashboard</a>
                            <button (click)="logout()" class="text-red-600 hover:underline font-semibold">Logout</button>
                        </ng-container>
                    </nav>
                    <button (click)="toggleMobileMenu()" class="md:hidden text-gray-600 focus:outline-none">
                        <!-- Mobile menu icon -->
                        <svg *ngIf="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <svg *ngIf="mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <!-- Mobile Menu -->
                <nav *ngIf="mobileMenuOpen" class="md:hidden bg-white border-t border-gray-200 shadow-lg">
                    <div class="px-4 py-4 space-y-1">
                        <a href="#" class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded">Home</a>
                        <ng-container *ngIf="!isStaticSite && !isLoggedIn">
                            <a [href]="getRegisterUrl()" class="block px-3 py-3 text-blue-600 hover:bg-blue-50 font-semibold transition rounded">Register</a>
                            <a href="/auth/login" class="block px-3 py-3 text-blue-600 hover:bg-blue-50 font-semibold transition rounded">Login</a>
                        </ng-container>
                        <ng-container *ngIf="!isStaticSite && isLoggedIn">
                            <a href="/admin/dashboard" class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded">Dashboard</a>
                            <button (click)="logout()" class="block w-full text-left px-3 py-3 text-red-600 hover:bg-red-50 font-semibold transition rounded">Logout</button>
                        </ng-container>
                    </div>
                </nav>
            </header>

            <!-- Main Content -->
            <main class="flex-1">
                <div class="landing-page-container">
                    <!-- Grid-based Layout for Normal Widgets -->
                    <div class="widget-grid" [ngStyle]="getGridStyles()">
                        <div 
                            *ngFor="let widget of normalWidgets"
                            class="widget-item"
                            [ngStyle]="getWidgetStyles(widget)"
                            [ngClass]="getWidgetClasses(widget)"
                            appScrollReveal>
                            <ng-container *ngComponentOutlet="getWidgetComponent(widget.type); inputs: { config: widget }">
                            </ng-container>
                        </div>
                    </div>
                </div>
            </main>

            <!-- Floating Widgets (rendered outside grid) -->
            <ng-container *ngFor="let widget of floatingWidgets">
                <ng-container *ngComponentOutlet="getWidgetComponent(widget.type); inputs: { config: widget }">
                </ng-container>
            </ng-container>

            <!-- Footer -->
            <footer class="bg-gray-100 mt-8">
                <div class="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-gray-600 text-sm">
                    <p>&copy; {{ currentYear }} Mizo. All rights reserved.</p>
                    <div class="mt-2 md:mt-0 space-x-4">
                        <a href="#" class="hover:text-blue-600">Privacy</a>
                        <a href="#" class="hover:text-blue-600">Terms</a>
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
        `
    ]
})
export class LandingPageRendererComponent implements OnInit, OnDestroy {
    widgets: WidgetConfig[] = [];
    private widgetSubscription!: Subscription;
    currentYear: number = new Date().getFullYear();
    isLoggedIn = false; // replace this with real auth state
    mobileMenuOpen = false;
    tenantIdHeader!: HttpHeaders;
    _settings: any = {};
    tenantSettings!: TenantSettingDto;
    isStaticSite = false;

    // Separate floating and normal widgets
    get normalWidgets(): WidgetConfig[] {
        return this.widgets.filter(widget => {
            const widgetType = WIDGET_TYPES.find(t => t.name === widget.type);
            return !widgetType?.floating;
        });
    }

    get floatingWidgets(): WidgetConfig[] {
        return this.widgets.filter(widget => {
            const widgetType = WIDGET_TYPES.find(t => t.name === widget.type);
            return widgetType?.floating === true;
        });
    }

    constructor(
        private widgetService: WidgetService,
        private tenantSettingService: TenantSettingsService,
        private tenantService: TenantService,
        private authService: AuthService,
        private titleService: Title,
        @Inject(API_BASE_URL) private baseUrl: string,
        private pageLayoutService: PageLayoutService
    ) {}

    ngOnInit(): void {

        this.tenantSettingService.loadSettings()
        .then((data: any) => {
            this.tenantSettings = data;
             this._settings = JSON.parse(this.tenantSettings.settings ?? "{}");
             this.isStaticSite = this._settings.isStaticSite || false;
             const tenantTitle = this._settings.siteTitle || this._settings.title || this.tenantSettings.tenantName || 'Mizo';
             console.log('Landing page - Setting document title to:', tenantTitle);
             this.titleService.setTitle(tenantTitle);
        });

        this.isLoggedIn = this.authService.isAuthenticated();
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
            this.widgets.forEach(widget => {
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
    }

    logout(): void {
        this.isLoggedIn = false;
        this.mobileMenuOpen = false;
        console.log('User logged out');
        this.authService.logout();
    }

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
        console.log('Mobile menu toggled:', this.mobileMenuOpen);
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
        const type = WIDGET_TYPES.find(t => t.name === widgetType);
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
