import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, from, throwError } from 'rxjs';
import { WidgetConfig } from './widget-config';
import { WIDGET_TYPES, WidgetType } from './widget-registry';
import { TenantSettingsService } from '../core/services/tenant-settings.service';
import { TenantSettingServiceProxy, TenantSettingDto } from '../core/services/service-proxies';
import { switchMap, tap, catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class WidgetService {
    private widgetsSubject = new BehaviorSubject<WidgetConfig[]>([]);
    public widgets$: Observable<WidgetConfig[]> = this.widgetsSubject.asObservable();

    private readonly SETTINGS_KEY = 'landingPageConfig';
    private readonly SEO_SETTINGS_KEY = 'seoSettings';

    // Flag to prevent auto-saving when editing custom pages
    private autoSaveEnabled = true;

    constructor(
        private tenantSettingsService: TenantSettingsService,
        private tenantSettingServiceProxy: TenantSettingServiceProxy
    ) {
        this.loadWidgets();
    }

    private loadWidgets(): void {
        this.tenantSettingsService.loadSettings().then((tenantSettingDto: TenantSettingDto) => {
            if (tenantSettingDto && tenantSettingDto.settings) {
                try {
                    const settings = JSON.parse(tenantSettingDto.settings);
                    if (settings[this.SETTINGS_KEY]) {
                        this.widgetsSubject.next(settings[this.SETTINGS_KEY]);
                    } else {
                        this.widgetsSubject.next([]);
                    }
                } catch (e) {
                    console.error('Error parsing tenant settings value:', e);
                    this.widgetsSubject.next([]);
                }
            } else {
                this.widgetsSubject.next([]);
            }
        });
    }

    public refreshWidgets(): Observable<WidgetConfig[]> {
        return from(this.tenantSettingsService.refreshSettings()).pipe(
            tap((tenantSettingDto: TenantSettingDto) => {
                if (tenantSettingDto && tenantSettingDto.settings) {
                    try {
                        const settings = JSON.parse(tenantSettingDto.settings);
                        if (settings[this.SETTINGS_KEY]) {
                            this.widgetsSubject.next(settings[this.SETTINGS_KEY]);
                        } else {
                            this.widgetsSubject.next([]);
                        }
                    } catch (e) {
                        console.error('Error parsing tenant settings value:', e);
                        this.widgetsSubject.next([]);
                    }
                } else {
                    this.widgetsSubject.next([]);
                }
            }),
            switchMap(() => this.widgets$),
            catchError((error) => {
                console.error('Error refreshing widgets:', error);
                return of([]);
            })
        );
    }

    public saveWidgets(widgets: WidgetConfig[]): Observable<any> {
        // Deep clone the widgets to avoid reference issues
        const widgetsToSave = JSON.parse(JSON.stringify(widgets));

        // Update the in-memory state first
        this.widgetsSubject.next(widgetsToSave);

        return from(this.tenantSettingsService.loadSettings()).pipe(
            switchMap((tenantSettingDto: TenantSettingDto) => {
                let currentSettings: any = {};
                if (tenantSettingDto && tenantSettingDto.settings) {
                    try {
                        currentSettings = JSON.parse(tenantSettingDto.settings);
                    } catch (e) {
                        console.error('Error parsing tenant settings value for saving:', e);
                    }
                }

                // Only update the landingPageConfig key, preserve all other settings
                const updatedSettings = {
                    ...currentSettings,
                    [this.SETTINGS_KEY]: widgetsToSave
                };

                const updateDto = new TenantSettingDto();
                if (tenantSettingDto) {
                    updateDto.init(tenantSettingDto);
                }
                updateDto.settings = JSON.stringify(updatedSettings);

                return this.tenantSettingServiceProxy.tenantSetting_UpdateTenantSetting(updateDto).pipe(
                    tap(() => {
                        this.tenantSettingsService.refreshSettings();
                    })
                );
            }),
            catchError((error) => {
                console.error('✗ Error saving widgets:', error);
                return throwError(() => new Error('Failed to save widgets'));
            })
        );
    }

    getWidgets(): WidgetConfig[] {
        return this.widgetsSubject.getValue();
    }

    /**
     * Load widgets from an external source (e.g., custom pages) without saving to tenant settings
     */
    loadWidgetsFromSource(widgets: WidgetConfig[]): void {
        this.widgetsSubject.next(widgets);
    }

    /**
     * Enable or disable auto-saving to tenant settings
     * Use this when editing custom pages to prevent saving to tenant settings
     */
    setAutoSaveEnabled(enabled: boolean): void {
        this.autoSaveEnabled = enabled;
    }

    /**
     * Check if auto-save is currently enabled
     */
    isAutoSaveEnabled(): boolean {
        return this.autoSaveEnabled;
    }

    addWidget(type: string): void {
        const widgetType: WidgetType | undefined = WIDGET_TYPES.find((t) => t.name === type);
        if (!widgetType) {
            throw new Error(`Widget type "${type}" not found`);
        }

        const newWidget: WidgetConfig = {
            id: this.generateId(),
            type: type,
            settings: { ...widgetType.defaultConfig }
        };

        const currentWidgets = this.getWidgets();
        if (this.autoSaveEnabled) {
            this.saveWidgets([...currentWidgets, newWidget]).subscribe();
        } else {
            this.widgetsSubject.next([...currentWidgets, newWidget]);
        }
    }

    updateWidget(widget: WidgetConfig): void {
        const currentWidgets = this.getWidgets();
        const index = currentWidgets.findIndex((w) => w.id === widget.id);
        if (index > -1) {
            currentWidgets[index] = widget;
            if (this.autoSaveEnabled) {
                this.saveWidgets([...currentWidgets]).subscribe();
            } else {
                this.widgetsSubject.next([...currentWidgets]);
            }
        }
    }

    removeWidget(id: string): void {
        const currentWidgets = this.getWidgets().filter((w) => w.id !== id);
        if (this.autoSaveEnabled) {
            this.saveWidgets(currentWidgets).subscribe();
        } else {
            this.widgetsSubject.next(currentWidgets);
        }
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }

    // SEO Settings methods
    public getSeoSettings(): Observable<any> {
        return from(this.tenantSettingsService.loadSettings()).pipe(
            switchMap((tenantSettingDto: TenantSettingDto) => {
                if (tenantSettingDto && tenantSettingDto.settings) {
                    try {
                        const settings = JSON.parse(tenantSettingDto.settings);
                        if (settings[this.SEO_SETTINGS_KEY]) {
                            return of(settings[this.SEO_SETTINGS_KEY]);
                        }
                    } catch (e) {
                        console.error('Error parsing SEO settings:', e);
                    }
                }
                return of({
                    pageTitle: '',
                    metaDescription: '',
                    metaKeywords: '',
                    ogTitle: '',
                    ogDescription: '',
                    ogImage: '',
                    twitterCard: 'summary_large_image',
                    canonicalUrl: ''
                });
            }),
            catchError((error) => {
                console.error('Error loading SEO settings:', error);
                return of({
                    pageTitle: '',
                    metaDescription: '',
                    metaKeywords: '',
                    ogTitle: '',
                    ogDescription: '',
                    ogImage: '',
                    twitterCard: 'summary_large_image',
                    canonicalUrl: ''
                });
            })
        );
    }

    public saveSeoSettings(seoSettings: any): Observable<any> {
        return from(this.tenantSettingsService.loadSettings()).pipe(
            switchMap((tenantSettingDto: TenantSettingDto) => {
                let currentSettings: any = {};
                if (tenantSettingDto && tenantSettingDto.settings) {
                    try {
                        currentSettings = JSON.parse(tenantSettingDto.settings);
                    } catch (e) {
                        console.error('Error parsing tenant settings value for saving SEO:', e);
                    }
                }

                // Update only the SEO settings key, preserve all other settings
                const updatedSettings = {
                    ...currentSettings,
                    [this.SEO_SETTINGS_KEY]: seoSettings
                };

                const updateDto = new TenantSettingDto();
                if (tenantSettingDto) {
                    updateDto.init(tenantSettingDto);
                }
                updateDto.settings = JSON.stringify(updatedSettings);

                return this.tenantSettingServiceProxy.tenantSetting_UpdateTenantSetting(updateDto).pipe(
                    tap(() => {
                    })
                );
            }),
            catchError((error) => {
                console.error('✗ Error saving SEO settings:', error);
                return throwError(() => new Error('Failed to save SEO settings'));
            })
        );
    }
}
