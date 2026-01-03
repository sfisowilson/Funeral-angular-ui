import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { FileUploadModule } from 'primeng/fileupload';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DialogModule } from 'primeng/dialog';
import { TenantSettingDto, TenantSettingServiceProxy, FileUploadServiceProxy, FileMetadataDto, FileParameter, API_BASE_URL, PremiumCalculationServiceProxy, PremiumCalculationSettingsDto, PolicyCoverPremiumTableDto, ExtendedFamilyBenefitTableDto, PolicyCoverRowDto, ExtendedFamilyBenefitRowDto, DependentCountTierDto, PolicyCoverAgeBracketDto } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { TeamEditorComponent } from '../../building-blocks/team-editor-widget/team-editor.component';
import { WidgetConfig } from '../../building-blocks/widget-config';

// Extended Family Column Configuration Interface
interface ExtendedFamilyColumn {
    key: string;
    label: string;
    coverAmount: number;
}
import { WidgetService } from '../../building-blocks/widget.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface SmtpSettings {
    smtpServer?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    enableSsl?: boolean;
}

interface NotificationSettings {
    notifyUsersOnPolicyUpdate?: boolean;
}

interface Settings extends SmtpSettings, NotificationSettings {
    customCssId?: string;
    currency?: string;
    logo?: string;
    favicon?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    textColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    primaryActiveColor?: string;
    buttonPrimaryBackground?: string;
    buttonPrimaryColor?: string;
    buttonSecondaryBackground?: string;
    buttonSecondaryColor?: string;
    buttonDangerBackground?: string;
    buttonDangerColor?: string;
    buttonWarningBackground?: string;
    buttonWarningColor?: string;
    buttonBorderRadius?: string;
    buttonPadding?: string;
    buttonFontSize?: string;
    buttonFontWeight?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    transitionDuration?: string;
    contentBorderRadius?: string;
    teamMembers?: TeamMember[];
    enableIdVerification?: boolean;
    requireIdVerificationForRegistration?: boolean;
    contractTemplateFileId?: string;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    bio?: string;
    status?: string;
    dateAdded?: Date;
}

@Component({
    selector: 'app-tenant-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule, FileUploadModule, CardModule, CheckboxModule, DropdownModule, ColorPickerModule, DialogModule, TeamEditorComponent],
    providers: [MessageService, TenantSettingServiceProxy, FileUploadServiceProxy, TenantSettingsService, PremiumCalculationServiceProxy],
    templateUrl: './tenant-settings.component.html',
    styleUrl: './tenant-settings.component.scss'
})
export class TenantSettingsComponent implements OnInit {
    tenantSettings!: TenantSettingDto;
    _settings: Settings = {};
    submitted: boolean = false;
    smtpSettings: SmtpSettings = {};
    notificationSettings: NotificationSettings = {};
    currency: string = 'R'; // Default to Rands
    hasChanges: boolean = false;
    currencyOptions: any[] = [
        { label: 'South African Rand (R)', value: 'ZAR' },
        { label: 'United States Dollar ($)', value: 'USD' },
        { label: 'Euro (€)', value: 'EUR' },
        { label: 'British Pound (£)', value: 'GBP' },
        { label: 'Japanese Yen (¥)', value: 'JPY' },
        { label: 'Canadian Dollar (C$)', value: 'CAD' },
        { label: 'Australian Dollar (A$)', value: 'AUD' },
        { label: 'Swiss Franc (CHF)', value: 'CHF' },
        { label: 'Chinese Yuan (¥)', value: 'CNY' },
        { label: 'Indian Rupee (₹)', value: 'INR' }
    ];
    tenantIdHeader!: HttpHeaders;

    // Team Management Properties
    showTeamManagementDialog: boolean = false;
    teamMembers: TeamMember[] = [];
    teamEditorConfig: WidgetConfig = {
        id: 'tenant-team-settings',
        type: 'team-editor',
        settings: {
            title: 'Tenant Team Members',
            teamMembers: []
        }
    };

    // Premium Calculation Properties
    showPremiumSettingsDialog: boolean = false;
    premiumSettings: PremiumCalculationSettingsDto | null = null;
    loadingPremiumSettings: boolean = false;

    // Extended Family Table Column Configuration
    extendedFamilyColumns: ExtendedFamilyColumn[] = [
        { key: 'premium_5000_Cover', label: 'R5,000 Cover', coverAmount: 5000 },
        { key: 'premium_10000_Cover', label: 'R10,000 Cover', coverAmount: 10000 },
        { key: 'premium_15000_Cover', label: 'R15,000 Cover', coverAmount: 15000 },
        { key: 'premium_20000_Cover', label: 'R20,000 Cover', coverAmount: 20000 },
        { key: 'premium_25000_Cover', label: 'R25,000 Cover', coverAmount: 25000 }
    ];

    constructor(
        private messageService: MessageService,
        private tenantSettingService: TenantSettingServiceProxy,
        private fileUploadService: FileUploadServiceProxy,
        private tenantSettingsService: TenantSettingsService,
        private widgetService: WidgetService,
        private premiumCalculationService: PremiumCalculationServiceProxy,
        private http: HttpClient,
        @Inject(API_BASE_URL) private baseUrl: string,
        @Inject(DOCUMENT) private document: Document
    ) {}

