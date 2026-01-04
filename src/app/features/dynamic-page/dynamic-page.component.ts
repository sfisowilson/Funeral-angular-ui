import { Component, OnInit, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomPagesServiceProxy, CustomPageDto, PageListItemDto, API_BASE_URL } from '../../core/services/service-proxies';
import { Meta, Title } from '@angular/platform-browser';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { WIDGET_TYPES } from '../../building-blocks/widget-registry';
import { AuthService } from '@app/auth/auth-service';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dynamic-page',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    RouterModule
  ],
  providers: [CustomPagesServiceProxy, TenantSettingsService],
  templateUrl: './dynamic-page.component.html',
  styleUrls: ['./dynamic-page.component.scss']
})
export class DynamicPageComponent implements OnInit {
  page = signal<CustomPageDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  currentYear = new Date().getFullYear();
  isLoggedIn = false;
  mobileMenuOpen = false;
  tenantSettings: any = {};
  _settings: any = {};
  isStaticSite = false;
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
    @Inject(API_BASE_URL) private baseUrl: string
  ) {}

  ngOnInit(): void {
    // Check auth state
    this.isLoggedIn = this.authService.isAuthenticated();
    
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
    
    // Load custom pages for navigation
    this.customPagesService.all().subscribe(pages => {
      this.navbarPages = pages
        .filter(p => p.isActive && p.showInNavbar)
        .sort((a, b) => ((a as any).navbarOrder || 999) - ((b as any).navbarOrder || 999));
      
      this.footerPages = pages
        .filter(p => p.isActive && p.showInFooter)
        .sort((a, b) => ((a as any).footerOrder || 999) - ((b as any).footerOrder || 999));
    });
    
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadPage(slug);
      }
    });
  }

  loadPage(slug: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.customPagesService.slug(slug).subscribe({
      next: (page) => {
        this.page.set(page);
        this.updateMetaTags(page);
        this.loading.set(false);
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
    const dbWidgets = this.page()?.content || [];
    // Transform from DB format { id, type, config, order } to WidgetConfig format { id, type, settings }
    return dbWidgets
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((w: any) => ({
        id: w.id,
        type: w.type,
        settings: w.config // DB stores 'config', WidgetConfig expects 'settings'
      }));
  }
  
  getWidgetComponent(widgetType: string): any {
    const widgetDefinition = WIDGET_TYPES.find(w => w.name === widgetType);
    return widgetDefinition?.component || null;
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
