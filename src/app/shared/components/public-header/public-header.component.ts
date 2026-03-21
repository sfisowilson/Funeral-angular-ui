import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageListItemDto } from '@app/core/services/service-proxies';
import { NavConfigDto, NavItem } from '@app/core/models/nav-config.model';

/** Convert a flat PageListItemDto into a plain NavItem link */
function pageToNavItem(page: PageListItemDto, index: number): NavItem {
    return {
        id: page.id,
        label: page.name ?? page.slug ?? '',
        type: 'link',
        slug: page.slug,
        order: index,
        children: [],
        megaColumns: []
    };
}

@Component({
    selector: 'app-public-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    styles: [`
        /* Keep dropdown menus visible while the user moves the cursor into them */
        .nav-group:hover .nav-dropdown,
        .nav-dropdown:hover {
            display: block;
        }

        /* Invisible bridge fills the gap between the trigger and the panel so the
           hover state is not broken when the cursor crosses the mt-2 margin. */
        .nav-group .nav-dropdown::before {
            content: '';
            position: absolute;
            top: -8px;
            left: 0;
            right: 0;
            height: 8px;
        }
    `],
    template: `
        <!-- Dark marketing theme (host tenant) -->
        <header *ngIf="darkTheme" class="sticky top-0 z-50 bg-[#0a0820] border-b border-purple-900/40 shadow-lg backdrop-blur-sm">
            <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <a [routerLink]="homeLink" class="flex items-center gap-2 no-underline">
                    <img *ngIf="logoUrl" [src]="logoUrl" alt="Logo" class="rounded-md" style="max-height: 48px" />
                    <span *ngIf="!logoUrl" class="text-xl font-bold text-white tracking-tight">{{ brandTitle }}</span>
                </a>
                <!-- Desktop nav (dark) -->
                <nav class="hidden md:flex items-center gap-7">
                    <a *ngIf="showFixedHomeLink" [routerLink]="homeLink" class="text-gray-300 hover:text-purple-400 transition text-sm font-medium">Home</a>

                    <ng-container *ngFor="let item of resolvedItems">
                        <!-- Plain link -->
                        <ng-container *ngIf="item.type === 'link'">
                            <a *ngIf="!item.url; else extDark" [routerLink]="['/' + item.slug]"
                               class="text-gray-300 hover:text-purple-400 transition text-sm font-medium">{{ item.label }}</a>
                            <ng-template #extDark>
                                <a [href]="safeUrl(item.url)" target="_blank" rel="noopener noreferrer"
                                   class="text-gray-300 hover:text-purple-400 transition text-sm font-medium">{{ item.label }}</a>
                            </ng-template>
                        </ng-container>

                        <!-- Dropdown -->
                        <div *ngIf="item.type === 'dropdown'" class="relative nav-group">
                            <button class="flex items-center gap-1 text-gray-300 hover:text-purple-400 transition text-sm font-medium cursor-pointer bg-transparent border-none p-0">
                                {{ item.label }}
                                <svg class="w-3 h-3 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div class="nav-dropdown hidden absolute left-0 top-full mt-2 min-w-[200px] bg-[#0d0a24] border border-purple-900/40 rounded-lg shadow-xl py-1 z-50">
                                <ng-container *ngFor="let child of item.children">
                                    <a *ngIf="!child.url; else childExtDark" [routerLink]="['/' + child.slug]"
                                       class="block px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 transition">{{ child.label }}</a>
                                    <ng-template #childExtDark>
                                        <a [href]="safeUrl(child.url)" target="_blank" rel="noopener noreferrer"
                                           class="block px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 transition">{{ child.label }}</a>
                                    </ng-template>
                                </ng-container>
                            </div>
                        </div>

                        <!-- Mega menu -->
                        <div *ngIf="item.type === 'mega'" class="relative nav-group">
                            <button class="flex items-center gap-1 text-gray-300 hover:text-purple-400 transition text-sm font-medium cursor-pointer bg-transparent border-none p-0">
                                {{ item.label }}
                                <svg class="w-3 h-3 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div class="nav-dropdown hidden absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-[#0d0a24] border border-purple-900/40 rounded-xl shadow-2xl py-6 px-6 z-50"
                                 [style.width]="getMegaWidth(item)">
                                <div class="grid gap-8" [style.grid-template-columns]="'repeat(' + (item.megaColumns?.length || 1) + ', 1fr)'">
                                    <div *ngFor="let col of item.megaColumns">
                                        <p *ngIf="col.header" class="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">{{ col.header }}</p>
                                        <div class="space-y-1">
                                            <ng-container *ngFor="let link of col.items">
                                                <a *ngIf="!link.url; else colExtDark" [routerLink]="['/' + link.slug]"
                                                   class="block py-1.5 text-sm text-gray-300 hover:text-purple-300 transition">{{ link.label }}</a>
                                                <ng-template #colExtDark>
                                                    <a [href]="safeUrl(link.url)" target="_blank" rel="noopener noreferrer"
                                                       class="block py-1.5 text-sm text-gray-300 hover:text-purple-300 transition">{{ link.label }}</a>
                                                </ng-template>
                                            </ng-container>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ng-container>

                    <ng-container *ngIf="!isStaticSite && !isLoggedIn">
                        <a [routerLink]="['/auth/login']" class="text-gray-300 hover:text-white transition text-sm font-medium">Login</a>
                        <a [href]="registerUrl"
                           class="bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2 rounded-full transition">
                            Start Free Trial
                        </a>
                    </ng-container>
                    <ng-container *ngIf="!isStaticSite && isLoggedIn">
                        <a [routerLink]="['/admin/dashboard']" class="text-gray-300 hover:text-purple-400 transition text-sm font-medium">Dashboard</a>
                        <button (click)="onLogoutClicked()" class="text-red-400 hover:text-red-300 text-sm font-semibold transition">Logout</button>
                    </ng-container>
                </nav>
                <button (click)="toggleMobileMenu()" class="md:hidden text-gray-300 focus:outline-none">
                    <svg *ngIf="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <svg *ngIf="mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <!-- Mobile menu (dark) -->
            <nav *ngIf="mobileMenuOpen" class="md:hidden bg-[#0a0820] border-t border-purple-900/40">
                <div class="px-4 py-4 space-y-1">
                    <a *ngIf="showFixedHomeLink" [routerLink]="homeLink" class="block px-3 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 rounded transition">Home</a>
                    <ng-container *ngIf="showNavbarPagesOnMobile">
                        <ng-container *ngFor="let item of resolvedItems">
                            <ng-container *ngIf="item.type === 'link'">
                                <a *ngIf="!item.url; else mExtDark" [routerLink]="['/' + item.slug]" (click)="mobileMenuOpen = false"
                                   class="block px-3 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 rounded transition">{{ item.label }}</a>
                                <ng-template #mExtDark>
                                    <a [href]="safeUrl(item.url)" target="_blank" rel="noopener noreferrer"
                                       class="block px-3 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 rounded transition">{{ item.label }}</a>
                                </ng-template>
                            </ng-container>
                            <ng-container *ngIf="item.type === 'dropdown'">
                                <p class="px-3 pt-3 pb-1 text-xs font-semibold text-purple-400 uppercase tracking-wide">{{ item.label }}</p>
                                <ng-container *ngFor="let child of item.children">
                                    <a *ngIf="!child.url; else mChildExtDark" [routerLink]="['/' + child.slug]" (click)="mobileMenuOpen = false"
                                       class="block px-6 py-2 text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 rounded transition text-sm">{{ child.label }}</a>
                                    <ng-template #mChildExtDark>
                                        <a [href]="safeUrl(child.url)" target="_blank" rel="noopener noreferrer"
                                           class="block px-6 py-2 text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 rounded transition text-sm">{{ child.label }}</a>
                                    </ng-template>
                                </ng-container>
                            </ng-container>
                            <ng-container *ngIf="item.type === 'mega'">
                                <p class="px-3 pt-3 pb-1 text-xs font-semibold text-purple-400 uppercase tracking-wide">{{ item.label }}</p>
                                <ng-container *ngFor="let col of item.megaColumns">
                                    <p *ngIf="col.header" class="px-6 pt-2 pb-0.5 text-xs text-purple-500 font-medium">{{ col.header }}</p>
                                    <ng-container *ngFor="let link of col.items">
                                        <a *ngIf="!link.url; else mColExtDark" [routerLink]="['/' + link.slug]" (click)="mobileMenuOpen = false"
                                           class="block px-8 py-2 text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 rounded transition text-sm">{{ link.label }}</a>
                                        <ng-template #mColExtDark>
                                            <a [href]="safeUrl(link.url)" target="_blank" rel="noopener noreferrer"
                                               class="block px-8 py-2 text-gray-300 hover:bg-purple-900/30 hover:text-purple-300 rounded transition text-sm">{{ link.label }}</a>
                                        </ng-template>
                                    </ng-container>
                                </ng-container>
                            </ng-container>
                        </ng-container>
                    </ng-container>
                    <ng-container *ngIf="!isStaticSite && !isLoggedIn">
                        <a [routerLink]="['/auth/login']" class="block px-3 py-3 text-gray-300 hover:bg-purple-900/30 rounded transition">Login</a>
                        <a [href]="registerUrl" class="block px-3 py-3 text-purple-300 font-semibold hover:bg-purple-900/40 rounded transition">Start Free Trial</a>
                    </ng-container>
                    <ng-container *ngIf="!isStaticSite && isLoggedIn">
                        <a [routerLink]="['/admin/dashboard']" class="block px-3 py-3 text-gray-300 hover:bg-purple-900/30 rounded transition">Dashboard</a>
                        <button (click)="onLogoutClicked()" class="block w-full text-left px-3 py-3 text-red-400 hover:bg-red-900/20 rounded transition">Logout</button>
                    </ng-container>
                </div>
            </nav>
        </header>

        <!-- Light default theme (regular tenants) -->
        <header *ngIf="!darkTheme" class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <div class="text-xl font-bold text-gray-800 flex items-center">
                    <img *ngIf="logoUrl" [src]="logoUrl" alt="Logo" class="mt-4 rounded-md" style="max-height: 70px" />
                    <span *ngIf="!logoUrl">{{ brandTitle }}</span>
                </div>
                <!-- Desktop nav (light) -->
                <nav class="hidden md:flex space-x-6 items-center">
                    <a *ngIf="showFixedHomeLink" [routerLink]="homeLink" class="text-gray-600 hover:text-blue-600 transition">Home</a>

                    <ng-container *ngFor="let item of resolvedItems">
                        <ng-container *ngIf="item.type === 'link'">
                            <a *ngIf="!item.url; else extLight" [routerLink]="['/' + item.slug]" class="text-gray-600 hover:text-blue-600 transition">{{ item.label }}</a>
                            <ng-template #extLight>
                                <a [href]="safeUrl(item.url)" target="_blank" rel="noopener noreferrer" class="text-gray-600 hover:text-blue-600 transition">{{ item.label }}</a>
                            </ng-template>
                        </ng-container>

                        <!-- Dropdown -->
                        <div *ngIf="item.type === 'dropdown'" class="relative nav-group">
                            <button class="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition cursor-pointer bg-transparent border-none p-0 text-base">
                                {{ item.label }}
                                <svg class="w-3 h-3 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div class="nav-dropdown hidden absolute left-0 top-full mt-2 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                                <ng-container *ngFor="let child of item.children">
                                    <a *ngIf="!child.url; else childExtLight" [routerLink]="['/' + child.slug]"
                                       class="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition">{{ child.label }}</a>
                                    <ng-template #childExtLight>
                                        <a [href]="safeUrl(child.url)" target="_blank" rel="noopener noreferrer"
                                           class="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition">{{ child.label }}</a>
                                    </ng-template>
                                </ng-container>
                            </div>
                        </div>

                        <!-- Mega menu -->
                        <div *ngIf="item.type === 'mega'" class="relative nav-group">
                            <button class="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition cursor-pointer bg-transparent border-none p-0 text-base">
                                {{ item.label }}
                                <svg class="w-3 h-3 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div class="nav-dropdown hidden absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl py-6 px-6 z-50"
                                 [style.width]="getMegaWidth(item)">
                                <div class="grid gap-8" [style.grid-template-columns]="'repeat(' + (item.megaColumns?.length || 1) + ', 1fr)'">
                                    <div *ngFor="let col of item.megaColumns">
                                        <p *ngIf="col.header" class="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-3">{{ col.header }}</p>
                                        <div class="space-y-1">
                                            <ng-container *ngFor="let link of col.items">
                                                <a *ngIf="!link.url; else colExtLight" [routerLink]="['/' + link.slug]"
                                                   class="block py-1.5 text-sm text-gray-600 hover:text-blue-600 transition">{{ link.label }}</a>
                                                <ng-template #colExtLight>
                                                    <a [href]="safeUrl(link.url)" target="_blank" rel="noopener noreferrer"
                                                       class="block py-1.5 text-sm text-gray-600 hover:text-blue-600 transition">{{ link.label }}</a>
                                                </ng-template>
                                            </ng-container>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ng-container>

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

            <!-- Mobile menu (light) -->
            <nav *ngIf="mobileMenuOpen" class="md:hidden bg-white border-t border-gray-200 shadow-lg">
                <div class="px-4 py-4 space-y-1">
                    <a *ngIf="showFixedHomeLink" [routerLink]="homeLink" class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded">Home</a>
                    <ng-container *ngIf="showNavbarPagesOnMobile">
                        <ng-container *ngFor="let item of resolvedItems">
                            <ng-container *ngIf="item.type === 'link'">
                                <a *ngIf="!item.url; else mExtLight" [routerLink]="['/' + item.slug]" (click)="mobileMenuOpen = false"
                                   class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded">{{ item.label }}</a>
                                <ng-template #mExtLight>
                                    <a [href]="safeUrl(item.url)" target="_blank" rel="noopener noreferrer"
                                       class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded">{{ item.label }}</a>
                                </ng-template>
                            </ng-container>
                            <ng-container *ngIf="item.type === 'dropdown'">
                                <p class="px-3 pt-3 pb-1 text-xs font-semibold text-blue-600 uppercase tracking-wide">{{ item.label }}</p>
                                <ng-container *ngFor="let child of item.children">
                                    <a *ngIf="!child.url; else mChildExtLight" [routerLink]="['/' + child.slug]" (click)="mobileMenuOpen = false"
                                       class="block px-6 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded text-sm">{{ child.label }}</a>
                                    <ng-template #mChildExtLight>
                                        <a [href]="safeUrl(child.url)" target="_blank" rel="noopener noreferrer"
                                           class="block px-6 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded text-sm">{{ child.label }}</a>
                                    </ng-template>
                                </ng-container>
                            </ng-container>
                            <ng-container *ngIf="item.type === 'mega'">
                                <p class="px-3 pt-3 pb-1 text-xs font-semibold text-blue-600 uppercase tracking-wide">{{ item.label }}</p>
                                <ng-container *ngFor="let col of item.megaColumns">
                                    <p *ngIf="col.header" class="px-6 pt-2 pb-0.5 text-xs text-gray-400 font-medium">{{ col.header }}</p>
                                    <ng-container *ngFor="let link of col.items">
                                        <a *ngIf="!link.url; else mColExtLight" [routerLink]="['/' + link.slug]" (click)="mobileMenuOpen = false"
                                           class="block px-8 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded text-sm">{{ link.label }}</a>
                                        <ng-template #mColExtLight>
                                            <a [href]="safeUrl(link.url)" target="_blank" rel="noopener noreferrer"
                                               class="block px-8 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded text-sm">{{ link.label }}</a>
                                        </ng-template>
                                    </ng-container>
                                </ng-container>
                            </ng-container>
                        </ng-container>
                    </ng-container>
                    <ng-container *ngIf="!isStaticSite && !isLoggedIn">
                        <a [href]="registerUrl" class="block px-3 py-3 text-blue-600 hover:bg-blue-50 font-semibold transition rounded">Register</a>
                        <a [routerLink]="['/auth/login']" class="block px-3 py-3 text-blue-600 hover:bg-blue-50 font-semibold transition rounded">Login</a>
                    </ng-container>
                    <ng-container *ngIf="!isStaticSite && isLoggedIn">
                        <a [routerLink]="['/admin/dashboard']" class="block px-3 py-3 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition rounded">Dashboard</a>
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
    /** When set, overrides navbarPages with the structured nav config (supports dropdowns & mega menus). */
    @Input() navConfig: NavConfigDto | null = null;
    @Input() isStaticSite = false;
    @Input() isLoggedIn = false;
    @Input() homeLink = '/';
    @Input() registerUrl = '/auth/register';
    @Input() showNavbarPagesOnMobile = true;
    @Input() hideHomeWhenNavbarHasHome = true;
    @Input() darkTheme = false;

    @Output() logoutClicked = new EventEmitter<void>();

    mobileMenuOpen = false;

    /**
     * Returns the items to render in the nav.
     * If a navConfig is provided and has items, use those; otherwise fall back
     * to the flat navbarPages list converted to simple link items.
     */
    get resolvedItems(): NavItem[] {
        if (this.navConfig?.items?.length) {
            return [...this.navConfig.items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }
        return this.navbarPages.map((p, i) => pageToNavItem(p, i));
    }

    get showFixedHomeLink(): boolean {
        if (!this.hideHomeWhenNavbarHasHome) {
            return true;
        }
        const items = this.resolvedItems;
        return !items.some((item) => {
            const slug = (item.slug || '').toLowerCase();
            return slug === 'home' || slug === '';
        });
    }

    /** Ensures external URLs always have a protocol so the browser treats them as absolute, not relative. */
    safeUrl(url: string | undefined): string {
        if (!url) return '#';
        return /^https?:\/\//i.test(url) ? url : 'https://' + url;
    }

    getMegaWidth(item: NavItem): string {
        const cols = item.megaColumns?.length ?? 1;
        const width = Math.min(cols * 220 + 48, 900);
        return `${width}px`;
    }

    toggleMobileMenu(): void {
        this.mobileMenuOpen = !this.mobileMenuOpen;
    }

    onLogoutClicked(): void {
        this.logoutClicked.emit();
        this.mobileMenuOpen = false;
    }
}
