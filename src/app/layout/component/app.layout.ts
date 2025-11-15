import { Component, Renderer2, ViewChild, ElementRef, OnInit, AfterViewInit, OnDestroy, DoCheck } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AppTopbar } from './app.topbar';
import { AppSidebar } from './app.sidebar';
import { AppFooter } from './app.footer';
import { LayoutService } from '../service/layout.service';

@Component({
    selector: 'app-layout',
    standalone: true,
    imports: [CommonModule, AppTopbar, AppSidebar, RouterModule, AppFooter],
    template: `<div #layoutWrapper class="layout-wrapper layout-static">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-outlet></router-outlet>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein" (click)="hideMenu()"></div>
    </div> `
})
export class AppLayout implements OnInit, AfterViewInit, DoCheck, OnDestroy {
    overlayMenuOpenSubscription!: Subscription;
    menuOutsideClickListener: any;
    layoutStateSubscription!: Subscription;
    
    // Track previous state to detect changes
    private previousMobileActive = false;
    private previousDesktopInactive = false;

    @ViewChild(AppSidebar) appSidebar!: AppSidebar;
    @ViewChild(AppTopbar) appTopBar!: AppTopbar;
    @ViewChild('layoutWrapper', { static: true }) layoutWrapper!: ElementRef;

    constructor(
        public layoutService: LayoutService,
        public renderer: Renderer2,
        public router: Router
    ) {
        console.log('AppLayout constructor called');
    }

    ngAfterViewInit() {
        console.log('ngAfterViewInit called');
        console.log('layoutWrapper available:', !!this.layoutWrapper);
    }

    ngDoCheck() {
        // No longer needed - using subscription instead
        // Kept for potential debugging
    }

    updateMobileClass(isActive: boolean) {
        if (this.layoutWrapper?.nativeElement) {
            const element = this.layoutWrapper.nativeElement;
            
            if (isActive) {
                console.log('Adding layout-mobile-active class');
                this.renderer.addClass(element, 'layout-mobile-active');
            } else {
                console.log('Removing layout-mobile-active class');
                this.renderer.removeClass(element, 'layout-mobile-active');
            }
            
            console.log('Current classes:', element.className);
        }
    }

    updateDesktopClass(isInactive: boolean) {
        if (this.layoutWrapper?.nativeElement) {
            const element = this.layoutWrapper.nativeElement;
            
            if (isInactive) {
                console.log('Adding layout-static-inactive class');
                this.renderer.addClass(element, 'layout-static-inactive');
            } else {
                console.log('Removing layout-static-inactive class');
                this.renderer.removeClass(element, 'layout-static-inactive');
            }
            
            console.log('Current classes:', element.className);
        }
    }

    watchLayoutState() {
        // This method is no longer needed with ngDoCheck
    }

    ngOnInit() {
        console.log('=== ngOnInit called ===');
        console.log('Setting up stateChange$ subscription');
        
        // Subscribe to state changes from the service
        this.layoutStateSubscription = this.layoutService.stateChange$.subscribe({
            next: (state) => {
                console.log('=== State Change Subscription Triggered ===');
                console.log('New state received:', state);
                console.log('staticMenuMobileActive:', state.staticMenuMobileActive);
                console.log('staticMenuDesktopInactive:', state.staticMenuDesktopInactive);
                
                // Apply mobile class
                const mobileActive = state.staticMenuMobileActive ?? false;
                this.updateMobileClass(mobileActive);
                this.previousMobileActive = mobileActive;
                
                // Apply desktop class
                const desktopInactive = state.staticMenuDesktopInactive ?? false;
                this.updateDesktopClass(desktopInactive);
                this.previousDesktopInactive = desktopInactive;
            },
            error: (err) => console.error('State change subscription error:', err),
            complete: () => console.log('State change subscription completed')
        });
        
        console.log('stateChange$ subscription set up successfully');
        
        this.overlayMenuOpenSubscription = this.layoutService.overlayOpen$.subscribe(() => {
            if (!this.menuOutsideClickListener) {
                this.menuOutsideClickListener = this.renderer.listen('document', 'click', (event) => {
                    if (this.isOutsideClicked(event)) {
                        this.hideMenu();
                    }
                });
            }

            if (this.layoutService.layoutState().staticMenuMobileActive) {
                this.blockBodyScroll();
            }
        });

        this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
            this.hideMenu();
        });
    }

    isOutsideClicked(event: MouseEvent) {
        const sidebarEl = document.querySelector('.layout-sidebar');
        const topbarEl = document.querySelector('.layout-menu-button');
        const eventTarget = event.target as Node;

        return !(sidebarEl?.isSameNode(eventTarget) || sidebarEl?.contains(eventTarget) || topbarEl?.isSameNode(eventTarget) || topbarEl?.contains(eventTarget));
    }

    hideMenu() {
        console.log('=== Hiding Menu ===');
        this.layoutService.layoutState.update((prev) => ({ ...prev, overlayMenuActive: false, staticMenuMobileActive: false, menuHoverActive: false }));
        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
            this.menuOutsideClickListener = null;
        }
        this.unblockBodyScroll();
        console.log('Menu hidden, new state:', this.layoutService.layoutState());
    }

    blockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.add('blocked-scroll');
        } else {
            document.body.className += ' blocked-scroll';
        }
    }

    unblockBodyScroll(): void {
        if (document.body.classList) {
            document.body.classList.remove('blocked-scroll');
        } else {
            document.body.className = document.body.className.replace(new RegExp('(^|\\b)' + 'blocked-scroll'.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
        }
    }

    ngOnDestroy() {
        if (this.overlayMenuOpenSubscription) {
            this.overlayMenuOpenSubscription.unsubscribe();
        }

        if (this.layoutStateSubscription) {
            this.layoutStateSubscription.unsubscribe();
        }

        if (this.menuOutsideClickListener) {
            this.menuOutsideClickListener();
        }
    }
}
