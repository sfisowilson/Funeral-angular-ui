import { Dashboard } from './../../dashboard/dashboard';
import { Component, OnInit } from '@angular/core';
import { StyleClassModule } from 'primeng/styleclass';
import { Router, RouterModule } from '@angular/router';
import { RippleModule } from 'primeng/ripple';
import { ButtonModule } from 'primeng/button';
import { TenantSettingsService } from '../../../core/services/tenant-settings.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../auth/auth-service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'topbar-widget',
    imports: [RouterModule, StyleClassModule, ButtonModule, RippleModule, CommonModule],
    template: `<a class="flex items-center" href="#">
            <img [src]="logoUrl" class="h-12 mr-2" />
            <span class="text-surface-900 dark:text-surface-0 font-medium text-2xl leading-normal mr-20">{{ tenantName }}</span>
        </a>

        <a pButton [text]="true" severity="secondary" [rounded]="true" pRipple class="lg:!hidden" pStyleClass="@next" enterClass="hidden" leaveToClass="hidden" [hideOnOutsideClick]="true">
            <i class="pi pi-bars !text-2xl"></i>
        </a>

        <div class="items-center bg-surface-0 dark:bg-surface-900 grow justify-between hidden lg:flex absolute lg:static w-full left-0 top-full px-12 lg:px-0 z-20 rounded-border">
            <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row cursor-pointer gap-8">
                <li>
                    <a (click)="router.navigate(['/landing'], { fragment: 'home' })" pRipple class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                        <span>Home</span>
                    </a>
                </li>
                <li>
                    <a (click)="router.navigate(['/landing'], { fragment: 'features' })" pRipple class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                        <span>Features</span>
                    </a>
                </li>
                <li>
                    <a (click)="router.navigate(['/landing'], { fragment: 'highlights' })" pRipple class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                        <span>Highlights</span>
                    </a>
                </li>
                <li>
                    <a (click)="router.navigate(['/landing'], { fragment: 'pricing' })" pRipple class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                        <span>Pricing</span>
                    </a>
                </li>
                <li *ngIf="isLoggedIn">
                    <a (click)="router.navigate(['/admin'], { fragment: 'admin' })" pRipple class="px-0 py-4 text-surface-900 dark:text-surface-0 font-medium text-xl">
                        <span>Dashboard</span>
                    </a>
                </li>
            </ul>
            <div class="flex border-t lg:border-t-0 border-surface py-4 lg:py-0 mt-4 lg:mt-0 gap-2">
                <ng-container *ngIf="!isLoggedIn; else loggedInButtons">
                    <button pButton pRipple label="Login" routerLink="/auth/login" [rounded]="true" [text]="true"></button>
                    <button pButton pRipple label="Register" (click)="navigateToRegister()" [rounded]="true"></button>
                </ng-container>
                <ng-template #loggedInButtons>
                    <button pButton pRipple label="Logout" (click)="logout()" [rounded]="true"></button>
                </ng-template>
            </div>
        </div> `,
    standalone: true
})
export class TopbarWidget implements OnInit {
    logoUrl: string = '';
    tenantName: string = '';
    isLoggedIn: boolean = false;

    constructor(
        public router: Router,
        private tenantSettingsService: TenantSettingsService,
        private tenantService: TenantService,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        const settings = this.tenantSettingsService.getSettings();
        this.logoUrl = settings.logoUrl;
        this.tenantName = settings.tenantName;
        this.isLoggedIn = this.authService.isAuthenticated();
    }

    logout(): void {
        this.authService.logout();
        this.router.navigate(['/auth/login']);
    }

    getRegisterUrl(): string {
        return this.tenantService.getTenantType() === 'host' ? '/auth/tenant-register' : '/auth/register';
    }

    navigateToRegister(): void {
        this.router.navigateByUrl(this.getRegisterUrl());
    }
}
