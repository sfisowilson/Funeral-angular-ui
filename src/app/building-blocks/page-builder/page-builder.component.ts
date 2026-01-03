import { Component, OnInit, signal, computed, ViewChild, ViewContainerRef, ComponentRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDrag, CdkDropList, CdkDragHandle, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SliderModule } from 'primeng/slider';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabViewModule } from 'primeng/tabview';
import { PanelModule } from 'primeng/panel';
import { InputText } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { Divider } from 'primeng/divider';
import { WidgetConfig } from '../widget-config';
import { WidgetService } from '../widget.service';
import { PageLayoutService } from '../page-layout.service';
import { WIDGET_TYPES, WidgetType } from '../widget-registry';
import { ThemeService } from '../../core/services/theme.service';
import { LandingPageTemplateService, LandingPageTemplate } from '../../pages/admin/landing-page-generator/landing-page-template.service';

@Component({
    selector: 'app-page-builder',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DragDropModule,
        ButtonModule,
        DialogModule,
        CardModule,
        ToastModule,
        ConfirmDialogModule,
        SliderModule,
        DropdownModule,
        CheckboxModule,
        InputNumberModule,
        TabViewModule,
        PanelModule,
        InputText,
        InputTextarea,
        Divider
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './page-builder.component.html',
    styleUrls: ['./page-builder.component.scss']
})
export class PageBuilderComponent implements OnInit {
    @ViewChild('widgetContainer', { read: ViewContainerRef }) widgetContainer!: ViewContainerRef;
    @ViewChild('editorContainer', { read: ViewContainerRef }) editorContainer!: ViewContainerRef;

    private editorComponentRef?: ComponentRef<any>;

    widgets = signal<WidgetConfig[]>([]);
    selectedWidget = signal<WidgetConfig | null>(null);
    previewMode = signal<boolean>(false);
    gridVisible = signal<boolean>(true);
    
    showWidgetPicker = signal<boolean>(false);
    showLayoutSettings = signal<boolean>(false);
    showContentEditor = signal<boolean>(false);
    showSeoSettings = signal<boolean>(false);
    
    availableWidgets: WidgetType[] = WIDGET_TYPES;
    
    showPostResetDialog = signal<boolean>(false);
    showTemplateDialog = signal<boolean>(false);
    availableTemplates = signal<LandingPageTemplate[]>([]);
    selectedTemplate = signal<LandingPageTemplate | null>(null);
    
    // SEO Meta Tags
    seoSettings = signal({
        pageTitle: '',
        metaDescription: '',
        metaKeywords: '',
        ogTitle: '',
        ogDescription: '',
        ogImage: '',
        twitterCard: 'summary_large_image',
        canonicalUrl: ''
    });
    
    // Layout options
    columnSpanOptions = [
        { label: '1/12 (Narrow)', value: 1 },
        { label: '2/12', value: 2 },
        { label: '3/12 (Quarter)', value: 3 },
        { label: '4/12 (Third)', value: 4 },
        { label: '6/12 (Half)', value: 6 },
        { label: '8/12 (Two-thirds)', value: 8 },
        { label: '9/12', value: 9 },
        { label: '12/12 (Full)', value: 12 }
    ];
    
    rowSpanOptions = [
        { label: '1 Row', value: 1 },
        { label: '2 Rows', value: 2 },
        { label: '3 Rows', value: 3 },
        { label: '4 Rows', value: 4 }
    ];
    
    // Animation options
    animationTypeOptions = [
        { label: 'None', value: 'none' },
        { label: 'Fade In', value: 'fade-in' },
        { label: 'Slide Up', value: 'slide-up' },
        { label: 'Slide Left', value: 'slide-left' },
        { label: 'Slide Right', value: 'slide-right' },
        { label: 'Scale', value: 'scale' },
        { label: 'Bounce', value: 'bounce' },
        { label: 'Rotate In', value: 'rotate-in' }
    ];
    
    animationEasingOptions = [
        { label: 'Ease (Default)', value: 'ease' },
        { label: 'Ease In', value: 'ease-in' },
        { label: 'Ease Out', value: 'ease-out' },
        { label: 'Ease In-Out', value: 'ease-in-out' },
        { label: 'Linear', value: 'linear' }
    ];
    
