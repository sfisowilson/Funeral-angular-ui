import { Component, OnInit, Injector } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthServiceProxy, RegisterRequest } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { TenantBaseComponent } from '../../core/tenant-base.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, ToastModule],
    providers: [MessageService],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent extends TenantBaseComponent implements OnInit {
    checked: boolean = false;

    form: FormGroup = new FormGroup({});

    // Tenant branding properties
    tenantLogo: string | null = null;
    tenantName: string = 'Funeral Management System';
    isBusy: boolean = false;
    agentCode: string | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authServiceProxy: AuthServiceProxy,
        protected override tenantSettingsService: TenantSettingsService,
        private route: ActivatedRoute,
        private messageService: MessageService,
        protected override injector: Injector
    ) {
        super(injector);
    }

    override async ngOnInit(): Promise<void> {
        this.route.queryParams.subscribe(params => {
            if (params['agentCode']) {
                this.agentCode = params['agentCode'];
            }
        });

        console.log('RegisterComponent.ngOnInit: CALLED');
        try {
            await super.ngOnInit();
            console.log('RegisterComponent.ngOnInit: after super.ngOnInit()');

            this.form = this.fb.group({
                email: ['', [Validators.required, Validators.email]],
                password: ['', Validators.required],
                confirmPassword: ['', Validators.required],
                firstName: ['', Validators.required],
                lastName: ['', Validators.required]
            });
        } catch (error) {
            console.error('Error in RegisterComponent.ngOnInit:', error);
        }
    }

    register() {
        // Ensure browser autofill updates the reactive control before validation runs.
        this.patchEmailFromNativeInput();
        console.log('RegisterComponent.register: CALLED', this.form.value, this.form.valid);
        this.isBusy = true;
        if (!this.form.valid) {
            this.isBusy = false;
            this.showAlertMessage('error', 'Please fill in all required fields.');
            return;
        }
        console.log('RegisterComponent.register: form is valid, proceeding');
        const fv = this.form.value;
        if (fv.password !== fv.confirmPassword) {
            this.showAlertMessage('error', 'Passwords do not match.');
            this.isBusy = false;
            return;
        }

        const memberRegisterRequest: RegisterRequest = RegisterRequest.fromJS({
            email: fv.email || '',
            password: fv.password || '',
            firstName: fv.firstName || '',
            lastName: fv.lastName || '',
            agentCode: this.agentCode || undefined
        });

        if (!memberRegisterRequest.email) {
            this.showAlertMessage('warning', 'Email is required for registration.');
            this.isBusy = false;
            return;
        }
        this.authServiceProxy
            .auth_Register(memberRegisterRequest)
            .subscribe({
                next: () => {
                    this.showAlertMessage('success', 'Member registered successfully');
                    this.router.navigate(['/auth/login']);
                },
                error: (error) => {
                    this.showAlertMessage('error', this.getErrorMessage(error));
                }
            })
            .add(() => (this.isBusy = false));
    }

    override async loadTenantSettings() {
        try {
            const settings = await this.tenantSettingsService.loadSettings();
            console.log('Register component - Full settings object:', settings);

            if (settings) {
                this.tenantName = settings.tenantName || 'Funeral Management System';

                let logoId = null;

                if (settings.logo) {
                    logoId = settings.logo;
                }

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
                    this.tenantLogo = this.tenantSettingsService.getDownloadUrl(logoId);
                } else {
                    console.log('Register component - No logo found');
                }
            }
        } catch (error) {
            this.tenantName = 'Funeral Management System';
        }
        this.loading = false;
    }

    showAlertMessage(type: 'success' | 'error' | 'warning' | 'info', message: string) {
        this.messageService.add({ severity: type, summary: type.charAt(0).toUpperCase() + type.slice(1), detail: message });
    }

    patchEmailFromNativeInput(): void {
        const emailControl = this.form.get('email');
        if (!emailControl || emailControl.value) {
            return;
        }

        const native = document.getElementById('memberEmail') as HTMLInputElement | null;
        if (native && native.value) {
            emailControl.setValue(native.value);
        }
    }

    private getErrorMessage(error: any): string {
        if (error && error.response) {
            try {
                const responseObj = JSON.parse(error.response);
                if (responseObj && responseObj.error) {
                    return responseObj.error;
                }
            } catch (e) {
                // ignore parsing error
            }
        }
        return error.message || 'An unknown error occurred';
    }
}
