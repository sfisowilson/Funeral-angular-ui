import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DASHBOARD_WIDGETS } from '../dashboard/dashboard-widgets.registry';
import { DashboardWidgetServiceProxy, CreateDashboardWidgetSettingDto, UpdateDashboardWidgetSettingDto, RoleServiceProxy } from '../../core/services/service-proxies';

// Local interface for component state
interface WidgetSetting {
    id?: string;
    widgetKey?: string;
    widgetName?: string;
    isVisible: boolean;
    allowedRoles?: string[];
    displayOrder: number;
    settingsJson?: string;
    layoutJson?: string;
}

@Component({
    selector: 'app-dashboard-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [],
    templateUrl: './dashboard-settings.component.html',
    styleUrl: './dashboard-settings.component.scss'
})
export class DashboardSettingsComponent implements OnInit {
    widgets = signal<WidgetSetting[]>([]);
    loading = signal(false);
    showDialog = signal(false);
    isEditMode = signal(false);
    notification = signal<string | null>(null);
    notificationType = signal<'success' | 'error' | 'warn' | null>(null);
    currentWidget: WidgetSetting = {
        id: '00000000-0000-0000-0000-000000000000',
        widgetKey: '',
        widgetName: '',
        isVisible: true,
        allowedRoles: [],
        displayOrder: 0,
        settingsJson: undefined,
        layoutJson: undefined
    };

    availableRoles = signal<{ label: string; value: string }[]>([]);

    availableWidgets = DASHBOARD_WIDGETS.map((w) => ({
        label: w.name,
        value: w.key
    }));

    constructor(
        private dashboardWidgetService: DashboardWidgetServiceProxy,
        private roleService: RoleServiceProxy
    ) {}

    ngOnInit() {
        this.loadRoles();
        this.loadWidgets();
    }

    loadRoles() {
        this.roleService.role_GetAllRoles().subscribe({
            next: (response) => {
                const roleOptions = response?.result.map((role) => ({
                    label: role.name || '',
                    value: role.name || ''
                }));
                this.availableRoles.set(roleOptions);
            },
            error: (error) => {
                console.error('Error loading roles:', error);
                this.showNotification('error', 'Failed to load roles');
            }
        });
    }

    loadWidgets() {
        this.loading.set(true);
        this.dashboardWidgetService.dashboardWidget_GetAll().subscribe({
            next: (response) => {
                const mappedWidgets = response?.result.map((dto) => ({
                    id: dto.id?.toString(),
                    widgetKey: dto.widgetKey,
                    widgetName: dto.widgetName,
                    isVisible: dto.isVisible ?? true,
                    allowedRoles: dto.allowedRoles ?? [],
                    displayOrder: dto.displayOrder ?? 0,
                    settingsJson: dto.settingsJson,
                    layoutJson: dto.layoutJson
                }));
                this.widgets.set(mappedWidgets);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading dashboard widgets:', error);
                this.showNotification('error', 'Failed to load dashboard widgets');
                this.loading.set(false);
            }
        });
    }

    openNewDialog() {
        this.currentWidget = {
            id: '00000000-0000-0000-0000-000000000000',
            widgetKey: '',
            widgetName: '',
            isVisible: true,
            allowedRoles: ['TenantAdmin'],
            displayOrder: this.widgets().length + 1,
            settingsJson: undefined,
            layoutJson: undefined
        };
        this.isEditMode.set(false);
        this.showDialog.set(true);
    }

    editWidget(widget: WidgetSetting) {
        this.currentWidget = { ...widget };
        this.isEditMode.set(true);
        this.showDialog.set(true);
    }

    saveWidget() {
        if (!this.currentWidget.widgetKey || !this.currentWidget.widgetName) {
            this.showNotification('warn', 'Please fill in all required fields');
            return;
        }

        this.loading.set(true);

        if (this.isEditMode()) {
            const updateDto = new UpdateDashboardWidgetSettingDto({
                id: this.currentWidget.id || '',
                isVisible: this.currentWidget.isVisible,
                allowedRoles: this.currentWidget.allowedRoles || [],
                displayOrder: this.currentWidget.displayOrder,
                settingsJson: this.currentWidget.settingsJson,
                layoutJson: this.currentWidget.layoutJson
            });

            this.dashboardWidgetService.dashboardWidget_Update(updateDto).subscribe({
                next: (result) => {
                    this.showNotification('success', 'Widget updated successfully');
                    this.showDialog.set(false);
                    this.loadWidgets();
                },
                error: (error) => {
                    console.error('Error saving widget:', error);
                    this.showNotification('error', 'Failed to save widget');
                    this.loading.set(false);
                }
            });
        } else {
            const createDto = new CreateDashboardWidgetSettingDto({
                widgetKey: this.currentWidget.widgetKey || '',
                widgetName: this.currentWidget.widgetName || '',
                isVisible: this.currentWidget.isVisible,
                allowedRoles: this.currentWidget.allowedRoles || [],
                displayOrder: this.currentWidget.displayOrder,
                settingsJson: this.currentWidget.settingsJson,
                layoutJson: this.currentWidget.layoutJson
            });

            this.dashboardWidgetService.dashboardWidget_Create(createDto).subscribe({
                next: (result) => {
                    this.showNotification('success', 'Widget created successfully');
                    this.showDialog.set(false);
                    this.loadWidgets();
                },
                error: (error) => {
                    console.error('Error saving widget:', error);
                    this.showNotification('error', 'Failed to save widget');
                    this.loading.set(false);
                }
            });
        }
    }

    initializeDefaults() {
        this.loading.set(true);

        this.dashboardWidgetService.dashboardWidget_InitializeDefaults().subscribe({
            next: (result) => {
                this.showNotification('success', 'Default widgets initialized successfully');
                this.loadWidgets();
            },
            error: (error) => {
                console.error('Error initializing defaults:', error);
                this.showNotification('error', 'Failed to initialize default widgets');
                this.loading.set(false);
            }
        });
    }

    cancel() {
        this.showDialog.set(false);
    }

    onWidgetKeyChange() {
        const selectedWidget = DASHBOARD_WIDGETS.find((w) => w.key === this.currentWidget.widgetKey);
        if (selectedWidget) {
            this.currentWidget.widgetName = selectedWidget.name;
        }
    }

    clearNotification() {
        this.notification.set(null);
        this.notificationType.set(null);
    }

    trackByWidgetId(index: number, widget: WidgetSetting): string | number | undefined {
        return widget.id ?? index;
    }

    private showNotification(type: 'success' | 'error' | 'warn', message: string) {
        this.notificationType.set(type);
        this.notification.set(message);
        setTimeout(() => {
            this.clearNotification();
        }, 4000);
    }
}