    getDownloadUrl(fileId: string | undefined): string {
        if (!fileId) {
            return '';
        }
        let url = `${this.baseUrl}/api/FileUpload/File_DownloadFile/${fileId}`;
        if (this.tenantIdHeader && this.tenantIdHeader.has('X-Tenant-ID')) {
            url += `?X-Tenant-ID=${this.tenantIdHeader.get('X-Tenant-ID')}`;
        }
        return url;
    }

    get customCssId(): string | undefined {
        if (this._settings && this._settings.customCssId) {
            return this._settings.customCssId;
        }
        return undefined;
    }

    downloadCss() {
        const cssId = this.customCssId;
        if (cssId) {
            window.open(this.getDownloadUrl(cssId), '_blank');
        }
    }

    ngOnInit(): void {
        // Use subdomain if present, otherwise use hostSubdomain from environment
        const host = window.location.hostname;
        const subdomain = host.split('.')[0];
        let tenantId = '';
        if (subdomain && subdomain !== 'www' && subdomain !== environment.baseDomain.split('.')[0]) {
            tenantId = subdomain;
        } else {
            // fallback to hostSubdomain from environment file
            tenantId = environment.hostSubdomain;
        }
        this.tenantIdHeader = new HttpHeaders().set('X-Tenant-ID', tenantId);
        this.loadTenantSettings();
        
    }

    loadTenantSettings() {
        this.tenantSettingsService
            .loadSettings()
            .then((data) => {
                this.tenantSettings = data; // Assign the fetched TenantSettingDto directly

                if (this.tenantSettings.settings) {
                    try {
                        this._settings = JSON.parse(this.tenantSettings.settings);
                    } catch (e) {
                        console.error('Error parsing existing tenant settings JSON:', e);
                        this._settings = {}; // Initialize to empty if parsing fails
                    }
                } else {
                    this._settings = {}; // Initialize if settings is null or undefined
                }

                // Initialize properties from _settings, providing defaults if not present in JSON
                this.smtpSettings = {
                    smtpServer: this._settings.smtpServer || '',
                    smtpPort: this._settings.smtpPort || 587,
                    smtpUsername: this._settings.smtpUsername || '',
                    smtpPassword: this._settings.smtpPassword || '',
                    enableSsl: this._settings.enableSsl !== undefined ? this._settings.enableSsl : true
                };
                this.notificationSettings = {
                    notifyUsersOnPolicyUpdate: this._settings.notifyUsersOnPolicyUpdate !== undefined ? this._settings.notifyUsersOnPolicyUpdate : false
                };
                this.currency = this._settings.currency || 'ZAR';

                // Set default values for new settings if they are not present
                this._settings.primaryColor = this._settings.primaryColor || '#667eea';
                this._settings.secondaryColor = this._settings.secondaryColor || '#f8e0c0';
                this._settings.accentColor = this._settings.accentColor || '#764ba2';
                this._settings.textColor = this._settings.textColor || '#333333';
                this._settings.backgroundColor = this._settings.backgroundColor || '#ffffff';
                this._settings.borderColor = this._settings.borderColor || '#e5e7eb';
                this._settings.primaryActiveColor = this._settings.primaryActiveColor || '#4355b8';

                // Button styling defaults
                this._settings.buttonPrimaryBackground = this._settings.buttonPrimaryBackground || '#667eea';
                this._settings.buttonPrimaryColor = this._settings.buttonPrimaryColor || '#ffffff';
                this._settings.buttonSecondaryBackground = this._settings.buttonSecondaryBackground || '#6b7280';
                this._settings.buttonSecondaryColor = this._settings.buttonSecondaryColor || '#ffffff';
                this._settings.buttonDangerBackground = this._settings.buttonDangerBackground || '#dc2626';
                this._settings.buttonDangerColor = this._settings.buttonDangerColor || '#ffffff';
                this._settings.buttonWarningBackground = this._settings.buttonWarningBackground || '#f59e0b';
                this._settings.buttonWarningColor = this._settings.buttonWarningColor || '#ffffff';
                this._settings.buttonBorderRadius = this._settings.buttonBorderRadius || '6px';
                this._settings.buttonPadding = this._settings.buttonPadding || '0.5rem 1rem';
                this._settings.buttonFontSize = this._settings.buttonFontSize || '1rem';
                this._settings.buttonFontWeight = this._settings.buttonFontWeight || '500';

                // Font settings
                this._settings.fontFamily = this._settings.fontFamily || 'Inter, sans-serif';
                this._settings.fontSize = this._settings.fontSize || '1rem';
                this._settings.fontWeight = this._settings.fontWeight || '400';
                this._settings.lineHeight = this._settings.lineHeight || '1.5';

                // Common variables (minimal, most auto-derived from theme colors)
                this._settings.transitionDuration = this._settings.transitionDuration || '0.2s';
                this._settings.contentBorderRadius = this._settings.contentBorderRadius || '6px';

                // Initialize team members
                this.teamMembers = this._settings.teamMembers || [];
                this.teamEditorConfig.settings.teamMembers = [...this.teamMembers];
                
                // Load contract template file ID from TenantSettingDto
                this._settings.contractTemplateFileId = this.tenantSettings.contractTemplateFileId;
                
                // ...theme styles now applied globally by ThemeService...
            })
            .catch((error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load tenant settings', life: 3000 });
                console.error(error);
            });
    }

