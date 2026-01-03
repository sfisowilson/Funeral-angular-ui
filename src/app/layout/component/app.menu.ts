import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../auth/auth-service';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { CustomPagesServiceProxy } from '../../core/services/service-proxies';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    providers: [CustomPagesServiceProxy],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];
    isStaticSite = false;

    constructor(
        private authService: AuthService,
        private tenantSettingsService: TenantSettingsService,
        private customPagesService: CustomPagesServiceProxy
    ) {}

    async ngOnInit() {
        // Load tenant settings to check if this is a static site
        try {
            const settings = await this.tenantSettingsService.loadSettings();
            if (settings && settings.settings) {
                const parsedSettings = JSON.parse(settings.settings);
                this.isStaticSite = parsedSettings.isStaticSite || false;
            }
        } catch (error) {
            console.error('Error loading tenant settings:', error);
        }

        await this.buildMenu();
    }

    private async buildMenu() {
        // Load custom pages for navigation
        let customPageItems: MenuItem[] = [];
        try {
            const pages = await this.customPagesService.all().toPromise();
            if (pages) {
                customPageItems = pages
                    .filter((p: any) => p.isActive && p.showInNavbar)
                    .sort((a: any, b: any) => (a.navbarOrder || 999) - (b.navbarOrder || 999))
                    .map((p: any) => ({
                        label: p.name || p.slug,
                        icon: 'pi pi-fw pi-file',
                        routerLink: [`/${p.slug}`]
                    }));
            }
        } catch (error) {
            console.error('Error loading custom pages for menu:', error);
        }
        
        // If this is a static site, only show Landing Page and Tenant Settings (for theme, logo, CSS)
        if (this.isStaticSite) {
            this.model = [
                {
                    label: 'Website',
                    items: [
                        { 
                            label: 'Landing Page', 
                            icon: 'pi pi-fw pi-sitemap', 
                            routerLink: ['/admin/pages/page-builder'], 
                            visible: this.authService.isAuthenticated() 
                        },
                        { 
                            label: 'Tenant Settings', 
                            icon: 'pi pi-fw pi-cog', 
                            routerLink: ['/admin/pages/tenant-settings'], 
                            visible: this.authService.isAuthenticated() 
                        }
                    ]
                }
            ];
            return;
        }

        // Full menu for regular tenants
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Front Page', icon: 'pi pi-fw pi-home', routerLink: ['/'], visible: this.authService.isAuthenticated() },
                    { label: 'View Profile', icon: 'pi pi-fw pi-user', routerLink: ['/admin/pages/user-profile'], visible: this.authService.hasPermission('Permission.UserProfile.View') },
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/admin/dashboard'], visible: this.authService.isAuthenticated() },
                    { label: 'My Onboarding', icon: 'pi pi-fw pi-id-card', routerLink: ['/admin/member-onboarding'], queryParams: { view: 'true' }, visible: this.authService.hasRole('Member') }
                ]
            },
            {
                label: 'Assets',
                items: [
                    { label: 'Asset Management', icon: 'pi pi-fw pi-box', routerLink: ['/admin/pages/asset-management'], visible: this.authService.hasPermission('Permission.asset.view') }
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/pages'],
                items: [
                    { label: 'Tenants', icon: 'pi pi-fw pi-users', routerLink: ['/admin/pages/tenants'], visible: this.authService.hasPermission('Permission.tenant.view') },
                    { label: 'Tenant Settings', icon: 'pi pi-fw pi-cog', routerLink: ['/admin/pages/tenant-settings'], visible: this.authService.isAuthenticated() },
                    { label: 'Onboarding Settings', icon: 'pi pi-fw pi-id-card', routerLink: ['/admin/pages/onboarding-settings'], visible: this.authService.hasPermission('Permission.onboardingFieldConfiguration.view') },
                    { label: 'Dashboard Settings', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/admin/pages/dashboard-settings'], visible: this.authService.isAuthenticated() },
                    { label: 'PDF Field Mapping', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/pages/pdf-field-mapping'], visible: this.authService.isAuthenticated() },
                    { label: 'Member Approval', icon: 'pi pi-fw pi-check-circle', routerLink: ['/admin/pages/member-approval'], visible: this.authService.hasPermission('Permission.member.view') },
                    { label: 'Tenant Approval', icon: 'pi pi-fw pi-building', routerLink: ['/admin/pages/tenant-approval'], visible: this.authService.hasPermission('Permission.tenant.view') },
                    { label: 'Users', icon: 'pi pi-fw pi-user', routerLink: ['/admin/pages/users'], visible: this.authService.hasPermission('Permission.user.view') },
                    { label: 'Tenant Subscriptions', icon: 'pi pi-fw pi-credit-card', routerLink: ['/admin/pages/subscription-plans'], visible: this.authService.hasPermission('Permission.subscription.view') },
                    { label: 'Policies', icon: 'pi pi-fw pi-users', routerLink: ['/admin/pages/policies'], visible: this.authService.hasPermission('Permission.policy.view') },
                    { label: 'Roles', icon: 'pi pi-fw pi-users', routerLink: ['/admin/pages/roles'], visible: this.authService.hasPermission('Permission.role.view') },
                    { label: 'Tenant Type Permissions', icon: 'pi pi-key', routerLink: ['/admin/pages/tenant-type-permissions'], visible: this.authService.hasPermission('Permission.role.view') },
                    { label: 'Landing Page Generator', icon: 'pi pi-magic', routerLink: ['/admin/pages/landing-page-generator'], visible: this.authService.isAuthenticated() },
                    { label: 'Booking Management', icon: 'pi pi-calendar', routerLink: ['/admin/pages/booking-management'], visible: this.authService.isAuthenticated() },
                    { label: 'Member Management', icon: 'pi pi-users', routerLink: ['/admin/pages/member-management'], visible: this.authService.hasPermission('Permission.member.view') },
                    { label: 'Claims', icon: 'pi pi-fw pi-file', routerLink: ['/admin/pages/claims'], visible: this.authService.hasPermission('Permission.claim.view') },
                    { label: 'Funeral Events', icon: 'pi pi-fw pi-calendar', routerLink: ['/admin/pages/funeral-events'], visible: this.authService.hasPermission('Permission.funeralEvent.view') },
                    { label: 'Landing Page', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/pages/page-builder'], visible: this.authService.isAuthenticated() },
                    { label: 'Custom Pages', icon: 'pi pi-fw pi-file-edit', routerLink: ['/admin/custom-pages'], visible: this.authService.isAuthenticated() }
                ]
            },
            {
                label: 'Payments & Billing',
                icon: 'pi pi-fw pi-wallet',
                items: [
                    { label: 'Payment Gateway Config', icon: 'pi pi-fw pi-cog', routerLink: ['/admin/payment-config'], visible: this.authService.hasPermission('Permission.payment.config.view') },
                    { label: 'Payment Settings', icon: 'pi pi-fw pi-credit-card', routerLink: ['/admin/payment-settings'], visible: this.authService.hasPermission('Permission.payment.settings.view') },
                    { label: 'Coupons', icon: 'pi pi-fw pi-ticket', routerLink: ['/admin/pages/coupons'], visible: this.authService.hasPermission('Permission.coupon.view') },
                    { label: 'Debit Order Management', icon: 'pi pi-fw pi-file-export', routerLink: ['/admin/debit-orders'], visible: this.authService.hasPermission('Permission.debitorder.view') },
                    { label: 'Invoices', icon: 'pi pi-fw pi-money-bill', routerLink: ['/admin/invoices'], visible: this.authService.hasPermission('Permission.invoice.view') }
                ]
            },
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation',
                        icon: 'pi pi-fw pi-book',
                        visible: this.authService.isAuthenticated()
                    }
                ]
            }
        ];
    }
}
