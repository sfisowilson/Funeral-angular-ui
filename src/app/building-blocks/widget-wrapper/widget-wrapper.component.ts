import { Component, Input, Output, EventEmitter, ViewChild, ViewContainerRef, OnInit, OnDestroy, ComponentFactoryResolver } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetConfig } from '../widget-config';
import { WIDGET_TYPES } from '../widget-registry';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-widget-wrapper',
    standalone: true,
    imports: [CommonModule, CdkDrag],
    template: `
        <div class="widget-box" cdkDrag>
            <div class="widget-controls" cdkDragHandle>
                <button (click)="editWidget()" class="p-2 rounded-full hover:bg-gray-200">
                    <i class="pi pi-pencil text-lg"></i>
                </button>
                <button (click)="deleteWidget()" class="p-2 rounded-full hover:bg-gray-200">
                    <i class="pi pi-trash text-lg"></i>
                </button>
            </div>
            <ng-container #widgetHost></ng-container>
        </div>
    `,
    styles: [
        `
            .widget-box {
                border: 1px dashed #ccc;
                margin-bottom: 10px;
                position: relative;
                padding: 10px;
                cursor: grab;
            }
            .widget-controls {
                position: absolute;
                top: 5px;
                right: 5px;
                z-index: 10;
                cursor: grab;
                display: flex;
                gap: 0.5rem;
            }
        `
    ]
})
export class WidgetWrapperComponent implements OnInit, OnDestroy {
    @Input() widgetConfig!: WidgetConfig;
    @Output() edit = new EventEmitter<WidgetConfig>();
    @Output() delete = new EventEmitter<string>();

    @ViewChild('widgetHost', { read: ViewContainerRef, static: true }) widgetHost!: ViewContainerRef;

    constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

    ngOnInit(): void {
        this.loadComponent();
    }

    ngOnDestroy(): void {
        this.widgetHost.clear();
    }

    loadComponent(): void {
        const widgetType = WIDGET_TYPES.find((t) => t.name === this.widgetConfig.type);
        if (widgetType) {
            const factory = this.componentFactoryResolver.resolveComponentFactory(widgetType.component);
            const componentRef = this.widgetHost.createComponent(factory);
            (<any>componentRef.instance).config = this.widgetConfig;
        }
    }

    editWidget(): void {
        this.edit.emit(this.widgetConfig);
    }

    deleteWidget(): void {
        this.delete.emit(this.widgetConfig.id);
    }
}
