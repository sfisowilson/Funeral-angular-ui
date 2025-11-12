import { CommonModule } from '@angular/common';
import { Component, OnInit, ComponentFactoryResolver, ViewChild, ViewContainerRef, OnDestroy } from '@angular/core';
import { WidgetService } from '@app/building-blocks/widget.service';
import { WidgetConfig } from '@app/building-blocks/widget-config';
import { WIDGET_TYPES, WidgetType } from '@app/building-blocks/widget-registry';
import { Subscription } from 'rxjs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { WidgetWrapperComponent } from '@app/building-blocks/widget-wrapper/widget-wrapper.component'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-landing-page',
    standalone: true,
    imports: [CommonModule, DragDropModule, DialogModule, ButtonModule],
    templateUrl: './landing-page.component.html',
    styleUrl: './landing-page.component.css'
})
export class LandingPageComponent implements OnInit, OnDestroy {
    @ViewChild('widgetContainer', { read: ViewContainerRef, static: true }) widgetContainer!: ViewContainerRef;
    @ViewChild('editorContainer', { read: ViewContainerRef }) editorContainer!: ViewContainerRef;

    widgets: WidgetConfig[] = [];
    widgetTypes: WidgetType[] = WIDGET_TYPES;
    showAddWidgetModal = false;
    editingWidget: WidgetConfig | null = null;

    private widgetSubscription!: Subscription;

    constructor(
        private widgetService: WidgetService,
        private componentFactoryResolver: ComponentFactoryResolver
    ) {}

    ngOnInit(): void {
        this.widgetSubscription = this.widgetService.widgets$.subscribe((widgets: WidgetConfig[]) => {
            this.widgets = widgets;
            this.renderWidgets();
        });
    }

    ngOnDestroy(): void {
        if (this.widgetSubscription) {
            this.widgetSubscription.unsubscribe();
        }
    }

    renderWidgets(): void {
        this.widgetContainer.clear();
        this.widgets.forEach((widget) => {
            const componentRef = this.widgetContainer.createComponent(WidgetWrapperComponent);
            componentRef.instance.widgetConfig = widget;
            componentRef.instance.edit.subscribe((editedWidget: WidgetConfig) => this.editWidget(editedWidget));
            componentRef.instance.delete.subscribe((widgetId: string) => this.deleteWidget(widgetId));
        });
    }

    addWidget(type: string): void {
        this.widgetService.addWidget(type);
        this.showAddWidgetModal = false;
    }

    editWidget(widget: WidgetConfig): void {
        this.editingWidget = widget;
        const widgetType = this.widgetTypes.find((t) => t.name === widget.type);
        if (widgetType) {
            setTimeout(() => {
                if (this.editorContainer) {
                    this.editorContainer.clear();
                    const componentRef = this.editorContainer.createComponent(widgetType.editorComponent);
                    componentRef.instance.config = widget;
                    componentRef.instance.update.subscribe((updatedSettings: any) => {
                        widget.settings = updatedSettings;
                        this.widgetService.updateWidget(widget);
                    });

                    // Manually trigger ngOnChanges to ensure the form is updated
                    if (componentRef.instance.ngOnChanges) {
                        componentRef.instance.ngOnChanges({ config: { currentValue: widget, previousValue: null, isFirstChange: () => true } });
                    }
                }
            }, 0);
        }
    }

    deleteWidget(id: string): void {
        if (confirm('Are you sure you want to delete this widget?')) {
            this.widgetService.removeWidget(id);
        }
    }

    drop(event: CdkDragDrop<WidgetConfig[]>) {
        moveItemInArray(this.widgets, event.previousIndex, event.currentIndex);
        this.renderWidgets();
    }

    saveLayout(): void {
        this.widgetService.saveWidgets(this.widgets).subscribe(() => {
            console.log('Layout saved successfully!');
        });
    }
}
