import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabViewModule } from 'primeng/tabview';
import { TextareaModule } from 'primeng/textarea';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PlanConfigurationServiceProxy, SubscriptionPlanConfigurationDto, CreatePlanConfigurationDto, UpdatePlanConfigurationDto, Permission, PermissionServiceProxy } from '../../../core/services/service-proxies';
import { WidgetType, WIDGET_TYPES } from '../../../building-blocks/widget-registry';

interface PlanGroup {
    planName: string;
    configurations: SubscriptionPlanConfigurationDto[];
}

@Component({
    selector: 'app-plan-configuration',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, CardModule, DialogModule, DropdownModule, InputNumberModule, InputTextModule, InputSwitchModule, CheckboxModule, ToastModule, ConfirmDialogModule, TabViewModule, TextareaModule],
    providers: [MessageService, ConfirmationService],
    templateUrl: './plan-configuration.component.html',
    styleUrls: ['./plan-configuration.component.scss']
})
export class PlanConfigurationComponent implements OnInit {
    allConfigurations = signal<SubscriptionPlanConfigurationDto[]>([]);
    planGroups = signal<PlanGroup[]>([]);
    availablePermissions: Permission[] = [];
    availableWidgets: WidgetType[] = WIDGET_TYPES;
    loadingPermissions = false;
    missingPermissions: string[] = [];
    private normalizedSelectedPermissionSet = new Set<string>();
    customPermissionName = '';

    proRataEnabled = false;
    savingProRata = false;

    showDialog = false;
    editMode = false;
    currentConfig: SubscriptionPlanConfigurationDto | null = null;

    // Form model - Feature-based plans (no tenant type selection)
    formData = {
        planName: '',
        description: '',
        monthlyPrice: 0,
        yearlyPrice: 0,
        isActive: true,
        displayOrder: 0,

        // Limits
        maxUsers: 10,
        maxStorageMB: 1024,
        maxProducts: 100,
        maxMembers: 100,
        maxProductImagesPerProduct: 10,
        maxActiveOrders: 50,
        maxLandingPages: 5,
        maxEmailTemplates: 10,
        maxCustomForms: 5,

        // API Limits
        apiRateLimitPerMinute: 60,
        apiRateLimitPerDay: 10000,

        // Overage
        allowOverage: false,
        overageUserPrice: 5,
        overageStoragePricePerGB: 2,
        overageProductPricePer100: 10,
        overageMemberPricePer100: 10,

        // Features
        canUploadFiles: true,
        canCreateSubAccounts: false,
        canExportData: true,
        canUseAPI: false,
        canUseLandingPageBuilder: true,
        canUseCustomDomain: false,
        canAccessAdvancedReports: false,
        canUseWhiteLabel: false,
        hasPrioritySupport: false,

        // Alerts & Trial
        sendUsageAlerts: true,
        usageAlertThresholdPercent: 80,
        trialDays: 14,
        requiresCreditCard: false,
        canDowngrade: true,
        canUpgrade: true,
        permissionNames: [] as string[],
        widgetKeys: [] as string[]
    };

    constructor(
        private planConfigService: PlanConfigurationServiceProxy,
        private permissionService: PermissionServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.loadConfigurations();
        this.loadPermissions();
        this.loadProRataSetting();
    }

