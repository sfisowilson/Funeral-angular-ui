import { Component, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { AuthService } from '../../auth/auth-service';
import { MenuModule } from 'primeng/menu';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { TenantSettingDto, UserProfileServiceProxy, UserProfileDto } from '../../core/services/service-proxies';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator, MenuModule],
    providers: [LayoutService, AuthService, TenantSettingsService, UserProfileServiceProxy],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo" routerLink="/">
                <img *ngIf="tenantLogoUrl" [src]="tenantLogoUrl" alt="Tenant Logo" style="max-height: 40px;" />
                <span *ngIf="!tenantLogoUrl">{{ userProfile.firstName }} {{ userProfile.lastName }}</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu" *ngIf="false">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action" *ngIf="false">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action" *ngIf="false">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>
                    <button type="button" class="layout-topbar-action" *ngIf="isAuthenticated" (click)="menu.toggle($event)">
                        <i class="pi pi-user"></i>
                        <span>Profile</span>
                    </button>
                    <p-menu #menu [model]="items" [popup]="true"></p-menu>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar implements OnInit {
    @Input() isHostTenant: boolean = false;
    items!: MenuItem[];
    tenantLogoUrl: string | undefined;
    userProfile: UserProfileDto = new UserProfileDto();

    constructor(
        public layoutService: LayoutService,
        private authService: AuthService,
        private router: Router,
        private tenantSettingsService: TenantSettingsService,
        private userProfileService: UserProfileServiceProxy
    ) {
        this.items = [
            {
                label: 'Profile',
                icon: 'pi pi-user',
                command: () => {
                    this.viewProfile();
                }
            },
            {
                label: 'Settings',
                icon: 'pi pi-cog',
                command: () => {
                    this.viewSettings();
                }
            },
            {
                label: 'Logout',
                icon: 'pi pi-sign-out',
                command: () => {
                    this.logout();
                }
            }
        ];
    }

    ngOnInit(): void {
        this.tenantSettingsService
            .loadSettings()
            .then((settings: TenantSettingDto) => {
                let tenantSettings = { logo: '' };
                tenantSettings = JSON.parse(settings.settings || '{}');
                if (tenantSettings.logo) {
                    this.tenantLogoUrl = this.tenantSettingsService.getDownloadUrl(tenantSettings.logo);
                }
            })
            .catch((error) => {
                console.error('Error loading tenant settings for topbar:', error);
            });

        this.userProfileService.userProfile_GetCurrentUserProfile().subscribe((profile) => {
            this.userProfile = profile;
        });
    }

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    get isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    logout() {
        this.authService.removeToken();
        this.router.navigate(['/auth/login']);
    }

    viewProfile() {
        this.router.navigate(['/admin/pages/user-profile']);
    }

    viewSettings() {
        this.router.navigate(['/admin/pages/tenant-settings']);
    }
}
