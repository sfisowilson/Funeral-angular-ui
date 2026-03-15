import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { debounceTime, skip } from 'rxjs/operators';
import { PageBuilderComponent } from '../../../building-blocks/page-builder/page-builder.component';
import { WidgetService } from '../../../building-blocks/widget.service';
import { WidgetConfig } from '../../../building-blocks/widget-config';
import { WIDGET_TYPES } from '../../../building-blocks/widget-registry';
import { TenantSettingsService } from '../../../core/services/tenant-settings.service';
import { TenantSettingServiceProxy, TenantSettingDto } from '../../../core/services/service-proxies';

@Component({
    selector: 'app-footer-builder-dialog',
    standalone: true,
    imports: [CommonModule, DialogModule, ButtonModule, ToastModule, PageBuilderComponent],
    providers: [WidgetService, MessageService],
    templateUrl: './footer-builder-dialog.component.html',
    styleUrl: './footer-builder-dialog.component.scss'
})
export class FooterBuilderDialogComponent implements OnInit, OnDestroy {
    visible = false;
    saving = false;
    lastSaved: Date | null = null;

    private readonly FOOTER_CONFIG_KEY = 'footerConfig';
    private widgetSubscription?: Subscription;

    constructor(
        private widgetService: WidgetService,
        private tenantSettingsService: TenantSettingsService,
        private tenantSettingServiceProxy: TenantSettingServiceProxy,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.widgetService.setAutoSaveEnabled(false);
    }

    open(): void {
        this.visible = true;
        this.loadFooterConfig();
    }

    close(): void {
        this.visible = false;
        this.widgetSubscription?.unsubscribe();
    }

    private loadFooterConfig(): void {
        this.tenantSettingsService.loadSettings().then((dto: TenantSettingDto) => {
            let footerWidgets: WidgetConfig[] = [];
            if (dto?.settings) {
                try {
                    const settings = JSON.parse(dto.settings);
                    const raw: any[] = settings[this.FOOTER_CONFIG_KEY] || [];
                    footerWidgets = raw.map((w: any) => {
                        const widgetType = WIDGET_TYPES.find((t) => t.name === w.type);
                        const rawConfig = w.config;
                        const settings2 =
                            rawConfig && typeof rawConfig === 'object' && rawConfig.settings
                                ? rawConfig.settings
                                : rawConfig ?? w.settings ?? {};
                        return {
                            id: w.id || `fw-${Date.now()}-${Math.random()}`,
                            type: w.type,
                            settings: { ...(widgetType?.defaultConfig || {}), ...(settings2 || {}) },
                            layout: rawConfig?.layout ?? w.layout
                        };
                    });
                } catch (e) {
                    console.error('Error parsing footer config:', e);
                }
            }
            this.widgetService.loadWidgetsFromSource(footerWidgets);

            // Subscribe to widget changes and auto-save after 2 seconds of inactivity
            this.widgetSubscription?.unsubscribe();
            this.widgetSubscription = this.widgetService.widgets$
                .pipe(skip(1), debounceTime(2000))
                .subscribe(() => this.saveFooterConfig());
        });
    }

    private saveFooterConfig(): void {
        if (this.saving) return;
        this.saving = true;

        const widgets = this.widgetService.getWidgets();
        const footerConfig = widgets.map((w, i) => ({
            id: w.id,
            type: w.type,
            config: { settings: w.settings, layout: w.layout },
            order: i
        }));

        this.tenantSettingsService.loadSettings().then((dto: TenantSettingDto) => {
            let currentSettings: any = {};
            if (dto?.settings) {
                try {
                    currentSettings = JSON.parse(dto.settings);
                } catch (e) {
                    console.error('Error parsing settings:', e);
                }
            }

            const updatedSettings = { ...currentSettings, [this.FOOTER_CONFIG_KEY]: footerConfig };

            const updateDto = new TenantSettingDto();
            if (dto) updateDto.init(dto);
            updateDto.settings = JSON.stringify(updatedSettings);

            this.tenantSettingServiceProxy.tenantSetting_UpdateTenantSetting(updateDto).subscribe({
                next: () => {
                    this.tenantSettingsService.refreshSettings();
                    this.saving = false;
                    this.lastSaved = new Date();
                },
                error: (err) => {
                    console.error('Error saving footer config:', err);
                    this.saving = false;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save footer widgets' });
                }
            });
        });
    }

    getTimeSince(date: Date): string {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        return `${Math.floor(minutes / 60)}h ago`;
    }

    ngOnDestroy(): void {
        this.widgetSubscription?.unsubscribe();
        this.widgetService.setAutoSaveEnabled(true);
    }
}
