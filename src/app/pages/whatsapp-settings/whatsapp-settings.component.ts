import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CardModule } from 'primeng/card';
import { WhatsAppSettingsService } from '../../core/services/whatsapp-settings.service';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';

interface WhatsAppConfig {
    phoneNumberId?: string;
    accessToken?: string;
    businessAccountId?: string;
}

@Component({
    selector: 'app-whatsapp-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, InputTextModule, ButtonModule, DialogModule, InputSwitchModule, CardModule],
    providers: [MessageService],
    templateUrl: './whatsapp-settings.component.html',
    styleUrl: './whatsapp-settings.component.scss'
})
export class WhatsAppSettingsComponent implements OnInit {
    whatsAppConfig: WhatsAppConfig = {};
    loading: boolean = false;
    saving: boolean = false;
    showTestDialog: boolean = false;
    testPhone: string = '';
    sendingTest: boolean = false;
    hasCredentials: boolean = false;
    whatsAppEnabled: boolean = false;
    planAllowsWhatsApp: boolean = true; // Will be resolved from tenant settings

    constructor(
        private messageService: MessageService,
        private whatsAppService: WhatsAppSettingsService,
        private tenantSettingsService: TenantSettingsService
    ) {}

    ngOnInit(): void {
        this.checkStatus();
    }

    async checkStatus(): Promise<void> {
        this.loading = true;
        try {
            await this.tenantSettingsService.loadSettings();
            const settings = this.tenantSettingsService.currentSettings;
            this.hasCredentials = settings?.hasWhatsAppCredentials === true;
            this.whatsAppEnabled = settings?.enableWhatsAppNotifications === true;
        } catch (error) {
            console.error('Error checking WhatsApp status:', error);
        }
        this.loading = false;
    }

    save(): void {
        if (!this.whatsAppConfig.phoneNumberId || !this.whatsAppConfig.accessToken) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Phone Number ID and Access Token are required',
                life: 3000
            });
            return;
        }

        this.saving = true;
        this.whatsAppService.saveCredentials(
            this.whatsAppConfig.phoneNumberId!,
            this.whatsAppConfig.accessToken!,
            this.whatsAppConfig.businessAccountId
        ).subscribe({
            next: () => {
                this.saving = false;
                this.hasCredentials = true;
                this.whatsAppConfig.accessToken = ''; // Clear sensitive field
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: 'WhatsApp credentials saved successfully',
                    life: 3000
                });
            },
            error: (error: any) => {
                this.saving = false;
                console.error(error);
                const errorMsg = error?.error?.error?.message || error?.error?.message || 'Failed to save WhatsApp credentials';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMsg,
                    life: 3000
                });
            }
        });
    }

    openTestDialog(): void {
        this.testPhone = '';
        this.showTestDialog = true;
    }

    sendTestMessage(): void {
        if (!this.testPhone || !this.testPhone.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Please enter a valid phone number',
                life: 3000
            });
            return;
        }

        this.sendingTest = true;
        this.whatsAppService.sendTestMessage(this.testPhone).subscribe({
            next: (response: any) => {
                this.sendingTest = false;
                this.showTestDialog = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Test Sent',
                    detail: response?.message || `Test WhatsApp message sent to ${this.testPhone}`,
                    life: 3000
                });
            },
            error: (error: any) => {
                this.sendingTest = false;
                const errorMsg = error?.error?.error?.message || error?.error?.message || 'Failed to send test message';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: errorMsg,
                    life: 5000
                });
            }
        });
    }

    toggleWhatsApp(): void {
        const newState = !this.whatsAppEnabled;
        this.whatsAppService.toggleEnable(newState).subscribe({
            next: () => {
                this.whatsAppEnabled = newState;
                this.messageService.add({
                    severity: 'success',
                    summary: newState ? 'Enabled' : 'Disabled',
                    detail: `WhatsApp notifications ${newState ? 'enabled' : 'disabled'} successfully`,
                    life: 3000
                });
            },
            error: (error: any) => {
                console.error('Error toggling WhatsApp:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update WhatsApp notification settings',
                    life: 3000
                });
            }
        });
    }

    deleteCredentials(): void {
        this.whatsAppService.deleteCredentials().subscribe({
            next: () => {
                this.hasCredentials = false;
                this.whatsAppEnabled = false;
                this.messageService.add({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'WhatsApp credentials deleted successfully',
                    life: 3000
                });
            },
            error: (error: any) => {
                console.error('Error deleting credentials:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete WhatsApp credentials',
                    life: 3000
                });
            }
        });
    }
}
