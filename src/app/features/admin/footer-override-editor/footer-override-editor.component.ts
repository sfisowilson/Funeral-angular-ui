import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { skip } from 'rxjs/operators';
import { PageBuilderComponent } from '../../../building-blocks/page-builder/page-builder.component';
import { WidgetService } from '../../../building-blocks/widget.service';
import { WidgetConfig } from '../../../building-blocks/widget-config';
import { WIDGET_TYPES } from '../../../building-blocks/widget-registry';

@Component({
    selector: 'app-footer-override-editor',
    standalone: true,
    imports: [CommonModule, PageBuilderComponent],
    providers: [WidgetService],
    template: `
        <div class="footer-override-editor">
            <div class="p-3 bg-amber-50 text-sm text-amber-800 flex items-center gap-2"
                 style="border-bottom: 1px solid #fbbf24; border-top: 1px solid #fbbf24; margin-bottom: 0.5rem;">
                <i class="pi pi-exclamation-triangle"></i>
                <span>
                    When widgets are added here, they <strong>replace</strong> the global footer on this page only.
                    Remove all widgets to fall back to the global footer.
                </span>
            </div>
            <app-page-builder></app-page-builder>
        </div>
    `
})
export class FooterOverrideEditorComponent implements OnInit, OnDestroy {
    @Output() footerChanged = new EventEmitter<void>();

    private sub?: Subscription;

    constructor(private widgetService: WidgetService) {}

    ngOnInit(): void {
        this.widgetService.setAutoSaveEnabled(false);
        this.sub = this.widgetService.widgets$.pipe(skip(1)).subscribe(() => {
            this.footerChanged.emit();
        });
    }

    loadWidgets(rawWidgets: any[]): void {
        const widgets: WidgetConfig[] = (rawWidgets || []).map((w: any) => {
            const widgetType = WIDGET_TYPES.find((t) => t.name === w.type);
            const rawConfig = w.config;
            const settings =
                rawConfig && typeof rawConfig === 'object' && rawConfig.settings
                    ? rawConfig.settings
                    : rawConfig ?? w.settings ?? {};
            return {
                id: w.id || `fw-${Date.now()}-${Math.random()}`,
                type: w.type,
                settings: { ...(widgetType?.defaultConfig || {}), ...(settings || {}) },
                layout: rawConfig?.layout ?? w.layout
            };
        });
        this.widgetService.loadWidgetsFromSource(widgets);
    }

    getWidgets(): WidgetConfig[] {
        return this.widgetService.getWidgets();
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
        this.widgetService.setAutoSaveEnabled(true);
    }
}
