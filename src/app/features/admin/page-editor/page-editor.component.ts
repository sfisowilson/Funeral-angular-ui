import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiServiceProxy, CustomPageDto, UpdatePageDto, OnboardingStepConfigurationServiceProxy, CreateOnboardingStepConfigurationDto, OnboardingStepType } from '../../../core/services/service-proxies';
import { OnboardingStepAdminService } from '../../../core/services/onboarding-step-admin.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PageBuilderComponent } from '../../../building-blocks/page-builder/page-builder.component';
import { WidgetService } from '../../../building-blocks/widget.service';
import { WidgetConfig } from '../../../building-blocks/widget-config';
import { WIDGET_TYPES } from '../../../building-blocks/widget-registry';
import { Subscription, forkJoin, of } from 'rxjs';
import { debounceTime, skip, concatMap } from 'rxjs/operators';

@Component({
    selector: 'app-page-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, ButtonModule, ToastModule, ProgressSpinnerModule, PageBuilderComponent, ConfirmDialogModule],
    providers: [MessageService, WidgetService, ConfirmationService],
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
        private widgetService: WidgetService,
        private confirmationService: ConfirmationService,
        private onboardingStepService: OnboardingStepConfigurationServiceProxy,
        private onboardingStepAdminService: OnboardingStepAdminService
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
            next: (response) => {
                const page = response.result || null;
                this.page.set(page);

                // Convert page content to WidgetConfig format and load into WidgetService
                const widgets: WidgetConfig[] = [];
                if (page.content && Array.isArray(page.content)) {
                    page.content.forEach((widget: any) => {
                        const widgetType = WIDGET_TYPES.find((t) => t.name === widget.type);
                        if (widgetType) {
                            const rawConfig = widget.config;
                            const settingsFromDb = rawConfig && typeof rawConfig === 'object' && (rawConfig as any).settings ? (rawConfig as any).settings : rawConfig;
                            const layoutFromDb = rawConfig && typeof rawConfig === 'object' ? (rawConfig as any).layout : undefined;

                            widgets.push({
                                id: widget.id || `widget-${Date.now()}-${Math.random()}`,
                                type: widget.type,
                                settings: { ...widgetType.defaultConfig, ...(settingsFromDb || {}) },
                                layout: layoutFromDb
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
            // Persist full widget config (settings + layout). Dynamic page rendering is backward-compatible.
            config: { settings: widget.settings, layout: widget.layout },
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
            isOnboardingPage: (currentPage as any).isOnboardingPage,
            isBlockingOnboarding: (currentPage as any).isBlockingOnboarding,
            requiresOnboardingApproval: (currentPage as any).requiresOnboardingApproval,
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
            config: { settings: widget.settings, layout: widget.layout },
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
            isOnboardingPage: (currentPage as any).isOnboardingPage,
            isBlockingOnboarding: (currentPage as any).isBlockingOnboarding,
            requiresOnboardingApproval: (currentPage as any).requiresOnboardingApproval,
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

    syncOnboardingSteps(): void {
        const widgets = this.widgetService.getWidgets();
        // Look for widgets that define simple onboarding flow
        const onboardingWidget = widgets.find((w) => w.type === 'onboarding-multi-submit-step' || w.type === 'onboarding-stepper');

        if (!onboardingWidget) {
            this.messageService.add({
                severity: 'warn',
                summary: 'No Onboarding Widget',
                detail: 'No onboarding widget found on this page. Add an "Onboarding Multi-Submit Step" widget to configure steps.'
            });
            return;
        }

        this.confirmationService.confirm({
            message: 'This will overwrite ALL existing onboarding steps configuration for this tenant with the steps defined in this widget. Are you sure?',
            header: 'Sync Onboarding Steps',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.performSync(onboardingWidget);
            }
        });
    }

    private performSync(widget: WidgetConfig): void {
        this.loading.set(true);
        const stepsConfig = (widget.settings as any).steps || [];

        // 1. Fetch all existing steps
        this.onboardingStepAdminService.getAllSteps() // Use Admin service as Proxy GetAll returns void
            .pipe(
                // 2. Delete all existing steps
                concatMap((existingSteps) => {
                    if (!existingSteps || existingSteps.length === 0) return of(null);
                    
                    const deleteTasks = existingSteps.map(step => 
                        this.onboardingStepService.onboardingStepConfiguration_Delete(step.id)
                    );
                    return forkJoin(deleteTasks);
                }),
                // 3. Create new steps from widget config
                concatMap(() => {
                    if (!stepsConfig || stepsConfig.length === 0) return of([]);

                    const createTasks = stepsConfig.map((step: any, index: number) => {
                        const dto = new CreateOnboardingStepConfigurationDto();
                        
                        dto.stepKey = step.stepKey || `step-${Date.now()}-${index}`;
                        dto.stepLabel = step.title || step.label || `Step ${index + 1}`;
                        dto.description = step.description;
                        dto.displayOrder = index;
                        dto.isEnabled = true;
                        dto.isRequired = true; // Default to required
                        // dto.tenantId = (this.page() as any)?.tenantId; // Backend handles tenant ID
                        
                        if (step.type === 'terms' || step.stepType === 'terms') {
                            dto.stepType = OnboardingStepType._3; // TermsAndConditions
                            dto.termsTextContent = step.termsContent;
                            // If termsPdfPath is an ID, use it. If it's a path, you might need a lookup or backend logic.
                            // Currently assuming it might be a file ID if using file picker
                        } else if (step.type === 'pdf-signing' || step.stepType === 'pdf-signing') {
                             dto.stepType = 4 as OnboardingStepType; // PdfSigning - Pending proxy regeneration
                             dto.termsPdfFileId = step.contractTemplateId; // reusing field for contract template
                        } else {
                            // Default to Form
                            dto.stepType = OnboardingStepType._0; // Form
                            dto.formId = step.formId;
                            
                            // Check for entity binding
                            if (step.entityType) {
                                dto.dynamicEntityTypeKey = step.entityType;
                            }
                        }
                        
                        return this.onboardingStepService.onboardingStepConfiguration_Create(dto);
                    });
                    
                    return forkJoin(createTasks);
                })
            )
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Synced Successfully',
                        detail: 'Onboarding steps have been updated to match this page.'
                    });
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('Sync failed', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Sync Failed',
                        detail: 'Failed to sync onboarding steps. ' + (error?.message || '')
                    });
                    this.loading.set(false);
                }
            });
    }
}
