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
import { WidgetConfig } from '../widget-config';
import { WidgetService } from '../widget.service';
import { PageLayoutService } from '../page-layout.service';
import { WIDGET_TYPES, WidgetType } from '../widget-registry';

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
        PanelModule
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
    
    availableWidgets: WidgetType[] = WIDGET_TYPES;
    
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
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadWidgets();
    }

    loadWidgets(): void {
        this.widgetService.widgets$.subscribe(widgets => {
            // Initialize layout for widgets that don't have one
            const widgetsWithLayout = widgets.map(w => 
                this.pageLayoutService.initializeWidgetLayout(w)
            );
            this.widgets.set(widgetsWithLayout);
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
                zIndex: 1
            };
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
        this.selectedWidget.set(widget);
        this.showContentEditor.set(true);
        
        // Wait for dialog to render, then load editor
        setTimeout(() => {
            this.loadEditor();
        }, 100);
    }

    private loadEditor(): void {
        if (!this.editorContainer || !this.selectedWidget()) return;
        
        console.log('=== LOADING EDITOR ===');
        console.log('Editor container:', this.editorContainer);
        console.log('Selected widget:', this.selectedWidget());
        
        // Clear previous editor
        this.editorContainer.clear();
        if (this.editorComponentRef) {
            this.editorComponentRef.destroy();
        }
        
        const widget = this.selectedWidget()!;
        const editorComponent = this.getWidgetEditorComponent(widget.type);
        
        if (editorComponent) {
            console.log('Creating editor component for:', widget.type);
            this.editorComponentRef = this.editorContainer.createComponent(editorComponent);
            
            // Set inputs
            this.editorComponentRef.instance.config = widget;
            console.log('Config set on editor:', widget);
            
            // Manually trigger change detection to ensure ngOnChanges is called
            this.editorComponentRef.changeDetectorRef.detectChanges();
            
            // Subscribe to outputs
            if (this.editorComponentRef.instance.update) {
                console.log('Subscribing to update event');
                this.editorComponentRef.instance.update.subscribe((settings: any) => {
                    console.log('=== UPDATE EVENT RECEIVED ===');
                    console.log('Settings:', settings);
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

        console.log('Updating widget content:', { widgetId: selected.id, settings: updatedSettings });
        console.log('ImageUrl being saved:', updatedSettings.imageUrl);

        // Create a new widget object to trigger change detection
        const updatedWidget: WidgetConfig = {
            ...selected,
            settings: { ...updatedSettings },
            title: updatedSettings.title || selected.type
        };
        
        console.log('Updated widget to save:', updatedWidget);
        console.log('Settings in updated widget:', updatedWidget.settings);
        
        const currentWidgets = this.widgets();
        const index = currentWidgets.findIndex(w => w.id === selected.id);
        
        if (index > -1) {
            currentWidgets[index] = updatedWidget;
            this.widgets.set([...currentWidgets]);
            this.selectedWidget.set(updatedWidget);
            
            // Save to backend
            this.saveWidgets();
            
            this.messageService.add({
                severity: 'success',
                summary: 'Content Updated',
                detail: 'Widget content has been updated successfully.'
            });
            
            console.log('Widget updated and saved');
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
        console.log('=== SAVING WIDGETS ===');
        console.log('Widgets to save:', this.widgets());
        
        this.widgetService.saveWidgets(this.widgets()).subscribe({
            next: () => {
                console.log('✓ Widgets saved successfully to backend');
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
}
