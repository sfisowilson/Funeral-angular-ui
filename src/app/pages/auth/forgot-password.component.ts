import { Component, Injector } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthServiceProxy, ForgotPasswordRequest } from '../../core/services/service-proxies';
import { TenantBaseComponent } from '../../core/tenant-base.component';
import { TenantSettingsService } from '@app/core/services/tenant-settings.service';

@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [CommonModule, ButtonModule, InputTextModule, ReactiveFormsModule, RouterModule, ToastModule],
    providers: [MessageService],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent extends TenantBaseComponent {
    form: FormGroup;
    isBusy: boolean = false;

    tenantLogo: string | null = null;
    tenantName: string = '';

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private authServiceProxy: AuthServiceProxy,
        private router: Router,
        private _tenantSettings: TenantSettingsService,
        private messageService: MessageService
    ) {
        super(injector);
        this.form = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    override async loadTenantSettings(): Promise<void> {
        try {
            const settings = await this._tenantSettings.loadSettings();

            if (settings) {
                this.tenantName = settings.tenantName || 'Funeral Management System';

                // Try multiple ways to get the logo
                let logoId = null;

                // Check if logo is directly on settings object (from TenantSettingDto.Logo)
                if (settings.logo) {
                    logoId = settings.logo;
                }

                // Check if logo is in parsed JSON settings (from TenantSettingDto.Settings)
                if (settings.settings) {
                    try {
                        const parsedSettings = JSON.parse(settings.settings);
                        if (parsedSettings.logo) {
                            logoId = parsedSettings.logo;
                        }
                    } catch (e) {
                        console.error('Error parsing settings JSON:', e);
                    }
                }

                if (logoId) {
                    this.tenantLogo = this._tenantSettings.getDownloadUrl(logoId);
                } else {
                    this.tenantLogo = '';
                }
            }
        } catch (error) {
            this.tenantName = 'Funeral Management System';
            this.tenantLogo = '';
        }
        this.loading = false;
    }

    sendResetLink() {
        this.isBusy = true;
        if (this.form.invalid) {
            this.isBusy = false;
            return;
        }

        const forgotPasswordRequest = new ForgotPasswordRequest();
        forgotPasswordRequest.email = this.form.value.email;

        this.authServiceProxy.auth_ForgotPassword(forgotPasswordRequest).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Email Sent',
                    detail: 'If a matching account was found, a reset link has been sent to your email.',
                    life: 6000
                });
                this.router.navigate(['/auth/reset-password']);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Request Failed',
                    detail: 'Unable to process your request. Please try again later.',
                    life: 5000
                });
                this.isBusy = false;
            },
            complete: () => {
                this.isBusy = false;
            }
        });
    }
}