    // Spacing controls
    paddingIndividual = false;
    marginIndividual = false;
    
    hoverEffectOptions = [
        { label: 'None', value: 'none' },
        { label: 'Lift (Elevate on hover)', value: 'lift' },
        { label: 'Glow (Subtle shadow)', value: 'glow' },
        { label: 'Scale (Grow slightly)', value: 'scale' }
    ];

    // Grid configuration
    gridColumns = computed(() => this.pageLayoutService.gridConfig().columns);
    gridRowHeight = computed(() => this.pageLayoutService.gridConfig().rowHeight);
    gridGap = computed(() => this.pageLayoutService.gridConfig().gap);

    constructor(
        private widgetService: WidgetService,
        private pageLayoutService: PageLayoutService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private themeService: ThemeService,
        private landingPageTemplateService: LandingPageTemplateService
    ) {}

    ngOnInit(): void {
        this.loadWidgets();
    }

    loadWidgets(): void {
        // Only load widgets once to avoid overwriting local changes
        this.widgetService.widgets$.subscribe({
            next: (widgets) => {
                console.log('=== WIDGETS$ SUBSCRIPTION FIRED ===');
                console.log('Widgets received from service:', widgets.length);
                console.log('Current widgets in component:', this.widgets().length);
                
                // Don't overwrite if we already have widgets and we're in edit mode
                // This prevents losing changes during editing
                const currentWidgets = this.widgets();
                if (currentWidgets.length > 0 && (this.showContentEditor() || this.showLayoutSettings())) {
                    console.log('⚠️ Skipping widget reload - currently editing');
                    console.log('=== END WIDGETS$ SUBSCRIPTION (SKIPPED) ===');
                    return;
                }
                
                // Initialize layout for widgets that don't have one
                const widgetsWithLayout = widgets.map(w => 
                    this.pageLayoutService.initializeWidgetLayout(w)
                );
                
                console.log('Setting widgets in component:', widgetsWithLayout.length);
                this.widgets.set(widgetsWithLayout);
                console.log('=== END WIDGETS$ SUBSCRIPTION ===');
            }
        });
    }

    openWidgetPicker(): void {
        this.showWidgetPicker.set(true);
    }

    addWidget(widgetType: WidgetType): void {
        const newWidget: WidgetConfig = {
            id: this.generateId(),
            type: widgetType.name,
            title: widgetType.defaultConfig.title || widgetType.name,
            settings: { ...widgetType.defaultConfig }
        };

        // Initialize layout
        const widgetWithLayout = this.pageLayoutService.initializeWidgetLayout(newWidget);
        
        const currentWidgets = this.widgets();
        this.widgets.set([...currentWidgets, widgetWithLayout]);
        this.saveWidgets();
        
        this.showWidgetPicker.set(false);
        this.messageService.add({
            severity: 'success',
            summary: 'Widget Added',
            detail: `${widgetType.name} widget added to the page`
        });
    }

