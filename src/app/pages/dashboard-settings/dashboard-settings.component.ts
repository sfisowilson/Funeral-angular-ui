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
import { DashboardWidgetsService } from '../../core/services/generated/dashboard-widgets/dashboard-widgets.service';
import { RoleService } from '../../core/services/generated/role/role.service';
import { 
    DashboardWidgetDto,
    RoleDto
} from '../../core/models';

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
    providers: [MessageService],
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
        private dashboardWidgetService: DashboardWidgetsService,
        private roleService: RoleService
    ) {}

    ngOnInit() {
        this.loadRoles();
        this.loadWidgets();
    }

    loadRoles() {
        this.roleService.getApiRoleRoleGetAllRoles().subscribe({
            next: (roles: RoleDto[]) => {
                const roleOptions = roles.map(role => ({
                    label: role.name || '',
                    value: role.name || ''
                }));
                this.availableRoles.set(roleOptions);
            },
            error: (error: any) => {
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
        this.dashboardWidgetService.getApiDashboardWidgetDashboardWidgetGetAll<DashboardWidgetDto[]>().subscribe({
            next: (settings: DashboardWidgetDto[]) => {
                const mappedWidgets = settings.map(dto => {
                    // Parse configuration JSON if it exists
                    let config: any = {};
                    try {
                        config = dto.configuration ? JSON.parse(dto.configuration) : {};
                    } catch (e) {
                        console.warn('Failed to parse widget configuration', e);
                    }
                    
                    return {
                        id: dto.id?.toString(),
                        widgetKey: dto.type,
                        widgetName: dto.name,
                        isVisible: dto.isEnabled ?? true,
                        allowedRoles: config.allowedRoles ?? [],
                        displayOrder: dto.order ?? 0
                    };
                });
                this.widgets.set(mappedWidgets);
                this.loading.set(false);
            },
            error: (error: any) => {
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
            const updateDto: DashboardWidgetDto = {
                id: this.currentWidget.id || '',
                name: this.currentWidget.widgetName || '',
                type: this.currentWidget.widgetKey || '',
                configuration: JSON.stringify({ allowedRoles: this.currentWidget.allowedRoles }),
                isEnabled: this.currentWidget.isVisible,
                order: this.currentWidget.displayOrder
            };

            this.dashboardWidgetService.putApiDashboardWidgetDashboardWidgetUpdate<DashboardWidgetDto>(updateDto).subscribe({
                next: (result) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Widget updated successfully'
                    });
                    this.showDialog.set(false);
                    this.loadWidgets();
                },
                error: (error: any) => {
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
            const createDto: DashboardWidgetDto = {
                id: '',
                name: this.currentWidget.widgetName || '',
                type: this.currentWidget.widgetKey || '',
                configuration: JSON.stringify({ allowedRoles: this.currentWidget.allowedRoles }),
                isEnabled: this.currentWidget.isVisible,
                order: this.currentWidget.displayOrder
            };

            this.dashboardWidgetService.postApiDashboardWidgetDashboardWidgetCreate<DashboardWidgetDto>(createDto).subscribe({
                next: (result) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Widget created successfully'
                    });
                    this.showDialog.set(false);
                    this.loadWidgets();
                },
                error: (error: any) => {
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

        this.dashboardWidgetService.postApiDashboardWidgetDashboardWidgetInitializeDefaults<any>().subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Default widgets initialized successfully'
                });
                this.loadWidgets();
            },
            error: (error: any) => {
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
