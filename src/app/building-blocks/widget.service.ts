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
        this.widgetsSubject.next(widgets);

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

                const updatedSettings = { ...currentSettings, [this.SETTINGS_KEY]: widgets };

                const updateDto = new TenantSettingDto();
                if (tenantSettingDto) {
                    updateDto.init(tenantSettingDto);
                }
                updateDto.settings = JSON.stringify(updatedSettings);

                return this.tenantSettingServiceProxy.tenantSetting_UpdateTenantSetting(updateDto).pipe(
                    tap(() => {
                        console.log('Tenant settings updated on backend.');
                    })
                );
            }),
            catchError((error) => {
                console.error('Error saving widgets:', error);
                return throwError(() => new Error('Failed to save widgets'));
            })
        );
    }

    getWidgets(): WidgetConfig[] {
        return this.widgetsSubject.getValue();
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
        this.saveWidgets([...currentWidgets, newWidget]).subscribe();
    }

    updateWidget(widget: WidgetConfig): void {
        const currentWidgets = this.getWidgets();
        const index = currentWidgets.findIndex((w) => w.id === widget.id);
        if (index > -1) {
            currentWidgets[index] = widget;
            this.saveWidgets([...currentWidgets]).subscribe();
        }
    }

    removeWidget(id: string): void {
        const currentWidgets = this.getWidgets().filter((w) => w.id !== id);
        this.saveWidgets(currentWidgets).subscribe();
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}