    loadConfigurations(): void {
        this.planConfigService.planConfiguration_GetAll().subscribe({
            next: (response) => {
                const configs = response?.result || [];
                this.allConfigurations.set(configs);

                // Group configurations by plan name
                const groups: { [key: string]: SubscriptionPlanConfigurationDto[] } = {};
                configs.forEach((config) => {
                    if (!groups[config.planName]) {
                        groups[config.planName] = [];
                    }
                    groups[config.planName].push(config);
                });

                // Convert to array of groups
                const planGroups: PlanGroup[] = Object.entries(groups).map(([planName, configurations]) => ({
                    planName,
                    configurations
                }));

                this.planGroups.set(planGroups);
            },
            error: (error) => {
                console.error('Error loading configurations:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load plan configurations'
                });
            }
        });
    }

    loadPermissions(): void {
        this.loadingPermissions = true;
        this.permissionService.permission_GetAllPermissions().subscribe({
            next: (response) => {
                const permissions = response?.result || [];
                this.availablePermissions = permissions.sort((a, b) => {
                    const nameA = a.name ?? '';
                    const nameB = b.name ?? '';
                    return nameA.localeCompare(nameB);
                });
                this.loadingPermissions = false;
                this.recomputeMissingPermissions();
            },
            error: (error) => {
                console.error('Error loading permissions:', error);
                this.loadingPermissions = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load permissions'
                });
            }
        });
    }

    openNewDialog(): void {
        this.editMode = false;
        this.currentConfig = null;
        this.resetForm();
        this.showDialog = true;
    }

    openEditDialog(config: SubscriptionPlanConfigurationDto): void {
        this.editMode = true;
        this.currentConfig = config;
        this.populateForm(config);
        this.showDialog = true;
    }

    resetForm(): void {
        this.formData = {
            planName: '',
            description: '',
            monthlyPrice: 0,
            yearlyPrice: 0,
            isActive: true,
            displayOrder: 0,
            maxUsers: 10,
            maxStorageMB: 1024,
            maxProducts: 100,
            maxMembers: 100,
            maxProductImagesPerProduct: 10,
            maxActiveOrders: 50,
            maxLandingPages: 5,
            maxEmailTemplates: 10,
            maxCustomForms: 5,
            apiRateLimitPerMinute: 60,
            apiRateLimitPerDay: 10000,
            allowOverage: false,
            overageUserPrice: 5,
            overageStoragePricePerGB: 2,
            overageProductPricePer100: 10,
            overageMemberPricePer100: 10,
            canUploadFiles: true,
            canCreateSubAccounts: false,
            canExportData: true,
            canUseAPI: false,
            canUseLandingPageBuilder: true,
            canUseCustomDomain: false,
            canAccessAdvancedReports: false,
            canUseWhiteLabel: false,
            hasPrioritySupport: false,
            sendUsageAlerts: true,
            usageAlertThresholdPercent: 80,
            trialDays: 14,
            requiresCreditCard: false,
            canDowngrade: true,
            canUpgrade: true,
            permissionNames: [],
            widgetKeys: []
        };
        this.recomputeMissingPermissions();
    }

    populateForm(config: SubscriptionPlanConfigurationDto): void {
        this.formData = {
            planName: config.planName || '',
            description: config.description || '',
            monthlyPrice: config.monthlyPrice,
            yearlyPrice: config.yearlyPrice,
            isActive: config.isActive,
            displayOrder: config.displayOrder,
            maxUsers: config.maxUsers,
            maxStorageMB: config.maxStorageMB,
            maxProducts: config.maxProducts || 100,
            maxMembers: config.maxMembers || 100,
            maxProductImagesPerProduct: config.maxProductImagesPerProduct || 10,
            maxActiveOrders: config.maxActiveOrders || 50,
            maxLandingPages: config.maxLandingPages,
            maxEmailTemplates: config.maxEmailTemplates,
            maxCustomForms: config.maxCustomForms,
            apiRateLimitPerMinute: config.apiRateLimitPerMinute,
            apiRateLimitPerDay: config.apiRateLimitPerDay,
            allowOverage: config.allowOverage,
            overageUserPrice: config.overageUserPrice,
            overageStoragePricePerGB: config.overageStoragePricePerGB,
            overageProductPricePer100: config.overageProductPricePer100 || 10,
            overageMemberPricePer100: config.overageMemberPricePer100 || 10,
            canUploadFiles: config.canUploadFiles,
            canCreateSubAccounts: config.canCreateSubAccounts,
            canExportData: config.canExportData,
            canUseAPI: config.canUseAPI,
            canUseLandingPageBuilder: config.canUseLandingPageBuilder,
            canUseCustomDomain: config.canUseCustomDomain,
            canAccessAdvancedReports: config.canAccessAdvancedReports,
            canUseWhiteLabel: config.canUseWhiteLabel,
            hasPrioritySupport: config.hasPrioritySupport,
            sendUsageAlerts: config.sendUsageAlerts,
            usageAlertThresholdPercent: config.usageAlertThresholdPercent,
            trialDays: config.trialDays,
            requiresCreditCard: config.requiresCreditCard,
            canDowngrade: config.canDowngrade,
            canUpgrade: config.canUpgrade,
            permissionNames: config.permissionNames ? [...config.permissionNames] : [],
            widgetKeys: config.widgetKeys ? [...config.widgetKeys] : []
        };
        this.recomputeMissingPermissions();
    }

    saveConfiguration(): void {
        if (!this.formData.planName) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Plan name is required'
            });
            return;
        }

        if (this.editMode && this.currentConfig) {
            this.updateConfiguration();
        } else {
            this.createConfiguration();
        }
    }

    createConfiguration(): void {
        const dto = CreatePlanConfigurationDto.fromJS({
            ...this.formData
        });

        this.planConfigService.planConfiguration_Create(dto).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Plan configuration created successfully'
                });
                this.showDialog = false;
                this.loadConfigurations();
            },
            error: (error) => {
                console.error('Error creating configuration:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to create plan configuration'
                });
            }
        });
    }

    updateConfiguration(): void {
        if (!this.currentConfig) return;

        const dto = UpdatePlanConfigurationDto.fromJS({
            id: this.currentConfig.id,
            ...this.formData
        });

        this.planConfigService.planConfiguration_Update(dto).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Plan configuration updated successfully'
                });
                this.showDialog = false;
                this.loadConfigurations();
                this.syncTenantsForPlan(dto.id);
            },
            error: (error) => {
                console.error('Error updating configuration:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update plan configuration'
                });
            }
        });
    }

    deleteConfiguration(config: SubscriptionPlanConfigurationDto): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete ${config.planName}?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.planConfigService.planConfiguration_Delete(config.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Plan configuration deleted successfully'
                        });
                        this.loadConfigurations();
                    },
                    error: (error) => {
                        console.error('Error deleting configuration:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete plan configuration'
                        });
                    }
                });
            }
        });
    }

    getTenantTypeName(tenantType: number): string {
        // This method is no longer needed as plans are generic
        return 'Feature-based Plan';
    }

    loadProRataSetting(): void {
        this.planConfigService.planConfiguration_GetProRataSetting().subscribe({
            next: (response) => {
                this.proRataEnabled = response?.result || false;
            },
            error: (error) => {
                console.error('Error loading pro-rata setting:', error);
            }
        });
    }

    toggleProRata(): void {
        this.savingProRata = true;
        this.planConfigService.planConfiguration_UpdateProRataSetting(this.proRataEnabled).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Pro-rata billing ${this.proRataEnabled ? 'enabled' : 'disabled'} successfully`
                });
                this.savingProRata = false;
            },
            error: (error) => {
                console.error('Error updating pro-rata setting:', error);
                this.proRataEnabled = !this.proRataEnabled; // Revert on error
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update pro-rata billing setting'
                });
                this.savingProRata = false;
            }
        });
    }

    closeDialog(): void {
        this.showDialog = false;
        this.currentConfig = null;
    }

    isPermissionSelected(name?: string): boolean {
        if (!name) {
            return false;
        }

        const normalizedTarget = this.normalizePermissionName(name);
        return this.formData.permissionNames.some((existing) => this.normalizePermissionName(existing) === normalizedTarget);
    }

    onPermissionToggle(name: string | undefined, checked: boolean): void {
        if (!name) {
            return;
        }

        const normalized = this.normalizePermissionName(name);
        if (!normalized) {
            return;
        }

        const trimmedName = name.trim();
        let updated = [...this.formData.permissionNames];

        if (checked) {
            const alreadySelected = updated.some((existing) => this.normalizePermissionName(existing) === normalized);
            if (!alreadySelected) {
                updated.push(trimmedName);
            }
        } else {
            updated = updated.filter((existing) => this.normalizePermissionName(existing) !== normalized);
        }

        this.formData.permissionNames = updated;
        this.recomputeMissingPermissions();
    }

    addCustomPermission(): void {
        const normalized = this.normalizePermissionName(this.customPermissionName);
        if (!normalized) {
            return;
        }

        const alreadyExists = this.formData.permissionNames.some((existing) => this.normalizePermissionName(existing) === normalized);
        if (!alreadyExists) {
            this.formData.permissionNames = [...this.formData.permissionNames, this.customPermissionName.trim()];
            this.recomputeMissingPermissions();
        }

        this.customPermissionName = '';
    }

    isWidgetSelected(key?: string): boolean {
        return !!key && this.formData.widgetKeys.includes(key);
    }

    toggleWidget(key: string | undefined): void {
        if (!key) {
            return;
        }

        const updated = new Set(this.formData.widgetKeys);
        if (updated.has(key)) {
            updated.delete(key);
        } else {
            updated.add(key);
        }

        this.formData.widgetKeys = Array.from(updated);
    }

    formatWidgetLabel(key?: string): string {
        if (!key) {
            return '';
        }

        return key
            .split(/[-_]/g)
            .map((segment) => (segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : ''))
            .join(' ');
    }

    private normalizePermissionName(name?: string): string {
        return (name ?? '').trim().toLowerCase();
    }

    private recomputeMissingPermissions(): void {
        const normalizedAvailable = new Set(this.availablePermissions.map((permission) => this.normalizePermissionName(permission.name)).filter((normalized) => normalized.length > 0));

        const missingNames = new Map<string, string>();
        const normalizedSelected = new Set<string>();

        for (const rawName of this.formData.permissionNames) {
            const normalized = this.normalizePermissionName(rawName);
            if (!normalized) {
                continue;
            }

            normalizedSelected.add(normalized);

            if (!normalizedAvailable.has(normalized) && !missingNames.has(normalized)) {
                missingNames.set(normalized, rawName.trim());
            }
        }

        this.normalizedSelectedPermissionSet = normalizedSelected;
        this.missingPermissions = Array.from(missingNames.values());
    }

    private syncTenantsForPlan(planConfigId?: string): void {
        if (!planConfigId) {
            return;
        }

        this.planConfigService.planConfiguration_SyncTenants(planConfigId).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'info',
                    summary: 'Tenants synced',
                    detail: 'Existing tenants now have the latest plan permissions and widgets'
                });
            },
            error: (error) => {
                console.error('Error syncing tenants for plan:', error);
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Sync delayed',
                    detail: 'Failed to apply changes to existing tenants. Try again later.'
                });
            }
        });
    }
}