    saveSettings() {
        this.submitted = true;
        if (this.tenantSettings.tenantName?.trim()) {
            let existingSettings: Settings = {};
            if (this.tenantSettings.settings) {
                try {
                    existingSettings = JSON.parse(this.tenantSettings.settings);
                } catch (e) {
                    console.error('Error parsing existing tenant settings JSON for merging:', e);
                }
            }

            // Merge updated properties into existingSettings
            existingSettings.customCssId = this._settings.customCssId;
            existingSettings.currency = this.currency;
            existingSettings.logo = this._settings.logo;
            existingSettings.favicon = this._settings.favicon;
            existingSettings.primaryColor = this._settings.primaryColor;
            existingSettings.secondaryColor = this._settings.secondaryColor;
            existingSettings.accentColor = this._settings.accentColor;
            existingSettings.textColor = this._settings.textColor;
            existingSettings.backgroundColor = this._settings.backgroundColor;
            existingSettings.borderColor = this._settings.borderColor;
            existingSettings.primaryActiveColor = this._settings.primaryActiveColor;
            existingSettings.buttonPrimaryBackground = this._settings.buttonPrimaryBackground;
            existingSettings.buttonPrimaryColor = this._settings.buttonPrimaryColor;
            existingSettings.buttonSecondaryBackground = this._settings.buttonSecondaryBackground;
            existingSettings.buttonSecondaryColor = this._settings.buttonSecondaryColor;
            existingSettings.buttonDangerBackground = this._settings.buttonDangerBackground;
            existingSettings.buttonDangerColor = this._settings.buttonDangerColor;
            existingSettings.buttonWarningBackground = this._settings.buttonWarningBackground;
            existingSettings.buttonWarningColor = this._settings.buttonWarningColor;
            existingSettings.buttonBorderRadius = this._settings.buttonBorderRadius;
            existingSettings.buttonPadding = this._settings.buttonPadding;
            existingSettings.buttonFontSize = this._settings.buttonFontSize;
            existingSettings.buttonFontWeight = this._settings.buttonFontWeight;
            existingSettings.fontFamily = this._settings.fontFamily;
            existingSettings.fontSize = this._settings.fontSize;
            existingSettings.fontWeight = this._settings.fontWeight;
            existingSettings.lineHeight = this._settings.lineHeight;
            existingSettings.transitionDuration = this._settings.transitionDuration;
            existingSettings.contentBorderRadius = this._settings.contentBorderRadius;

            existingSettings.smtpServer = this.smtpSettings.smtpServer;
            existingSettings.smtpPort = this.smtpSettings.smtpPort;
            existingSettings.smtpUsername = this.smtpSettings.smtpUsername;
            existingSettings.smtpPassword = this.smtpSettings.smtpPassword;
            existingSettings.enableSsl = this.smtpSettings.enableSsl;

            existingSettings.notifyUsersOnPolicyUpdate = this.notificationSettings.notifyUsersOnPolicyUpdate;

            // Save team members
            existingSettings.teamMembers = this.teamMembers;

            // Create a TenantSettingDto to send to the service
            const tenantSettingDtoToSend: TenantSettingDto = new TenantSettingDto();
            tenantSettingDtoToSend.id = this.tenantSettings.id;
            tenantSettingDtoToSend.tenantName = this.tenantSettings.tenantName;
            tenantSettingDtoToSend.settings = JSON.stringify(existingSettings); // Stringify the combined settings

            this.tenantSettingService.tenantSetting_UpdateTenantSetting(tenantSettingDtoToSend).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Tenant Settings Updated', life: 3000 });
                    // Refresh widgets to reflect any landing page changes
                    this.widgetService.refreshWidgets().subscribe({
                        next: () => {
                            console.log('Widgets refreshed after tenant settings save');
                        },
                        error: (error) => {
                            console.error('Error refreshing widgets:', error);
                        }
                    });
                },
                error: (error: any) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update tenant settings', life: 3000 });
                    console.error(error);
                }
            });
        }
    }

    onLogoUpload(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileParameter: FileParameter = {
            data: file,
            fileName: file.name
        };
        // Pass entityType='Logo' and entityId as the tenant ID so it's linked to tenant settings
        this.fileUploadService.file_UploadFile('Logo', undefined, undefined, undefined, false, fileParameter).subscribe({
            next: (result: FileMetadataDto) => {

                    this._settings.logo = result.id;
                    this.hasChanges = true;

                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Logo uploaded successfully', life: 3000 });
            },
            error: (error: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload logo: ' + (error?.error?.error || error?.message || 'Unknown error'), life: 5000 });
                console.error('Logo upload error:', error);
            }
        });
    }

    onFaviconUpload(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileParameter: FileParameter = {
            data: file,
            fileName: file.name
        };
        // Pass entityType='Favicon' so it's automatically saved in TenantSettings on backend
        this.fileUploadService.file_UploadFile('Favicon', undefined, undefined, undefined, false, fileParameter).subscribe({
            next: (result: FileMetadataDto) => {
                
                this._settings.favicon = result.id;
                this.hasChanges = true;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Favicon uploaded successfully', life: 3000 });
            },
            error: (error: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload favicon: ' + (error?.error?.error || error?.message || 'Unknown error'), life: 5000 });
                console.error('Favicon upload error:', error);
            }
        });
    }

    onCssFileUpload(event: any) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileParameter: FileParameter = {
            data: file,
            fileName: file.name
        };
        this.fileUploadService.file_UploadFile('CssFile', undefined, undefined, undefined, false, fileParameter).subscribe({
            next: (result: FileMetadataDto) => {
                // Store the CSS file ID in settings
                this._settings.customCssId = result.id;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'CSS file uploaded successfully. Remember to save settings to persist changes.', life: 5000 });
            },
            error: (error: any) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to upload CSS file: ' + (error?.error?.error || error?.message || 'Unknown error'), life: 5000 });
                console.error('CSS upload error:', error);
            }
        });
    }

    onContractTemplateUpload(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            this.messageService.add({ 
                severity: 'error', 
                summary: 'Invalid File', 
                detail: 'Only PDF files are allowed for contract templates', 
                life: 5000 
            });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const headers = new HttpHeaders();
        // Let browser set content-type for multipart/form-data

        this.http.post(`${this.baseUrl}/api/TenantSetting/upload-contract-template`, formData, { headers }).subscribe({
            next: (result: any) => {
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: 'Contract template uploaded successfully', 
                    life: 3000 
                });
                this._settings.contractTemplateFileId = result.fileId;
                this.hasChanges = true;
            },
            error: (error: any) => {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'Failed to upload contract template: ' + (error?.error?.message || error?.message || 'Unknown error'), 
                    life: 5000 
                });
                console.error('Contract template upload error:', error);
            }
        });

        // Reset file input
        event.target.value = '';
    }

    removeContractTemplate() {
        this.http.delete(`${this.baseUrl}/api/TenantSetting/remove-contract-template`).subscribe({
            next: () => {
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: 'Contract template removed successfully', 
                    life: 3000 
                });
                this._settings.contractTemplateFileId = undefined;
                this.hasChanges = true;
            },
            error: (error: any) => {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'Failed to remove contract template: ' + (error?.error?.message || error?.message || 'Unknown error'), 
                    life: 5000 
                });
                console.error('Contract template removal error:', error);
            }
        });
    }

    syncFieldConfigurations() {
        this.http.post(`${this.baseUrl}/api/OnboardingFieldConfiguration/OnboardingFieldConfiguration_InitializeDefaults`, {}).subscribe({
            next: () => {
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: 'Field configurations synchronized successfully. All onboarding fields are now up to date.', 
                    life: 3000 
                });
            },
            error: (error: any) => {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: 'Failed to sync field configurations: ' + (error?.error?.message || error?.message || 'Unknown error'), 
                    life: 5000 
                });
                console.error('Field configuration sync error:', error);
            }
        });
    }

    // Team Management Methods
    getTeamMemberCount(): number {
        return this.teamMembers.length;
    }

    getActiveTeamMemberCount(): number {
        return this.teamMembers.filter((member) => member.status !== 'inactive').length;
    }

    getUniqueRoleCount(): number {
        const uniqueRoles = new Set(this.teamMembers.map((member) => member.role).filter((role) => role && role.trim() !== ''));
        return uniqueRoles.size;
    }

    getRecentTeamMembers(): TeamMember[] {
        return this.teamMembers
            .sort((a, b) => {
                const dateA = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
                const dateB = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 5);
    }

    getAvatarColor(name: string): string {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    }

    getInitials(name: string): string {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }

    saveTeamChanges(): void {
        // Get the updated team members from the team editor component
        this.teamMembers = [...this.teamEditorConfig.settings.teamMembers];

        // Preserve existing settings and only update team members
        // This ensures we don't wipe out widget configurations or other settings
        this._settings = { ...this._settings, teamMembers: this.teamMembers };

        // Close the dialog
        this.showTeamManagementDialog = false;

        // Show success message
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Team changes saved. Remember to save the tenant settings to persist all changes.'
        });
    }

    openTeamManagement(): void {
        // Ensure the team editor config has the most current team member data
        this.teamEditorConfig.settings.teamMembers = [...this.teamMembers];
        this.showTeamManagementDialog = true;
    }

    // Generate CSS variables for PrimeNG theme
    generateThemeCSS(): string {
        const primaryColor = this._settings.primaryColor || this._settings.buttonPrimaryBackground || '#667eea';
        const primaryHover = this.darkenColor(primaryColor, 10);
        const primaryActive = this._settings.primaryActiveColor || this.darkenColor(primaryColor, 15);
        const secondaryColor = this._settings.secondaryColor || this._settings.buttonSecondaryBackground || '#6b7280';
        const textColor = this._settings.textColor || '#374151';
        const backgroundColor = this._settings.backgroundColor || '#ffffff';
        const borderColor = this._settings.borderColor || '#e5e7eb';
        
        return `
:root {
    /* Primary Colors */
    --p-primary-color: ${primaryColor};
    
    --surface-card: ${backgroundColor} !important;
    --surface-overlay: ${backgroundColor} !important;
    --p-dialog-background: ${backgroundColor} !important;
    --p-inputtext-background: ${backgroundColor} !important;
    --p-multiselect-background: ${backgroundColor} !important;
    --p-multiselect-option-focus-background: ${backgroundColor} !important;
    --p-multiselect-option-focus-color: ${textColor} !important;
    --p-dropdown-background: ${backgroundColor} !important;
    --p-dropdown-panel-background: ${backgroundColor} !important;
    --p-dropdown-item-hover-background: ${backgroundColor} !important;
    --p-dropdown-item-hover-color: ${textColor} !important;
    --p-inputtext-border-color: ${borderColor} !important;

    --p-primary-contrast-color: ${this._settings.buttonPrimaryColor || '#ffffff'};
    
    /* Button Primary */
    --p-button-primary-background: ${this._settings.buttonPrimaryBackground || primaryColor};
    --p-button-primary-border-color: ${this._settings.buttonPrimaryBackground || primaryColor};
    --p-button-primary-color: ${this._settings.buttonPrimaryColor || '#ffffff'};
    --p-button-primary-hover-background: ${primaryHover};
    --p-button-primary-hover-border-color: ${primaryHover};
    --p-button-primary-active-background: ${primaryActive};
    --p-button-primary-active-border-color: ${primaryActive};
    
    /* Button Secondary */
    --p-button-secondary-background: ${this._settings.buttonSecondaryBackground || secondaryColor};
    --p-button-secondary-border-color: ${this._settings.buttonSecondaryBackground || secondaryColor};
    --p-button-secondary-color: ${this._settings.buttonSecondaryColor || '#ffffff'};
    --p-button-secondary-hover-background: ${this.darkenColor(secondaryColor, 10)};
    --p-button-secondary-hover-border-color: ${this.darkenColor(secondaryColor, 10)};
    
    /* Button Success */
    --p-button-success-background: #10b981;
    --p-button-success-border-color: #10b981;
    --p-button-success-color: #ffffff;
    --p-button-success-hover-background: #059669;
    --p-button-success-hover-border-color: #059669;
    
    /* Button Info */
    --p-button-info-background: #3b82f6;
    --p-button-info-border-color: #3b82f6;
    --p-button-info-color: #ffffff;
    --p-button-info-hover-background: #2563eb;
    --p-button-info-hover-border-color: #2563eb;
    
    /* Button Warning */
    --p-button-warning-background: #f59e0b;
    --p-button-warning-border-color: #f59e0b;
    --p-button-warning-color: #ffffff;
    --p-button-warning-hover-background: #d97706;
    --p-button-warning-hover-border-color: #d97706;
    
    /* Button Danger */
    --p-button-danger-background: #ef4444;
    --p-button-danger-border-color: #ef4444;
    --p-button-danger-color: #ffffff;
    --p-button-danger-hover-background: #dc2626;
    --p-button-danger-hover-border-color: #dc2626;
    
    /* Button Shape */
    --p-button-border-radius: ${this._settings.buttonBorderRadius || '6px'};
    --p-button-padding-y: ${this.extractPadding(this._settings.buttonPadding || '0.5rem 1rem', 'y')};
    --p-button-padding-x: ${this.extractPadding(this._settings.buttonPadding || '0.5rem 1rem', 'x')};
    --p-button-font-size: ${this._settings.buttonFontSize || '1rem'};
    --p-button-font-weight: ${this._settings.buttonFontWeight || '500'};
    
    /* Text Colors */
    --p-text-color: ${textColor};
    --p-text-muted-color: #6b7280;
    
    /* Surface Colors */
    --p-content-background: ${backgroundColor};
    --p-content-border-color: ${borderColor};
    --p-content-hover-background: ${this.lightenColor(backgroundColor, 5)};
    
    /* Other */
    --p-transition-duration: ${this._settings.transitionDuration || '0.2s'};
}

/* Apply button styles globally */
.p-button {
    background: var(--p-button-primary-background) !important;
    border: 1px solid var(--p-button-primary-border-color) !important;
    color: var(--p-button-primary-color) !important;
    border-radius: var(--p-button-border-radius) !important;
    padding: var(--p-button-padding-y) var(--p-button-padding-x) !important;
    font-size: var(--p-button-font-size) !important;
    font-weight: var(--p-button-font-weight) !important;
    transition: all var(--p-transition-duration) ease !important;
}

.p-button:enabled:hover {
    background: var(--p-button-primary-hover-background) !important;
    border-color: var(--p-button-primary-hover-border-color) !important;
}

.p-button:enabled:active {
    background: var(--p-button-primary-active-background) !important;
    border-color: var(--p-button-primary-active-border-color) !important;
}

.p-button.p-button-secondary {
    background: var(--p-button-secondary-background) !important;
    border-color: var(--p-button-secondary-border-color) !important;
    color: var(--p-button-secondary-color) !important;
}

.p-button.p-button-secondary:enabled:hover {
    background: var(--p-button-secondary-hover-background) !important;
    border-color: var(--p-button-secondary-hover-border-color) !important;
}

.p-button.p-button-success {
    background: var(--p-button-success-background) !important;
    border-color: var(--p-button-success-border-color) !important;
    color: var(--p-button-success-color) !important;
}

.p-button.p-button-success:enabled:hover {
    background: var(--p-button-success-hover-background) !important;
    border-color: var(--p-button-success-hover-border-color) !important;
}

.p-button.p-button-info {
    background: var(--p-button-info-background) !important;
    border-color: var(--p-button-info-border-color) !important;
    color: var(--p-button-info-color) !important;
}

.p-button.p-button-info:enabled:hover {
    background: var(--p-button-info-hover-background) !important;
    border-color: var(--p-button-info-hover-border-color) !important;
}

.p-button.p-button-warning {
    background: var(--p-button-warning-background) !important;
    border-color: var(--p-button-warning-border-color) !important;
    color: var(--p-button-warning-color) !important;
}

.p-button.p-button-warning:enabled:hover {
    background: var(--p-button-warning-hover-background) !important;
    border-color: var(--p-button-warning-hover-border-color) !important;
}

.p-button.p-button-danger {
    background: var(--p-button-danger-background) !important;
    border-color: var(--p-button-danger-border-color) !important;
    color: var(--p-button-danger-color) !important;
}

.p-button.p-button-danger:enabled:hover {
    background: var(--p-button-danger-hover-background) !important;
    border-color: var(--p-button-danger-hover-border-color) !important;
}

.p-button.p-button-outlined {
    background: transparent !important;
    border: 2px solid var(--p-button-primary-border-color) !important;
    color: var(--p-button-primary-background) !important;
}

.p-button.p-button-outlined:enabled:hover {
    background: var(--p-button-primary-background) !important;
    color: var(--p-button-primary-color) !important;
}

.p-button.p-button-text {
    background: transparent !important;
    border-color: transparent !important;
    color: var(--p-button-primary-background) !important;
}

.p-button.p-button-text:enabled:hover {
    background: rgba(0, 0, 0, 0.04) !important;
}
`;
    }

    // Helper: Darken a hex color
    darkenColor(hex: string, percent: number): string {
        if (!hex || !hex.startsWith('#')) return hex;
        
        const num = parseInt(hex.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255))
            .toString(16).slice(1);
    }

    // Helper: Lighten a hex color
    lightenColor(hex: string, percent: number): string {
        if (!hex || !hex.startsWith('#')) return hex;
        
        const num = parseInt(hex.slice(1), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (0x1000000 + (R > 255 ? 255 : R) * 0x10000 +
            (G > 255 ? 255 : G) * 0x100 +
            (B > 255 ? 255 : B))
            .toString(16).slice(1);
    }

    // Helper: Extract padding values
    extractPadding(padding: string, axis: 'x' | 'y'): string {
        if (!padding) return '0.5rem';
        const parts = padding.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        if (parts.length === 2) return axis === 'y' ? parts[0] : parts[1];
        if (parts.length === 4) return axis === 'y' ? parts[0] : parts[1];
        return '0.5rem';
    }

    // ...existing code...

    // Premium Calculation Methods
    openPremiumSettings(): void {
        this.showPremiumSettingsDialog = true;
        this.loadPremiumSettings();
    }

    loadPremiumSettings(): void {
        this.loadingPremiumSettings = true;
        this.premiumCalculationService.premiumCalculation_GetSettings().subscribe({
            next: (settings) => {
                this.premiumSettings = settings;
                
                // Initialize extended family columns from existing data if needed
                this.initializeExtendedFamilyColumns();
                
                this.loadingPremiumSettings = false;
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load premium settings', life: 3000 });
                console.error(error);
                this.loadingPremiumSettings = false;
            }
        });
    }

    initializeExtendedFamilyColumns(): void {
        if (!this.premiumSettings?.extendedFamilyTable?.rows || this.premiumSettings.extendedFamilyTable.rows.length === 0) {
            return; // No data to initialize from
        }

        // Check if we have any existing row data to extract column structure
        const firstRow = this.premiumSettings.extendedFamilyTable.rows[0];
        const existingColumns = Object.keys(firstRow)
            .filter(key => key.startsWith('premium_') && key.endsWith('_Cover'))
            .map(key => {
                const coverAmount = parseInt(key.replace('premium_', '').replace('_Cover', ''));
                return {
                    key: key,
                    label: `R${coverAmount.toLocaleString()} Cover`,
                    coverAmount: coverAmount
                };
            })
            .sort((a, b) => a.coverAmount - b.coverAmount);

        // Update columns if we found existing data
        if (existingColumns.length > 0) {
            this.extendedFamilyColumns = existingColumns;
        }
    }

    savePremiumSettings(): void {
        if (!this.premiumSettings) return;
        
        this.premiumCalculationService.premiumCalculation_SaveSettings(this.premiumSettings).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Premium settings saved successfully', life: 3000 });
                this.showPremiumSettingsDialog = false;
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save premium settings', life: 3000 });
                console.error(error);
            }
        });
    }

    addCoverRow(): void {
        if (!this.premiumSettings?.policyCoverTable?.rows) return;
        
        const newRow = new PolicyCoverRowDto();
        newRow.coverAmount = 0;
        // Initialize dependent count tiers array
        newRow.dependentCountTiers = [];
        // Maintain legacy properties for backward compatibility
        newRow.premium_1To5Dependents_Under65 = 0;
        newRow.premium_1To5Dependents_Under70 = 0;
        newRow.premium_1To5Dependents_Under75 = 0;
        
        this.premiumSettings.policyCoverTable.rows.push(newRow);
    }

    removeCoverRow(index: number): void {
        if (!this.premiumSettings?.policyCoverTable?.rows) return;
        this.premiumSettings.policyCoverTable.rows.splice(index, 1);
    }

    addDependentTier(rowIndex: number): void {
        const row = this.premiumSettings?.policyCoverTable?.rows?.[rowIndex];
        if (!row) return;
        
        if (!row.dependentCountTiers) {
            row.dependentCountTiers = [];
        }

        // Create new tier with default values
        const newTier = new DependentCountTierDto();
        newTier.minDependents = 1;
        newTier.maxDependents = 5;
        newTier.label = `${newTier.minDependents}-${newTier.maxDependents} dependents`;
        newTier.ageBrackets = {};
        
        row.dependentCountTiers.push(newTier);
    }

    removeDependentTier(rowIndex: number, tierIndex: number): void {
        const row = this.premiumSettings?.policyCoverTable?.rows?.[rowIndex];
        if (!row?.dependentCountTiers) return;
        
        row.dependentCountTiers.splice(tierIndex, 1);
    }

    addAgeBracket(rowIndex: number, tierIndex: number): void {
        const tier = this.premiumSettings?.policyCoverTable?.rows?.[rowIndex]?.dependentCountTiers?.[tierIndex];
        if (!tier) return;
        
        if (!tier.ageBrackets) {
            tier.ageBrackets = {};
        }

        // Find next age value (default to 64 if empty, or highest + 5)
        const existingKeys = Object.keys(tier.ageBrackets).map(k => parseInt(k));
        const nextAge = existingKeys.length === 0 ? 64 : Math.max(...existingKeys) + 5;

        const newBracket = new PolicyCoverAgeBracketDto();
        newBracket.maxAge = nextAge;
        newBracket.label = `Under ${nextAge + 1}`;
        newBracket.premium = 0;

        tier.ageBrackets[nextAge] = newBracket;
    }

    removeAgeBracket(tier: DependentCountTierDto, bracketKey: number): void {
        if (!tier.ageBrackets) return;
        delete tier.ageBrackets[bracketKey];
    }

    updateAgeBracketKey(tier: DependentCountTierDto, bracket: { key: number; value: PolicyCoverAgeBracketDto }, newMaxAge: number): void {
        if (!tier.ageBrackets || !newMaxAge || bracket.key === newMaxAge) return;
        
        // Prevent update if maxAge in the value object already matches the new value
        if (bracket.value.maxAge === newMaxAge && tier.ageBrackets[newMaxAge]) return;
        
        // Remove old key and add with new key
        delete tier.ageBrackets[bracket.key];
        tier.ageBrackets[newMaxAge] = bracket.value;
        bracket.key = newMaxAge;
    }

    getAgeBracketsArray(tier: DependentCountTierDto): { key: number; value: PolicyCoverAgeBracketDto }[] {
        if (!tier.ageBrackets) return [];
        return Object.keys(tier.ageBrackets)
            .map(key => ({ key: parseInt(key), value: tier.ageBrackets![parseInt(key)] }))
            .sort((a, b) => a.key - b.key);
    }

    trackByBracketKey(index: number, item: { key: number; value: PolicyCoverAgeBracketDto }): number {
        return item.key;
    }

    addExtendedFamilyRow(): void {
        if (!this.premiumSettings?.extendedFamilyTable?.rows) return;
        
        const newRow = new ExtendedFamilyBenefitRowDto();
        newRow.minAge = 0;
        newRow.maxAge = 0;
        newRow.ageRange = '0-0';
        
        // Initialize all current columns
        this.extendedFamilyColumns.forEach(column => {
            (newRow as any)[column.key] = 0;
        });
        
        this.premiumSettings.extendedFamilyTable.rows.push(newRow);
    }

    removeExtendedFamilyRow(index: number): void {
        if (!this.premiumSettings?.extendedFamilyTable?.rows) return;
        this.premiumSettings.extendedFamilyTable.rows.splice(index, 1);
    }

    // Extended Family Column Management Methods
    addExtendedFamilyColumn(): void {
        const newCoverAmount = this.getNextCoverAmount();
        const newColumnKey = `premium_${newCoverAmount}_Cover`;
        const newColumnLabel = `R${newCoverAmount.toLocaleString()} Cover`;
        
        // Add to columns configuration
        this.extendedFamilyColumns.push({
            key: newColumnKey,
            label: newColumnLabel,
            coverAmount: newCoverAmount
        });
        
        // Add the new property to all existing rows
        if (this.premiumSettings?.extendedFamilyTable?.rows) {
            this.premiumSettings.extendedFamilyTable.rows.forEach(row => {
                (row as any)[newColumnKey] = 0;
            });
        }
    }

    removeExtendedFamilyColumn(index: number): void {
        if (index < 0 || index >= this.extendedFamilyColumns.length) return;
        
        const columnToRemove = this.extendedFamilyColumns[index];
        
        // Remove from columns configuration
        this.extendedFamilyColumns.splice(index, 1);
        
        // Remove the property from all existing rows
        if (this.premiumSettings?.extendedFamilyTable?.rows) {
            this.premiumSettings.extendedFamilyTable.rows.forEach(row => {
                delete (row as any)[columnToRemove.key];
            });
        }
    }

    getNextCoverAmount(): number {
        if (this.extendedFamilyColumns.length === 0) {
            return 5000;
        }
        
        // Find the highest cover amount and add 5000
        const maxCover = Math.max(...this.extendedFamilyColumns.map(col => col.coverAmount));
        return maxCover + 5000;
    }

    getRowPropertyValue(row: ExtendedFamilyBenefitRowDto, propertyKey: string): number {
        return (row as any)[propertyKey] || 0;
    }

    setRowPropertyValue(row: ExtendedFamilyBenefitRowDto, propertyKey: string, value: number): void {
        (row as any)[propertyKey] = value;
    }

    // Apply a color preset
    applyPreset(preset: string): void {
        switch (preset) {
            case 'purple':
                this._settings.buttonPrimaryBackground = '#667eea';
                this._settings.buttonPrimaryColor = '#ffffff';
                this._settings.buttonSecondaryBackground = '#6b7280';
                this._settings.buttonSecondaryColor = '#ffffff';
                this._settings.buttonDangerBackground = '#dc2626';
                this._settings.buttonDangerColor = '#ffffff';
                this._settings.buttonWarningBackground = '#f59e0b';
                this._settings.buttonWarningColor = '#ffffff';
                this._settings.primaryColor = '#667eea';
                break;
            case 'green':
                this._settings.buttonPrimaryBackground = '#10b981';
                this._settings.buttonPrimaryColor = '#ffffff';
                this._settings.buttonSecondaryBackground = '#6b7280';
                this._settings.buttonSecondaryColor = '#ffffff';
                this._settings.buttonDangerBackground = '#dc2626';
                this._settings.buttonDangerColor = '#ffffff';
                this._settings.buttonWarningBackground = '#f59e0b';
                this._settings.buttonWarningColor = '#ffffff';
                this._settings.primaryColor = '#10b981';
                break;
            case 'blue':
                this._settings.buttonPrimaryBackground = '#3b82f6';
                this._settings.buttonPrimaryColor = '#ffffff';
                this._settings.buttonSecondaryBackground = '#6b7280';
                this._settings.buttonSecondaryColor = '#ffffff';
                this._settings.buttonDangerBackground = '#dc2626';
                this._settings.buttonDangerColor = '#ffffff';
                this._settings.buttonWarningBackground = '#f59e0b';
                this._settings.buttonWarningColor = '#ffffff';
                this._settings.primaryColor = '#3b82f6';
                break;
            case 'orange':
                this._settings.buttonPrimaryBackground = '#f59e0b';
                this._settings.buttonPrimaryColor = '#ffffff';
                this._settings.buttonSecondaryBackground = '#6b7280';
                this._settings.buttonSecondaryColor = '#ffffff';
                this._settings.buttonDangerBackground = '#dc2626';
                this._settings.buttonDangerColor = '#ffffff';
                this._settings.buttonWarningBackground = '#f59e0b';
                this._settings.buttonWarningColor = '#ffffff';
                this._settings.primaryColor = '#f59e0b';
                break;
            case 'dark':
                this._settings.buttonPrimaryBackground = '#1f2937';
                this._settings.buttonPrimaryColor = '#ffffff';
                this._settings.buttonSecondaryBackground = '#6b7280';
                this._settings.buttonSecondaryColor = '#ffffff';
                this._settings.buttonDangerBackground = '#dc2626';
                this._settings.buttonDangerColor = '#ffffff';
                this._settings.buttonWarningBackground = '#f59e0b';
                this._settings.buttonWarningColor = '#ffffff';
                this._settings.primaryColor = '#1f2937';
                break;
        }
        
        // Set default shape values if not set
        if (!this._settings.buttonBorderRadius) this._settings.buttonBorderRadius = '6px';
        if (!this._settings.buttonPadding) this._settings.buttonPadding = '0.5rem 1rem';
        if (!this._settings.buttonFontSize) this._settings.buttonFontSize = '0.875rem';
        if (!this._settings.buttonFontWeight) this._settings.buttonFontWeight = '500';
        
        this.messageService.add({
            severity: 'success',
            summary: 'Preset Applied',
            detail: `${preset.charAt(0).toUpperCase() + preset.slice(1)} color scheme applied. Click "Preview Theme" to see changes.`,
            life: 3000
        });
    }
}