    selectWidget(widget: WidgetConfig): void {
        console.log('=== SELECT WIDGET ===');
        console.log('Widget being selected:', widget);
        console.log('Widget settings:', widget.settings);
        console.log('Services in widget settings:', widget.settings?.services);
        console.log('Services count:', widget.settings?.services?.length || 0);
        
        // Ensure layout exists
        if (!widget.layout) {
            widget.layout = {
                column: 1,
                columnSpan: 6,
                row: 1,
                rowSpan: 1,
                fullWidth: false,
                padding: 16,
                margin: 0,
                zIndex: 1,
                autoHeight: true
            };
        }
        
        // Ensure autoHeight is set
        if (widget.layout.autoHeight === undefined) {
            widget.layout.autoHeight = true;
        }
        
        // Ensure responsive config exists
        if (!widget.layout.responsive) {
            widget.layout.responsive = {
                mobile: { columnSpan: 12, hidden: false },
                tablet: { columnSpan: 6, hidden: false },
                desktop: { columnSpan: widget.layout.columnSpan, hidden: false }
            };
        } else {
            // Ensure each breakpoint exists
            if (!widget.layout.responsive.mobile) {
                widget.layout.responsive.mobile = { columnSpan: 12, hidden: false };
            }
            if (!widget.layout.responsive.tablet) {
                widget.layout.responsive.tablet = { columnSpan: 6, hidden: false };
            }
            if (!widget.layout.responsive.desktop) {
                widget.layout.responsive.desktop = { columnSpan: widget.layout.columnSpan, hidden: false };
            }
        }
        
        // Initialize animation config
        if (!widget.layout.animationType) {
            widget.layout.animationType = 'fade-in';
        }
        if (!widget.layout.animationDuration) {
            widget.layout.animationDuration = 600;
        }
        if (!widget.layout.animationDelay) {
            widget.layout.animationDelay = 0;
        }
        if (!widget.layout.animationEasing) {
            widget.layout.animationEasing = 'ease';
        }
        if (widget.layout.animationEnabled === undefined) {
            widget.layout.animationEnabled = true;
        }
        
        // Initialize hover effect
        if (!widget.layout.hoverEffect) {
            widget.layout.hoverEffect = 'lift';
        }
        
        this.selectedWidget.set(widget);
        console.log('Widget selected and set:', widget);
        console.log('=== END SELECT WIDGET ===');
        this.showLayoutSettings.set(true);
    }

    updateWidgetLayout(): void {
        const selected = this.selectedWidget();
        if (!selected) return;

        const currentWidgets = this.widgets();
        const index = currentWidgets.findIndex(w => w.id === selected.id);
        
        if (index > -1) {
            // Resolve collisions automatically
            if (selected.layout) {
                this.pageLayoutService.moveWidget(
                    selected, 
                    selected.layout.column, 
                    selected.layout.row, 
                    currentWidgets
                );
            }
            
            currentWidgets[index] = { ...selected };
            this.widgets.set([...currentWidgets]);
            this.saveWidgets();
            
            this.messageService.add({
                severity: 'success',
                summary: 'Layout Updated',
                detail: 'Widget layout has been updated. Overlapping widgets were moved automatically.'
            });
        }
    }

    editWidgetContent(widget: WidgetConfig): void {
        console.log('=== EDIT WIDGET CONTENT ===');
        console.log('Widget to edit:', widget);
        console.log('Widget settings:', widget.settings);
        console.log('Services in settings:', widget.settings?.services);
        console.log('Services count:', widget.settings?.services?.length || 0);
        
        this.selectedWidget.set(widget);
        this.showContentEditor.set(true);
        
        console.log('Selected widget set, opening content editor');
        
        // Wait for dialog to render, then load editor
        setTimeout(() => {
            console.log('Loading editor component...');
            this.loadEditor();
        }, 100);
    }

