import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DASHBOARD_WIDGETS } from '../dashboard/dashboard-widgets.registry';
import { 
    DashboardWidgetServiceProxy, 
    DashboardWidgetSettingDto,
    CreateDashboardWidgetSettingDto,
    UpdateDashboardWidgetSettingDto,
    RoleServiceProxy,
    RoleDto
} from '../../core/services/service-proxies';

// Local interface for component state
interface WidgetSetting {
    id?: string;
    widgetKey?: string;
    widgetName?: string;
    isVisible: boolean;
    allowedRoles?: string[];
    displayOrder: number;
}

@Component({
    selector: 'app-dashboard-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputSwitchModule,
        MultiSelectModule,
        InputNumberModule,
        ToastModule
    ],
    providers: [MessageService, DashboardWidgetServiceProxy, RoleServiceProxy],
    templateUrl: './dashboard-settings.component.html',
    styleUrl: './dashboard-settings.component.scss'
})
export class DashboardSettingsComponent implements OnInit {
    widgets = signal<WidgetSetting[]>([]);
    loading = signal(false);
    showDialog = signal(false);
    isEditMode = signal(false);
    currentWidget: WidgetSetting = {
        id: '00000000-0000-0000-0000-000000000000',
        widgetKey: '',
        widgetName: '',
        isVisible: true,
        allowedRoles: [],
        displayOrder: 0
    };

    availableRoles = signal<{ label: string; value: string }[]>([]);

    availableWidgets = DASHBOARD_WIDGETS.map(w => ({
        label: w.name,
        value: w.key
    }));

    constructor(
        private messageService: MessageService,
        private dashboardWidgetService: DashboardWidgetServiceProxy,
        private roleService: RoleServiceProxy
    ) {}

    ngOnInit() {
        this.loadRoles();
        this.loadWidgets();
    }

    loadRoles() {
        this.roleService.role_GetAllRoles().subscribe({
            next: (roles: RoleDto[]) => {
                const roleOptions = roles.map(role => ({
                    label: role.name || '',
                    value: role.name || ''
                }));
                this.availableRoles.set(roleOptions);
            },
            error: (error) => {
                console.error('Error loading roles:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load roles'
                });
            }
        });
    }

    loadWidgets() {
        this.loading.set(true);
        this.dashboardWidgetService.dashboardWidget_GetAll().subscribe({
            next: (result) => {
                const mappedWidgets = result.map(dto => ({
                    id: dto.id?.toString(),
                    widgetKey: dto.widgetKey,
                    widgetName: dto.widgetName,
                    isVisible: dto.isVisible ?? true,
                    allowedRoles: dto.allowedRoles ?? [],
                    displayOrder: dto.displayOrder ?? 0
                }));
                this.widgets.set(mappedWidgets);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading dashboard widgets:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load dashboard widgets'
                });
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
            displayOrder: this.widgets().length + 1
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
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields'
            });
            return;
        }

        this.loading.set(true);

        if (this.isEditMode()) {
            const updateDto = new UpdateDashboardWidgetSettingDto({
                id: this.currentWidget.id || '',
                isVisible: this.currentWidget.isVisible,
                allowedRoles: this.currentWidget.allowedRoles || [],
                displayOrder: this.currentWidget.displayOrder
            });

            this.dashboardWidgetService.dashboardWidget_Update(updateDto).subscribe({
                next: (result) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Widget updated successfully'
                    });
                    this.showDialog.set(false);
                    this.loadWidgets();
                },
                error: (error) => {
                    console.error('Error saving widget:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save widget'
                    });
                    this.loading.set(false);
                }
            });
        } else {
            const createDto = new CreateDashboardWidgetSettingDto({
                widgetKey: this.currentWidget.widgetKey || '',
                widgetName: this.currentWidget.widgetName || '',
                isVisible: this.currentWidget.isVisible,
                allowedRoles: this.currentWidget.allowedRoles || [],
                displayOrder: this.currentWidget.displayOrder
            });

            this.dashboardWidgetService.dashboardWidget_Create(createDto).subscribe({
                next: (result) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Widget created successfully'
                    });
                    this.showDialog.set(false);
                    this.loadWidgets();
                },
                error: (error) => {
                    console.error('Error saving widget:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save widget'
                    });
                    this.loading.set(false);
                }
            });
        }
    }

    initializeDefaults() {
        this.loading.set(true);

        this.dashboardWidgetService.dashboardWidget_InitializeDefaults().subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Default widgets initialized successfully'
                });
                this.loadWidgets();
            },
            error: (error) => {
                console.error('Error initializing defaults:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to initialize default widgets'
                });
                this.loading.set(false);
            }
        });
    }

    cancel() {
        this.showDialog.set(false);
    }

    onWidgetKeyChange() {
        const selectedWidget = DASHBOARD_WIDGETS.find(w => w.key === this.currentWidget.widgetKey);
        if (selectedWidget) {
            this.currentWidget.widgetName = selectedWidget.name;
        }
    }
}
