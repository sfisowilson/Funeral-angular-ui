// Example integration for navbar component
// Add this to your navbar service or component

import { CustomPageService } from './core/services/custom-page.service';
import { PageListItem } from './core/models/custom-page.model';

export class NavbarIntegrationExample {
  customPageLinks: any[] = [];

  constructor(private customPageService: CustomPageService) {}

  loadCustomPages(): void {
    // Load navbar pages
    this.customPageService.getNavbarPages().subscribe({
      next: (pages) => {
        this.customPageLinks = pages.map(page => ({
          label: page.name,
          routerLink: ['/', page.slug],
          requiresAuth: page.requiresAuth,
          icon: 'pi pi-file' // Optional icon
        }));
      },
      error: (error) => {
        console.error('Error loading custom pages for navbar:', error);
      }
    });
  }

  // In your navbar template, add:
  /*
  @for (link of customPageLinks; track link.routerLink) {
    <li>
      <a [routerLink]="link.routerLink" class="nav-link">
        <i [class]="link.icon"></i>
        <span>{{ link.label }}</span>
      </a>
    </li>
  }
  */
}

// Example integration for footer component
export class FooterIntegrationExample {
  customPageLinks: any[] = [];

  constructor(private customPageService: CustomPageService) {}

  loadCustomPages(): void {
    // Load footer pages
    this.customPageService.getFooterPages().subscribe({
      next: (pages) => {
        this.customPageLinks = pages.map(page => ({
          label: page.name,
          routerLink: ['/', page.slug],
          requiresAuth: page.requiresAuth
        }));
      },
      error: (error) => {
        console.error('Error loading custom pages for footer:', error);
      }
    });
  }

  // In your footer template, add:
  /*
  <div class="footer-links">
    @for (link of customPageLinks; track link.routerLink) {
      <a [routerLink]="link.routerLink" class="footer-link">
        {{ link.label }}
      </a>
    }
  </div>
  */
}

// Alternative: Load all pages and filter in component
export class CombinedNavigationExample {
  allPages: PageListItem[] = [];

  constructor(private customPageService: CustomPageService) {}

  loadPages(): void {
    this.customPageService.getPages().subscribe({
      next: (pages) => {
        this.allPages = pages;
      }
    });
  }

  get navbarPages(): PageListItem[] {
    return this.allPages
      .filter(p => p.showInNavbar && p.isActive)
      .sort((a, b) => {
        // Sort by order if available, otherwise by name
        return a.name.localeCompare(b.name);
      });
  }

  get footerPages(): PageListItem[] {
    return this.allPages
      .filter(p => p.showInFooter && p.isActive)
      .sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
  }
}
