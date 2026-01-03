import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiServiceProxy, CustomPageDto, UpdatePageDto } from '../../../core/services/service-proxies';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PageBuilderComponent } from '../../../building-blocks/page-builder/page-builder.component';
import { WidgetService } from '../../../building-blocks/widget.service';
import { WidgetConfig } from '../../../building-blocks/widget-config';
import { WIDGET_TYPES } from '../../../building-blocks/widget-registry';
import { Subscription } from 'rxjs';
import { debounceTime, skip } from 'rxjs/operators';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    CheckboxModule,
    ToastModule,
    ProgressSpinnerModule,
    PageBuilderComponent
  ],
  providers: [MessageService, ApiServiceProxy, WidgetService],
  templateUrl: './page-editor.component.html',
  styleUrls: ['./page-editor.component.scss']
})
export class PageEditorComponent implements OnInit, OnDestroy {
  page = signal<CustomPageDto | null>(null);
  loading = signal(false);
  saving = signal(false);
  hasUnsavedChanges = signal(false);
  lastSaved = signal<Date | null>(null);
  pageId: string | null = null;
  isCustomPage = true; // Flag to indicate this is a custom page, not landing page
  private widgetSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customPagesService: ApiServiceProxy,
    private messageService: MessageService,
    private widgetService: WidgetService
  ) {}

  ngOnInit(): void {
    // Disable auto-save to prevent saving to tenant settings
    this.widgetService.setAutoSaveEnabled(false);
    
    this.pageId = this.route.snapshot.paramMap.get('id');
    if (this.pageId) {
      this.loadPage();
    }
    
    // Subscribe to widget changes and auto-save after 2 seconds of inactivity
    this.widgetSubscription = this.widgetService.widgets$
      .pipe(
        skip(1), // Skip the initial load
        debounceTime(2000) // Wait 2 seconds after last change
      )
      .subscribe(() => {
        console.log('Widgets changed - auto-saving...');
        this.hasUnsavedChanges.set(true);
        this.autoSavePage();
      });
  }

  loadPage(): void {
    if (!this.pageId) return;
    
    this.loading.set(true);
    this.customPagesService.customPagesGet(this.pageId).subscribe({
      next: (page) => {
        this.page.set(page);
        
        // Convert page content to WidgetConfig format and load into WidgetService
        const widgets: WidgetConfig[] = [];
        if (page.content && Array.isArray(page.content)) {
          page.content.forEach((widget: any) => {
            const widgetType = WIDGET_TYPES.find(t => t.name === widget.type);
            if (widgetType) {
              widgets.push({
                id: widget.id || `widget-${Date.now()}-${Math.random()}`,
                type: widget.type,
                settings: widget.config || widgetType.defaultConfig
              });
            }
          });
        }
        
        this.widgetService.loadWidgetsFromSource(widgets);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading page:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load page'
        });
        this.loading.set(false);
      }
    });
  }

  savePage(): void {
    const currentPage = this.page();
    if (!currentPage || !this.pageId || !currentPage.id) return;

    this.saving.set(true);
    
    // Get widgets from WidgetService and convert to content format
    const widgets = this.widgetService.getWidgets();
    const content = widgets.map((widget, index) => ({
      id: widget.id,
      type: widget.type,
      config: widget.settings,  // Convert settings back to config for API
      order: index
    }));
    
    const updateRequest = UpdatePageDto.fromJS({
      name: currentPage.name,
      slug: currentPage.slug,
      title: currentPage.title,
      description: currentPage.description,
      content: content as any,
      isPublic: currentPage.isPublic,
      requiresAuth: currentPage.requiresAuth,
      showInNavbar: currentPage.showInNavbar,
      showInFooter: currentPage.showInFooter,
      isActive: currentPage.isActive,
      navbarOrder: currentPage.navbarOrder,
      footerOrder: currentPage.footerOrder,
      metaTags: currentPage.metaTags
    });
    this.customPagesService.customPagesPut(currentPage.id, updateRequest).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Page saved successfully'
        });
        this.saving.set(false);
        this.hasUnsavedChanges.set(false);
        this.lastSaved.set(new Date());
      },
      error: (error) => {
        console.error('Error saving page:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save page'
        });
        this.saving.set(false);
      }
    });
  }
  
  autoSavePage(): void {
    const currentPage = this.page();
    if (!currentPage || !this.pageId || !currentPage.id || this.saving()) return;

    // Get widgets from WidgetService and convert to content format
    const widgets = this.widgetService.getWidgets();
    const content = widgets.map((widget, index) => ({
      id: widget.id,
      type: widget.type,
      config: widget.settings,
      order: index
    }));
    
    const updateRequest = UpdatePageDto.fromJS({
      name: currentPage.name,
      slug: currentPage.slug,
      title: currentPage.title,
      description: currentPage.description,
      content: content as any,
      isPublic: currentPage.isPublic,
      requiresAuth: currentPage.requiresAuth,
      showInNavbar: currentPage.showInNavbar,
      showInFooter: currentPage.showInFooter,
      isActive: currentPage.isActive,
      navbarOrder: currentPage.navbarOrder,
      footerOrder: currentPage.footerOrder,
      metaTags: currentPage.metaTags
    });
    
    this.customPagesService.customPagesPut(currentPage.id, updateRequest).subscribe({
      next: () => {
        console.log('✓ Auto-saved successfully');
        this.hasUnsavedChanges.set(false);
        this.lastSaved.set(new Date());
      },
      error: (error) => {
        console.error('✗ Auto-save failed:', error);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/custom-pages']);
  }
  
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
  
  onNameChange(name: string): void {
    const currentPage = this.page();
    if (currentPage) {
      currentPage.slug = this.generateSlug(name);
    }
  }
  
  getTimeSince(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }
  
  ngOnDestroy(): void {
    // Unsubscribe from widget changes
    if (this.widgetSubscription) {
      this.widgetSubscription.unsubscribe();
    }
    
    // Re-enable auto-save when leaving custom page editor
    this.widgetService.setAutoSaveEnabled(true);
  }
}
