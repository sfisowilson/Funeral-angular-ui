import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageListItemDto } from '@app/core/services/service-proxies';

@Component({
    selector: 'app-public-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
        <header class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="text-xl font-bold text-gray-800 flex items-center">
                    <img *ngIf="logoUrl" [src]="logoUrl" alt="Logo" class="mt-4 rounded-md" style="max-height: 70px" />
                    <span *ngIf="!logoUrl">{{ brandTitle }}</span>
                </div>
                <nav class="hidden md:flex space-x-6">
                    <a [routerLink]="homeLink" class="text-gray-600 hover:text-blue-600 transition">Home</a>
                    <a *ngFor="let page of navbarPages" [routerLink]="['/' + page.slug]" class="text-gray-600 hover:text-blue-600 transition">
                        {{ page.name }}
                    </a>
                    <ng-container *ngIf="!isStaticSite && !isLoggedIn">
                        <a [href]="registerUrl" class="text-blue-600 hover:underline font-semibold">Register</a>
                        <a [routerLink]="['/auth/login']" class="text-blue-600 hover:underline font-semibold">Login</a>
                    </ng-container>
                    <ng-container *ngIf="!isStaticSite && isLoggedIn">
                        <a [routerLink]="['/admin/dashboard']" class="text-gray-600 hover:text-blue-600 transition">Dashboard</a>
                        <button (click)="onLogoutClicked()" class="text-red-600 hover:underline font-semibold">Logout</button>
                    </ng-container>
                </nav>
                <button (click)="toggleMobileMenu()" class="md:hidden text-gray-600 focus:outline-none">
                    <svg *ngIf="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <svg *ngIf="mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav *ngIf="mobileMenuOpen" class="md:hidden bg-white border-t border-gray-200 shadow-lg">
                <div class="px-4 py-4 space-y-1">
                    <a [routerLink]="homeLink" class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded"> Home </a>
                    <ng-container *ngIf="showNavbarPagesOnMobile">
                        <a *ngFor="let page of navbarPages" [routerLink]="['/' + page.slug]" class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded">
                            {{ page.name }}
                        </a>
                    </ng-container>
                    <ng-container *ngIf="!isStaticSite && !isLoggedIn">
                        <a [href]="registerUrl" class="block px-3 py-3 text-blue-600 hover:bg-blue-50 font-semibold transition rounded"> Register </a>
                        <a [routerLink]="['/auth/login']" class="block px-3 py-3 text-blue-600 hover:bg-blue-50 font-semibold transition rounded"> Login </a>
                    </ng-container>
                    <ng-container *ngIf="!isStaticSite && isLoggedIn">
                        <a [routerLink]="['/admin/dashboard']" class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded"> Dashboard </a>
                        <button (click)="onLogoutClicked()" class="block w-full text-left px-3 py-3 text-red-600 hover:bg-red-50 font-semibold transition rounded">Logout</button>
                    </ng-container>
                </div>
            </nav>
        </header>
    `
})
export class PublicHeaderComponent {
    @Input() brandTitle = 'Mizo';
    @Input() logoUrl: string | null = null;
    @Input() navbarPages: PageListItemDto[] = [];
    @Input() isStaticSite = false;
    @Input() isLoggedIn = false;
    @Input() homeLink = '/';
    @Input() registerUrl = '/auth/register';
    @Input() showNavbarPagesOnMobile = true;

    @Output() logoutClicked = new EventEmitter<void>();

    mobileMenuOpen = false;

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    onLogoutClicked(): void {
        this.logoutClicked.emit();
        this.mobileMenuOpen = false;
    }
}
