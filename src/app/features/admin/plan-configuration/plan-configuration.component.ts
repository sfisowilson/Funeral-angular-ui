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
import { 
  PlanConfigurationServiceProxy, 
  SubscriptionPlanConfigurationDto,
  CreatePlanConfigurationDto,
  UpdatePlanConfigurationDto,
  LookupServiceProxy 
} from '../../../core/services/service-proxies';

interface TenantTypeOption {
  label: string;
  value: number;
}

interface PlanGroup {
  planName: string;
  configurations: SubscriptionPlanConfigurationDto[];
}

@Component({
  selector: 'app-plan-configuration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    DialogModule,
    DropdownModule,
    InputNumberModule,
    InputTextModule,
    InputSwitchModule,
    CheckboxModule,
    ToastModule,
    ConfirmDialogModule,
    TabViewModule,
    TextareaModule
  ],
  providers: [MessageService, ConfirmationService, PlanConfigurationServiceProxy, LookupServiceProxy],
  templateUrl: './plan-configuration.component.html',
  styleUrls: ['./plan-configuration.component.scss']
})
export class PlanConfigurationComponent implements OnInit {
  planGroups = signal<PlanGroup[]>([]);
  allConfigurations = signal<SubscriptionPlanConfigurationDto[]>([]);
  tenantTypes = signal<TenantTypeOption[]>([]);
  
  proRataEnabled = false;
  savingProRata = false;
  
  showDialog = false;
  editMode = false;
  currentConfig: SubscriptionPlanConfigurationDto | null = null;
  
  // Form model
  formData = {
    planName: '',
    tenantType: null as number | null,
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
    canUpgrade: true
  };

  constructor(
    private planConfigService: PlanConfigurationServiceProxy,
    private lookupService: LookupServiceProxy,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadTenantTypes();
    this.loadConfigurations();
    this.loadProRataSetting();
  }

  loadTenantTypes(): void {
    this.lookupService.getEnumValues('TenantType').subscribe({
      next: (data: any[]) => {
        this.tenantTypes.set(
          data.map((item: any) => ({ label: item.name, value: item.value }))
        );
      },
      error: (error) => {
        console.error('Error loading tenant types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tenant types'
        });
      }
    });
  }

  loadConfigurations(): void {
    this.planConfigService.planConfiguration_GetAll().subscribe({
      next: (configs) => {
        this.allConfigurations.set(configs);
        this.groupConfigurations(configs);
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

  groupConfigurations(configs: SubscriptionPlanConfigurationDto[]): void {
    const groups = new Map<string, SubscriptionPlanConfigurationDto[]>();
    
    configs.forEach(config => {
      const planName = config.planName || 'Unnamed Plan';
      if (!groups.has(planName)) {
        groups.set(planName, []);
      }
      groups.get(planName)!.push(config);
    });
    
    const planGroups: PlanGroup[] = Array.from(groups.entries()).map(([planName, configurations]) => ({
      planName,
      configurations: configurations.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    }));
    
    this.planGroups.set(planGroups);
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
      tenantType: null,
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
      canUpgrade: true
    };
  }

  populateForm(config: SubscriptionPlanConfigurationDto): void {
    this.formData = {
      planName: config.planName || '',
      tenantType: config.tenantType,
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
      canUpgrade: config.canUpgrade
    };
  }

  saveConfiguration(): void {
    if (!this.formData.planName || this.formData.tenantType === null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Plan name and tenant type are required'
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
      ...this.formData,
      tenantType: this.formData.tenantType!
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
      ...this.formData,
      tenantType: this.formData.tenantType!
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
      message: `Are you sure you want to delete ${config.planName} for ${config.tenantTypeName}?`,
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
    const type = this.tenantTypes().find(t => t.value === tenantType);
    return type?.label || 'Unknown';
  }

  loadProRataSetting(): void {
    this.planConfigService.planConfiguration_GetProRataSetting().subscribe({
      next: (enabled) => {
        this.proRataEnabled = enabled;
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
}
