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
import { ApiServiceProxy, AuthServiceProxy, CustomPagesServiceProxy, TenantSettingDto, TenantSettingServiceProxy } from '../../core/services/service-proxies';
import { HttpClient } from '@angular/common/http';
import { TenantBaseComponent } from '../../core/tenant-base.component';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { ChangePasswordDialogComponent } from './change-password-dialog/change-password-dialog.component';
import { firstValueFrom, take } from 'rxjs';
import { CustomPageTemplateService } from '../../core/services/custom-page-template.service';
import { ThemeApplicationService } from '../../core/services/theme-application.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ReactiveFormsModule, ChangePasswordDialogComponent, MessageModule, ToastModule],
    providers: [HttpClient, MessageService, ThemeApplicationService],
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
    applyingThemeSetup = signal<boolean>(false);

    constructor(
        injector: Injector,
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private route: ActivatedRoute,
        private service: AuthServiceProxy,
        private _tenantSettings: TenantSettingsService,
        private messageService: MessageService,
        private customPagesService: CustomPagesServiceProxy,
        private templateService: CustomPageTemplateService,
        private themeApplicationService: ThemeApplicationService,
        private tenantSettingService: TenantSettingServiceProxy
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
            this.route.queryParams.pipe(take(1)).subscribe((params) => {
                const sessionExpired = params['sessionExpired'] === 'true';
                const rawReturnUrl = params['returnUrl'];
                const message = params['message'];
                const email = params['email'];

                if (email) {
                    this.form.patchValue({ email: email });
                }

                if (message) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Information',
                        detail: message,
                        life: 5000
                    });
                }

                if (sessionExpired) {
                    this.sessionExpired.set(true);

                    // Sanitize returnUrl
                    if (rawReturnUrl && !rawReturnUrl.startsWith('/auth/login')) {
                        this.returnUrl = rawReturnUrl;
                    } else {
                        this.returnUrl = null;
                    }

                    // Optional UI auto-hide
                    setTimeout(() => {
                        this.sessionExpired.set(false);
                    }, 10000);
                }

                if (sessionExpired || message || email) {
                    // Clear URL state immediately
                    this.clearAuthQueryParams();
                }
                resolve();
            });
        });
    }
    private clearAuthQueryParams(): void {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                sessionExpired: null,
                returnUrl: null,
                message: null,
                email: null
            },
            replaceUrl: true
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
            next: (response) => {
                const result = response?.result;
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
            next: (response) => {
                const result = response?.result;
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
        this.authService.setToken(token).subscribe(async (success) => {
            if (success) {
                await this.autoApplyRegistrationThemeIfNeeded();

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

    private async autoApplyRegistrationThemeIfNeeded(): Promise<void> {
        let startedApplying = false;
        try {
            if (this.tenantService.getTenantType() !== 'tenant') {
                return;
            }

            const tenantSettings = await this._tenantSettings.refreshSettings();
            const settingsJson = tenantSettings?.settings;
            if (!settingsJson) {
                return;
            }

            let parsedSettings: any = {};
            try {
                parsedSettings = JSON.parse(settingsJson);
            } catch {
                return;
            }

            const selectedThemeId = parsedSettings?.selectedThemeId;
            const selectedThemeAppliedAt = parsedSettings?.selectedThemeAppliedAt;

            if (!selectedThemeId || selectedThemeAppliedAt) {
                return;
            }

            const existingPagesResponse = await firstValueFrom(this.customPagesService.all());
            const existingPages = existingPagesResponse?.result || [];
            if (existingPages.length > 0) {
                return;
            }

            const template = this.templateService.getTemplateById(selectedThemeId);
            if (!template) {
                return;
            }

            startedApplying = true;
            this.applyingThemeSetup.set(true);
            this.messageService.add({
                severity: 'info',
                summary: 'Setting up your site',
                detail: 'Applying your selected theme. This may take a few seconds...',
                life: 4000
            });

            const applyResult = await this.themeApplicationService.applyTheme(template);
            if (!applyResult.success && applyResult.createdPages.length === 0) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Theme setup skipped',
                    detail: 'Your selected theme could not be applied automatically right now.',
                    life: 4000
                });
                return;
            }

            parsedSettings.selectedThemeAppliedAt = new Date().toISOString();

            const updateDto = new TenantSettingDto();
            updateDto.id = tenantSettings.id;
            updateDto.tenantName = tenantSettings.tenantName;
            updateDto.settings = JSON.stringify(parsedSettings);

            await firstValueFrom(this.tenantSettingService.tenantSetting_UpdateTenantSetting(updateDto));
            await this._tenantSettings.refreshSettings();

            this.messageService.add({
                severity: 'success',
                summary: 'Theme applied',
                detail: 'Your selected theme has been set up successfully.',
                life: 3000
            });
        } catch (error) {
            console.error('Automatic registration theme application failed:', error);
            if (startedApplying) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Theme setup issue',
                    detail: 'We could not finish applying your selected theme automatically.',
                    life: 4000
                });
            }
        } finally {
            if (startedApplying) {
                this.applyingThemeSetup.set(false);
            }
        }
    }

    getRegisterRoute(): string {
        return this.tenantService.getTenantType() === 'host' ? '/auth/tenant-register' : '/auth/register';
    }
}