    saveWidgetContent(): void {
        this.showContentEditor.set(false);
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Widget content updated successfully'
        });
    }

    private loadEditor(): void {
        if (!this.editorContainer || !this.selectedWidget()) return;
        
        console.log('=== LOAD EDITOR ===');
        console.log('Editor container:', this.editorContainer);
        console.log('Selected widget:', this.selectedWidget());
        
        // Clear previous editor
        if (this.editorComponentRef) {
            console.log('Destroying existing editor component');
            this.editorComponentRef.destroy();
        }
        
        const widget = this.selectedWidget()!;
        console.log('Loading editor for widget:', widget);
        console.log('Widget type:', widget.type);
        console.log('Widget settings:', widget.settings);
        console.log('Services in widget:', widget.settings?.services);
        console.log('Services count:', widget.settings?.services?.length || 0);
        
        const editorComponent = this.getWidgetEditorComponent(widget.type);
        
        if (editorComponent) {
            console.log('Creating editor component for:', widget.type);
            this.editorComponentRef = this.editorContainer.createComponent(editorComponent);
            
            // Set inputs
            console.log('Setting config on editor instance...');
            this.editorComponentRef.instance.config = widget;
            console.log('Config set on editor. Config object:', widget);
            console.log('Config.settings:', widget.settings);
            console.log('Config.settings.services:', widget.settings?.services);
            
            // Manually trigger ngOnChanges since we're setting input programmatically
            console.log('Manually triggering ngOnChanges...');
            if (this.editorComponentRef.instance.ngOnChanges) {
                this.editorComponentRef.instance.ngOnChanges({
                    config: {
                        currentValue: widget,
                        previousValue: undefined,
                        firstChange: true,
                        isFirstChange: () => true
                    }
                });
            }
            console.log('ngOnChanges triggered');
            
            // Trigger change detection to update the view
            console.log('Triggering change detection...');
            this.editorComponentRef.changeDetectorRef.detectChanges();
            console.log('Change detection triggered');
            
            // Subscribe to outputs
            if (this.editorComponentRef.instance.update) {
                console.log('Subscribing to update event');
                this.editorComponentRef.instance.update.subscribe((settings: any) => {
                    console.log('=== UPDATE EVENT RECEIVED FROM EDITOR ===');
                    console.log('Settings received:', settings);
                    console.log('Services in settings:', settings?.services);
                    console.log('Services count:', settings?.services?.length || 0);
                    this.handleEditorUpdate(settings);
                });
            } else {
                console.error('Editor instance has no update EventEmitter!');
            }
            
            if (this.editorComponentRef.instance.cancel) {
                console.log('Subscribing to cancel event');
                this.editorComponentRef.instance.cancel.subscribe(() => {
                    console.log('=== CANCEL EVENT RECEIVED ===');
                    this.handleEditorCancel();
                });
            }
            
            console.log('Editor loaded and events wired up');
            console.log('=== END LOAD EDITOR ===');
        } else {
            console.error('No editor component found for type:', widget.type);
        }
    }

    updateWidgetContent(updatedSettings: any): void {
        const selected = this.selectedWidget();
        if (!selected) {
            console.error('No widget selected');
            return;
        }

        console.log('=== UPDATE WIDGET CONTENT ===');
        console.log('Selected widget before update:', selected);
        console.log('Updated settings received:', updatedSettings);
        console.log('Services in updated settings:', updatedSettings.services);
        console.log('Services count:', updatedSettings.services?.length || 0);

        // Create a new widget object to trigger change detection
        // Use deep copy for settings to avoid reference issues
        const updatedWidget: WidgetConfig = {
            ...selected,
            settings: JSON.parse(JSON.stringify(updatedSettings)),
            title: updatedSettings.title || selected.type
        };
        
        console.log('Updated widget object created:', updatedWidget);
        console.log('Settings in updated widget:', updatedWidget.settings);
        console.log('Services in updated widget:', updatedWidget.settings.services);
        console.log('Services count in updated widget:', updatedWidget.settings.services?.length || 0);
        
        const currentWidgets = this.widgets();
        const index = currentWidgets.findIndex(w => w.id === selected.id);
        
        console.log('Widget index in array:', index);
        console.log('Current widgets array length:', currentWidgets.length);
        
        if (index > -1) {
            currentWidgets[index] = updatedWidget;
            this.widgets.set([...currentWidgets]);
            this.selectedWidget.set(updatedWidget);
            
            console.log('Widget updated in array at index:', index);
            console.log('Updated widgets array:', currentWidgets);
            
            // Save to backend
            this.saveWidgets();
            
            this.messageService.add({
                severity: 'success',
                summary: 'Content Updated',
                detail: 'Widget content has been updated successfully.'
            });
            
            console.log('Widget updated and saved successfully');
            console.log('=== END UPDATE WIDGET CONTENT ===');
        } else {
            console.error('Widget not found in array');
        }
        
        this.showContentEditor.set(false);
    }

    deleteWidget(widget: WidgetConfig): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete this ${widget.type} widget?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const currentWidgets = this.widgets().filter(w => w.id !== widget.id);
                this.widgets.set(currentWidgets);
                this.saveWidgets();
                
                if (this.selectedWidget()?.id === widget.id) {
                    this.selectedWidget.set(null);
                    this.showLayoutSettings.set(false);
                }
                
                this.messageService.add({
                    severity: 'success',
                    summary: 'Widget Deleted',
                    detail: 'Widget has been removed from the page'
                });
            }
        });
    }

    duplicateWidget(widget: WidgetConfig): void {
        const cloned = this.pageLayoutService.cloneWidget(widget, this.widgets());
        this.widgets.set([...this.widgets(), cloned]);
        this.saveWidgets();
        
        this.messageService.add({
            severity: 'success',
            summary: 'Widget Duplicated',
            detail: 'Widget has been duplicated'
        });
    }

    moveWidgetUp(widget: WidgetConfig): void {
        if (!widget.layout) return;
        
        const newRow = Math.max(1, widget.layout.row - 1);
        if (this.pageLayoutService.moveWidget(widget, widget.layout.column, newRow, this.widgets())) {
            this.widgets.set([...this.widgets()]);
            this.saveWidgets();
        }
    }

    moveWidgetDown(widget: WidgetConfig): void {
        if (!widget.layout) return;
        
        const newRow = widget.layout.row + 1;
        if (this.pageLayoutService.moveWidget(widget, widget.layout.column, newRow, this.widgets())) {
            this.widgets.set([...this.widgets()]);
            this.saveWidgets();
        }
    }

    setWidgetFullWidth(widget: WidgetConfig): void {
        this.pageLayoutService.setFullWidth(widget, true);
        this.widgets.set([...this.widgets()]);
        this.saveWidgets();
        
        this.messageService.add({
            severity: 'info',
            summary: 'Full Width',
            detail: 'Widget set to full width'
        });
    }

    compactLayout(): void {
        const compacted = this.pageLayoutService.compactGrid(this.widgets());
        this.widgets.set([...compacted]);
        this.saveWidgets();
        
        this.messageService.add({
            severity: 'success',
            summary: 'Layout Compacted',
            detail: 'Empty spaces have been removed'
        });
    }

    togglePreview(): void {
        this.previewMode.set(!this.previewMode());
    }

    toggleGrid(): void {
        this.gridVisible.set(!this.gridVisible());
    }

    saveWidgets(): void {
        // Only save if auto-save is enabled (for landing pages)
        // Custom pages have auto-save disabled and handle saving manually
        if (!this.widgetService.isAutoSaveEnabled()) {
            console.log('⊘ Auto-save disabled - widgets not saved to tenant settings');
            // Just update the in-memory state
            const widgetsToSave = this.widgets();
            this.widgetService.loadWidgetsFromSource(widgetsToSave);
            return;
        }
        
        console.log('=== SAVING WIDGETS ===');
        const widgetsToSave = this.widgets();
        console.log('Widgets count:', widgetsToSave.length);
        console.log('Widgets to save:', JSON.stringify(widgetsToSave, null, 2));
        
        // Deep clone to ensure we're saving a clean copy without references
        const clonedWidgets = JSON.parse(JSON.stringify(widgetsToSave));
        
        this.widgetService.saveWidgets(clonedWidgets).subscribe({
            next: () => {
                console.log('✓ Widgets saved successfully to backend');
                console.log('✓ Saved widget count:', clonedWidgets.length);
            },
            error: (error) => {
                console.error('✗ Error saving widgets:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save Failed',
                    detail: 'Failed to save widget configuration'
                });
            }
        });
    }

    getGridStyles(): any {
        return this.pageLayoutService.getContainerGridStyles();
    }

    getWidgetStyles(widget: WidgetConfig): any {
        return this.pageLayoutService.calculateGridStyles(widget);
    }

    getWidgetComponent(widgetType: string): any {
        const type = WIDGET_TYPES.find(t => t.name === widgetType);
        return type?.component;
    }

    getWidgetEditorComponent(widgetType: string): any {
        const type = WIDGET_TYPES.find(t => t.name === widgetType);
        return type?.editorComponent;
    }

    handleEditorUpdate(updatedSettings: any): void {
        console.log('=== HANDLE EDITOR UPDATE ===');
        console.log('Updated settings:', updatedSettings);
        console.log('ImageUrl in updated settings:', updatedSettings.imageUrl);
        this.updateWidgetContent(updatedSettings);
    }

    handleEditorCancel(): void {
        this.showContentEditor.set(false);
    }

    trackByWidgetId(index: number, widget: WidgetConfig): string {
        return widget.id;
    }

    private generateId(): string {
        return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Handle padding changes when "All Sides" mode is active
    onPaddingAllChange(value: number): void {
        const widget = this.selectedWidget();
        if (widget?.layout) {
            // Clear individual padding values when using all sides
            widget.layout.paddingTop = undefined;
            widget.layout.paddingRight = undefined;
            widget.layout.paddingBottom = undefined;
            widget.layout.paddingLeft = undefined;
        }
    }
    
    // Handle margin changes when "All Sides" mode is active
    onMarginAllChange(value: number): void {
        const widget = this.selectedWidget();
        if (widget?.layout) {
            // Clear individual margin values when using all sides
            widget.layout.marginTop = undefined;
            widget.layout.marginRight = undefined;
            widget.layout.marginBottom = undefined;
            widget.layout.marginLeft = undefined;
        }
    }

    // Drag and drop handler (for manual ordering)
    onWidgetDrop(event: CdkDragDrop<WidgetConfig[]>): void {
        const widgets = [...this.widgets()];
        moveItemInArray(widgets, event.previousIndex, event.currentIndex);
        this.widgets.set(widgets);
        this.saveWidgets();
    }

    // SEO Settings methods
    openSeoSettings(): void {
        // Load current SEO settings from the service or storage
        this.widgetService.getSeoSettings().subscribe({
            next: (settings) => {
                if (settings) {
                    this.seoSettings.set(settings);
                }
                this.showSeoSettings.set(true);
            },
            error: (error) => {
                console.error('Error loading SEO settings:', error);
                this.showSeoSettings.set(true);
            }
        });
    }

    saveSeoSettings(): void {
        const settings = this.seoSettings();
        this.widgetService.saveSeoSettings(settings).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'SEO Settings Saved',
                    detail: 'Meta tags have been updated successfully'
                });
                this.showSeoSettings.set(false);
            },
            error: (error) => {
                console.error('Error saving SEO settings:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Save Failed',
                    detail: 'Failed to save SEO settings'
                });
            }
        });
    }

    cancelSeoSettings(): void {
        this.showSeoSettings.set(false);
    }

    resetPage(): void {
        this.confirmationService.confirm({
            message: 'This will remove all widgets from the page, reset the theme to defaults, and clear all SEO settings. This action cannot be undone. Are you sure you want to continue?',
            header: 'Reset Page',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                // Clear all widgets
                this.widgets.set([]);
                this.selectedWidget.set(null);
                this.showLayoutSettings.set(false);
                this.showContentEditor.set(false);
                this.showWidgetPicker.set(false);
                
                // Reset SEO settings to defaults
                this.seoSettings.set({
                    pageTitle: '',
                    metaDescription: '',
                    metaKeywords: '',
                    ogTitle: '',
                    ogDescription: '',
                    ogImage: '',
                    twitterCard: 'summary_large_image',
                    canonicalUrl: ''
                });
                
                // Reset theme to defaults by clearing custom CSS and theme colors
                this.resetThemeToDefaults();
                
                // Save the empty state to backend
                this.saveWidgets();
                
                // Save reset SEO settings
                this.widgetService.saveSeoSettings(this.seoSettings()).subscribe({
                    next: () => {
                        console.log('SEO settings reset successfully');
                    },
                    error: (error) => {
                        console.error('Error resetting SEO settings:', error);
                    }
                });
                
                // Show post-reset dialog for theme selection
                this.showPostResetDialog.set(true);
                
                this.messageService.add({
                    severity: 'success',
                    summary: 'Page Reset Complete',
                    detail: 'Page has been reset to defaults. Choose how you\'d like to start building.'
                });
            },
            reject: () => {
                // User cancelled - do nothing
            }
        });
    }

    private resetThemeToDefaults(): void {
        // Remove custom theme CSS
        const customThemeStyle = document.getElementById('tenant-theme-colors');
        if (customThemeStyle) {
            customThemeStyle.remove();
        }
        
        // Remove custom CSS
        const customCssStyle = document.getElementById('tenant-custom-css');
        if (customCssStyle) {
            customCssStyle.remove();
        }
        
        // Clear tenant settings in the service to force reload of defaults
        // This will trigger the theme service to load default theme
        this.themeService.loadTenantCss();
        
        console.log('Theme reset to defaults');
    }

    startWithBlankPage(): void {
        this.showPostResetDialog.set(false);
        this.messageService.add({
            severity: 'info',
            summary: 'Blank Page',
            detail: 'You can now start adding widgets to build your page from scratch.'
        });
    }

    selectTheme(): void {
        this.showPostResetDialog.set(false);
        // TODO: Implement theme selection dialog
        // For now, show widget picker so they can start with themed widgets
        this.openWidgetPicker();
        this.messageService.add({
            severity: 'info',
            summary: 'Theme Selection',
            detail: 'Choose widgets to start building your themed page. Full theme selection coming soon!'
        });
    }

    loadTemplate(): void {
        this.showPostResetDialog.set(false);
        this.loadAvailableTemplates();
        this.showTemplateDialog.set(true);
    }

    private loadAvailableTemplates(): void {
        // Get funeral-specific templates
        const allTemplates = this.landingPageTemplateService.getStaticTemplates();
        console.log('All templates available:', allTemplates);
        
        const funeralTemplates = allTemplates.filter(template => 
            template.category === 'Funeral'
            // Remove tenant type filter temporarily to show all funeral templates
        );
        console.log('Funeral templates filtered:', funeralTemplates);
        this.availableTemplates.set(funeralTemplates);
    }

    selectTemplate(template: LandingPageTemplate): void {
        this.selectedTemplate.set(template);
        this.applyTemplate(template);
    }

    private applyTemplate(template: LandingPageTemplate): void {
        try {
            const components = this.landingPageTemplateService.generatePageComponents(template.id);
            
            // Convert template components to widget configs
            const widgetConfigs: WidgetConfig[] = components.map(component => {
                // Find matching widget type
                const widgetType = this.findWidgetTypeForComponent(component.type);
                if (!widgetType) {
                    console.warn(`No widget type found for component: ${component.type}`);
                    return null;
                }

                return {
                    id: this.generateId(),
                    type: widgetType.name,
                    title: component.properties['title'] || widgetType.name,
                    settings: {
                        ...widgetType.defaultConfig,
                        ...component.properties,
                        ...component.content
                    }
                };
            }).filter(widget => widget !== null) as WidgetConfig[];

            // Apply layout to all widgets
            const widgetsWithLayout = widgetConfigs.map(widget => 
                this.pageLayoutService.initializeWidgetLayout(widget)
            );

            // Set the widgets
            this.widgets.set(widgetsWithLayout);
            this.saveWidgets();

            this.showTemplateDialog.set(false);
            this.selectedTemplate.set(null);

            this.messageService.add({
                severity: 'success',
                summary: 'Template Applied',
                detail: `${template.name} template has been applied successfully. You can now customize the widgets.`
            });
        } catch (error) {
            console.error('Error applying template:', error);
            this.messageService.add({
                severity: 'error',
                summary: 'Template Error',
                detail: 'Failed to apply the selected template. Please try again.'
            });
        }
    }

    private findWidgetTypeForComponent(componentType: string): WidgetType | undefined {
        // Map template component types to widget types
        const typeMapping: Record<string, string> = {
            'hero': 'hero-section',
            'about': 'about-section',
            'services': 'services-overview',
            'obituaries': 'news-updates',
            'contact': 'contact-form',
            'preplanning': 'benefits-checklist',
            'resources': 'services-overview',
            'memorial': 'services-overview',
            'pricing': 'pricing-table',
            'faq': 'faq-section'
        };

        const widgetTypeName = typeMapping[componentType];
        return WIDGET_TYPES.find(type => type.name === widgetTypeName);
    }

    cancelTemplateSelection(): void {
        this.showTemplateDialog.set(false);
        this.selectedTemplate.set(null);
    }

    onCardHover(event: MouseEvent, isHovering: boolean): void {
        const element = event.currentTarget as HTMLElement;
        if (element) {
            element.style.transform = isHovering ? 'translateY(-4px)' : 'translateY(0)';
            element.style.transition = 'transform 0.2s, box-shadow 0.2s';
        }
    }
}
