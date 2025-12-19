import { Component, Inject, Injector, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthService } from '../../auth/auth-service';
import { AuthServiceProxy } from '../../core/services/service-proxies';
import { HttpClient } from '@angular/common/http';
import { TenantBaseComponent } from '../../core/tenant-base.component';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ReactiveFormsModule, ChangePasswordDialogComponent, MessageModule, ToastModule],
    providers: [HttpClient, AuthServiceProxy, MessageService],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent extends TenantBaseComponent implements OnInit {
    checked: boolean = false;

    form: FormGroup = new FormGroup({});
    isBusy: boolean = false;
    tenantLogo: string | null = null;
    tenantName: string = '';
    
    // Password change dialog
    showChangePasswordDialog = signal<boolean>(false);
    loginCredentials: any = null;

    // Session expired message
    sessionExpired = signal<boolean>(false);
    returnUrl: string | null = null;

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private service: AuthServiceProxy,
        private _tenantSettings: TenantSettingsService,
        private messageService: MessageService
    ) {
        super(injector);
        this.form = this.fb.group({
            email: [''],
            password: ['']
        });
        this.loadTenantSettings();
    }

    override ngOnInit(): Promise<void> {
        return new Promise<void>((resolve) => {
            // Check for session expired query parameter
            this.route.queryParams.subscribe(params => {
                if (params['sessionExpired'] === 'true') {
                    this.sessionExpired.set(true);
                    this.returnUrl = params['returnUrl'] || null;
                    
                    // Auto-hide the message after 10 seconds
                    setTimeout(() => {
                        this.sessionExpired.set(false);
                    }, 10000);
                }
                resolve();
            });
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

    login() {
        this.isBusy = true;
        if (!this.form.valid) {
            this.isBusy = false;
            return;
        }

        // Store credentials for potential retry after password change
        this.loginCredentials = { ...this.form.value };

        this.service.auth_Login(this.form.value).subscribe({
            next: (result) => {
                if (!result || !result.token) {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Login Failed',
                        detail: 'No token received from server',
                        life: 5000
                    });
                    this.isBusy = false;
                    return;
                }

                // Check if password change is required
                if (result.mustChangePassword) {
                    // Store the token so it can be used for the password change API call
                    this.authService.setToken(result.token).subscribe(() => {
                        // Give a tiny delay to ensure token is fully stored
                        setTimeout(() => {
                            this.showChangePasswordDialog.set(true);
                        }, 100);
                    });
                    this.isBusy = false;
                    return;
                }

                // Normal login flow - set token and redirect
                this.completeLogin(result.token);
            },
            error: (err) => {
                console.error('Login error:', err);
                // HTTP errors have the actual error message in err.error.error or err.error.message
                const errorMessage = err?.error?.error || err?.error?.message || err?.message || 'Invalid credentials';
                this.messageService.add({
                    severity: 'error',
                    summary: 'Login Failed',
                    detail: errorMessage,
                    life: 5000
                });
                this.isBusy = false;
            },
            complete: () => {
                this.isBusy = false;
            }
        });
    }

    onPasswordChanged() {
        console.log('Password changed successfully, attempting re-login...');
        
        // After successful password change, attempt to log in again
        if (!this.loginCredentials) {
            alert('Login credentials not found. Please log in again.');
            return;
        }

        this.isBusy = true;

        this.service.auth_Login(this.loginCredentials).subscribe({
            next: (result) => {
                if (!result || !result.token) {
                    alert('Login failed after password change');
                    this.isBusy = false;
                    return;
                }

                // Should not require password change again
                this.completeLogin(result.token);
            },
            error: (err) => {
                console.error('Re-login error:', err);
                alert('Password changed but auto-login failed. Please log in again manually.');
                this.isBusy = false;
                // Clear the form so user can log in again
                this.form.reset();
                this.loginCredentials = null;
            },
            complete: () => {
                this.isBusy = false;
            }
        });
    }

    private completeLogin(token: string) {
        // reset form
        this.form.reset();
        this.loginCredentials = null;
        
        // set token in auth service
        this.authService.setToken(token).subscribe((success) => {
            if (success) {
                // Check if we have a return URL from session expiration
                if (this.returnUrl && this.returnUrl !== '/auth/login') {
                    console.log('Login successful, redirecting to return URL:', this.returnUrl);
                    this.router.navigateByUrl(this.returnUrl);
                    return;
                }

                // Default redirect logic
                const tenantType = this.tenantService.getTenantType();
                let redirectUrl = '/admin/dashboard';

                if (tenantType === 'host' && this.authService.hasRole('HostAdmin')) {
                    redirectUrl = '/admin/dashboard';
                } else if (tenantType === 'tenant') {
                    if (this.authService.hasRole('Member')) {
                        // Members go to dashboard, ProfileCompletionGuard will redirect to onboarding if needed
                        redirectUrl = '/admin/dashboard';
                    } else {
                        redirectUrl = '/admin/dashboard';
                    }
                }

                console.log('Login successful, redirecting to:', redirectUrl);
                this.router.navigateByUrl(redirectUrl);
            }
        });
    }

    getRegisterRoute(): string {
        return this.tenantService.getTenantType() === 'host' ? '/auth/tenant-register' : '/auth/register';
    }
}
