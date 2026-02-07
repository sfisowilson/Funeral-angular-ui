import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { EmailServiceProxy, SendTestEmailRequest, SaveEmailCredentialsRequest } from '../../core/services/service-proxies';

interface SmtpSettings {
    smtpServer?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    enableSsl?: boolean;
    fromEmail?: string;
    fromName?: string;
}

@Component({
    selector: 'app-email-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, InputTextModule, CheckboxModule, ButtonModule, DialogModule, CardModule],
    providers: [MessageService, EmailServiceProxy],
    templateUrl: './email-settings.component.html',
    styleUrl: './email-settings.component.scss'
})
export class EmailSettingsComponent implements OnInit {
    smtpSettings: SmtpSettings = {
        smtpPort: 587,
        enableSsl: true
    };
    loading: boolean = false;
    saving: boolean = false;
    showTestDialog: boolean = false;
    testEmail: string = '';
    sendingTest: boolean = false;
    hasCredentials: boolean = false;

    constructor(
        private messageService: MessageService,
        private emailService: EmailServiceProxy
    ) {}

    ngOnInit(): void {
        this.checkCredentials();
    }

    checkCredentials(): void {
        this.loading = true;
        this.emailService.email_HasCredentials().subscribe({
            next: (response: any) => {
                this.hasCredentials = response.result?.hasCredentials || false;
                this.loading = false;
            },
            error: (error: any) => {
                console.error('Error checking credentials:', error);
                this.loading = false;
            }
        });
    }

    save(): void {
        if (!this.smtpSettings.smtpServer || !this.smtpSettings.smtpUsername || !this.smtpSettings.smtpPassword) {
            this.messageService.add({ 
                severity: 'warn', 
                summary: 'Validation', 
                detail: 'Please fill in all required fields', 
                life: 3000 
            });
            return;
        }

        this.saving = true;

        const request = new SaveEmailCredentialsRequest();
        request.smtpServer = this.smtpSettings.smtpServer!;
        request.smtpPort = this.smtpSettings.smtpPort || 587;
        request.smtpUsername = this.smtpSettings.smtpUsername!;
        request.smtpPassword = this.smtpSettings.smtpPassword!;
        request.enableSsl = this.smtpSettings.enableSsl !== undefined ? this.smtpSettings.enableSsl : true;
        request.fromEmail = this.smtpSettings.fromEmail;
        request.fromName = this.smtpSettings.fromName;

        this.emailService.email_SaveCredentials(request).subscribe({
            next: () => {
                this.saving = false;
                this.hasCredentials = true;
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Saved', 
                    detail: 'Email credentials saved successfully', 
                    life: 3000 
                });
                // Clear password field after successful save for security
                this.smtpSettings.smtpPassword = '';
            },
            error: (error: any) => {
                this.saving = false;
                console.error(error);
                const errorMsg = error?.error?.error?.message || error?.error?.message || 'Failed to save email credentials';
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
        this.testEmail = '';
        this.showTestDialog = true;
    }

    sendTestEmail(): void {
        if (!this.testEmail || !this.testEmail.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please enter a valid email address', life: 3000 });
            return;
        }

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.testEmail)) {
            this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please enter a valid email address', life: 3000 });
            return;
        }

        this.sendingTest = true;
        
        const request = new SendTestEmailRequest();
        request.recipientEmail = this.testEmail;
        
        this.emailService.email_SendTestEmail(request).subscribe({
            next: () => {
                this.sendingTest = false;
                this.showTestDialog = false;
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Test Email Sent', 
                    detail: `Test email successfully sent to ${this.testEmail}`, 
                    life: 5000 
                });
            },
            error: (error: any) => {
                this.sendingTest = false;
                console.error('Test email error:', error);
                const errorMsg = error?.error?.error?.message || error?.error?.message || 'Failed to send test email. Please check your SMTP settings.';
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Test Failed', 
                    detail: errorMsg, 
                    life: 5000 
                });
            }
        });
    }
}


