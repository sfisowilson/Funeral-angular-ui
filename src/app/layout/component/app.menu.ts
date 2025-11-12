import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../auth/auth-service';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];

    constructor(private authService: AuthService) {}

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [
                    { label: 'Front Page', icon: 'pi pi-fw pi-home', routerLink: ['/'], visible: this.authService.isAuthenticated() },
                    { label: 'View Profile', icon: 'pi pi-fw pi-user', routerLink: ['/admin/pages/user-profile'], visible: this.authService.isAuthenticated() },
                    { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/admin/dashboard'], visible: this.authService.isAuthenticated() },
                    { label: 'My Onboarding', icon: 'pi pi-fw pi-id-card', routerLink: ['/admin/member-onboarding'], queryParams: { view: 'true' }, visible: this.authService.hasRole('Member') }
                ]
            },
            {
                label: 'Assets',
                items: [
                    { label: 'Asset Management', icon: 'pi pi-fw pi-box', routerLink: ['/admin/pages/asset-management'] },
                    // { label: 'Categories', icon: 'pi pi-fw pi-tags', routerLink: ['/pages/asset-categories'] },
                    // { label: 'Statuses', icon: 'pi pi-fw pi-check-square', routerLink: ['/pages/asset-statuses'] }
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/pages'],
                items: [
                    { label: 'Tenants', icon: 'pi pi-fw pi-users', routerLink: ['/admin/pages/tenants'], visible: this.authService.hasPermission('Permission.tenant.view') },
                    { label: 'Tenant Settings', icon: 'pi pi-fw pi-cog', routerLink: ['/admin/pages/tenant-settings'] },
                    { label: 'Onboarding Settings', icon: 'pi pi-fw pi-id-card', routerLink: ['/admin/pages/onboarding-settings'] },
                    { label: 'Dashboard Settings', icon: 'pi pi-fw pi-sliders-h', routerLink: ['/admin/pages/dashboard-settings'] },
                    { label: 'Users', icon: 'pi pi-fw pi-user', routerLink: ['/admin/pages/users'] },
                    { label: 'Tenant Subscriptions', icon: 'pi pi-fw pi-credit-card', routerLink: ['/admin/pages/subscription-plans'], visible: this.authService.hasPermission('Permission.subscription.view') },
                    { label: 'Policies', icon: 'pi pi-fw pi-users', routerLink: ['/admin/pages/policies'] },
                    { label: 'Roles', icon: 'pi pi-fw pi-users', routerLink: ['/admin/pages/roles'] },
                    { label: 'Member Management', icon: 'pi pi-fw pi-users', routerLink: ['/admin/pages/member-management'] },
                    { label: 'Claims', icon: 'pi pi-fw pi-file', routerLink: ['/admin/pages/claims'] },
                    // { label: 'Dependents', icon: 'pi pi-fw pi-user-plus', routerLink: ['/admin/pages/dependents'] },
                    { label: 'Funeral Events', icon: 'pi pi-fw pi-calendar', routerLink: ['/admin/pages/funeral-events'] },
                    { label: 'Landing Page', icon: 'pi pi-fw pi-sitemap', routerLink: ['/admin/pages/page-builder'] },
                    // {
                    //     label: 'Auth',
                    //     icon: 'pi pi-fw pi-user',
                    //     items: [
                    //         {
                    //             label: 'Login',
                    //             icon: 'pi pi-fw pi-sign-in',
                    //             routerLink: ['/auth/login']
                    //         },
                    //         {
                    //             label: 'Error',
                    //             icon: 'pi pi-fw pi-times-circle',
                    //             routerLink: ['/auth/error']
                    //         },
                    //         {
                    //             label: 'Access Denied',
                    //             icon: 'pi pi-fw pi-lock',
                    //             routerLink: ['/auth/access']
                    //         }
                    //     ]
                    // },
                    // {
                    //     label: 'Not Found',
                    //     icon: 'pi pi-fw pi-exclamation-circle',
                    //     routerLink: ['/pages/notfound']
                    // }
                ]
            },
            // {
            //     label: 'Hierarchy',
            //     items: [
            //         {
            //             label: 'Submenu 1',
            //             icon: 'pi pi-fw pi-bookmark',
            //             items: [
            //                 {
            //                     label: 'Submenu 1.1',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [
            //                         { label: 'Submenu 1.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 1.1.2', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 1.1.3', icon: 'pi pi-fw pi-bookmark' }
            //                     ]
            //                 },
            //                 {
            //                     label: 'Submenu 1.2',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [{ label: 'Submenu 1.2.1', icon: 'pi pi-fw pi-bookmark' }]
            //                 }
            //             ]
            //         },
            //         {
            //             label: 'Submenu 2',
            //             icon: 'pi pi-fw pi-bookmark',
            //             items: [
            //                 {
            //                     label: 'Submenu 2.1',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [
            //                         { label: 'Submenu 2.1.1', icon: 'pi pi-fw pi-bookmark' },
            //                         { label: 'Submenu 2.1.2', icon: 'pi pi-fw pi-bookmark' }
            //                     ]
            //                 },
            //                 {
            //                     label: 'Submenu 2.2',
            //                     icon: 'pi pi-fw pi-bookmark',
            //                     items: [{ label: 'Submenu 2.2.1', icon: 'pi pi-fw pi-bookmark' }]
            //                 }
            //             ]
            //         }
            //     ]
            // },
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation',
                        icon: 'pi pi-fw pi-book'
                    },
                    // {
                    //     label: 'View Source',
                    //     icon: 'pi pi-fw pi-github',
                    //     url: 'https://github.com/primefaces/sakai-ng',
                    //     target: '_blank'
                    // }
                ]
            }
        ];
    }
}
