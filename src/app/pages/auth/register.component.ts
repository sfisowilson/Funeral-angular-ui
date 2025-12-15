import { Component, OnInit, Injector, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { AuthServiceProxy, PolicyDto, PolicyServiceProxy, RegisterRequest, TenantCreateUpdateDto } from '../../core/services/service-proxies';
import { HttpClient } from '@angular/common/http';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { LookupServiceProxy, TenantType } from '../../core/services/service-proxies';
import { PolicySelectionModalComponent } from './policy-selection-modal/policy-selection-modal.component';
import { TenantBaseComponent } from '../../core/tenant-base.component';
import { IdentityVerificationFormComponent } from '../../shared/components/identity-verification/identity-verification-form.component';
import { SAIdValidator, SAIdInfo } from '../../shared/utils/sa-id-validator';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, IdentityVerificationFormComponent],
    providers: [HttpClient, AuthServiceProxy, LookupServiceProxy, PolicyServiceProxy],
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
    isHostTenant: boolean = false;
    tenantTypes: { label: string; value: TenantType }[] = [];
    selectedPolicy: PolicyDto | null = null;
    policies: PolicyDto[] = [];
    showModal: boolean = false;
    alertMessage: string = '';
    alertType: 'success' | 'error' | 'warning' | 'info' = 'info';
    showAlert: boolean = false;

    // Identity verification properties
    showVerificationDialog: boolean = false;
    registeredUserId?: string;
    skipVerification: boolean = false;
    
    // SA ID validation
    idInfo = signal<SAIdInfo | null>(null);
    parsedDateOfBirth = signal<Date | null>(null);
    parsedGender = signal<string | null>(null);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private authServiceProxy: AuthServiceProxy,
        protected override tenantSettingsService: TenantSettingsService,
        private lookupService: LookupServiceProxy,
        private route: ActivatedRoute,
        private policyService: PolicyServiceProxy,
        protected override injector: Injector
    ) {
        super(injector);
    }
    override async ngOnInit(): Promise<void> {
        console.log('RegisterComponent.ngOnInit: CALLED');
        try {
            await super.ngOnInit();
            console.log('RegisterComponent.ngOnInit: after super.ngOnInit()');

            // Use tenant type from tenant service instead of checking tenant name
            this.isHostTenant = this.tenantService.getTenantType() === 'host';
            console.log('RegisterComponent.ngOnInit: tenantType =', this.tenantService.getTenantType(), 'isHostTenant =', this.isHostTenant);

            if (this.isHostTenant) {
                this.lookupService.getEnumValues('TenantType').subscribe(
                    (data: any[]) => {
                        console.log('Raw enum data from API:', data);
                        this.tenantTypes = data.map((item: any) => ({ label: item.name, value: item.value }));
                        console.log('Transformed tenantTypes:', this.tenantTypes);
                    },
                    (error) => {
                        console.error('Error loading tenant types:', error);
                    }
                );
                this.form = this.fb.group({
                    name: [''],
                    email: [''],
                    password: [''],
                    domain: [''],
                    address: [''],
                    phone1: [''],
                    phone2: [''],
                    registrationNumber: [''],
                    tenantType: [''],
                    isStaticSite: [false]
                });
            } else {
                this.form = this.fb.group({
                    email: [''],
                    password: [''],
                    firstName: [''],
                    lastName: [''],
                    phoneNumber: [''],
                    policyId: [null],
                    identificationNumber: [''] // Add ID number for verification
                });

                // Load policies for member registration
                this.policyService.policy_GetAllPolicies(undefined, undefined, undefined, undefined, undefined).subscribe({
                    next: (policies) => {
                        this.policies = policies;
                    },
                    error: (error) => {
                        console.error('Error loading policies:', error);
                    }
                });

                this.route.queryParams.subscribe((params) => {
                    if (params['policyId']) {
                        const policyId = +params['policyId'];
                        this.form.patchValue({ policyId: policyId });
                        this.policyService.policy_GetById(policyId.toString()).subscribe((policy) => {
                            this.selectedPolicy = policy;
                        });
                    } else {
                        this.showPolicySelection();
                    }
                });
            }
        } catch (error) {
            console.error('Error in RegisterComponent.ngOnInit:', error);
        }
    }

    register() {
        this.isBusy = true;
        if (!this.form.valid) {
            this.isBusy = false;
            return;
        }

        // If ID number is provided, it must be valid
        if (!this.isHostTenant && this.form.value.identificationNumber) {
            const idInfo = this.idInfo();
            if (!idInfo || !idInfo.isValid) {
                this.showAlertMessage('error', 'Please enter a valid South African ID number or leave the field empty.');
                this.isBusy = false;
                return;
            }
        }

        if (this.isHostTenant) {
            // Workaround: if browser autofill populated the native input but didn't trigger
            // Angular form control updates, read the native input value and patch the form.
            let fv = this.form.value;
            if (!fv.email) {
                const native = document.getElementById('tenantEmail') as HTMLInputElement | null;
                if (native && native.value) {
                    this.form.patchValue({ email: native.value });
                    fv = this.form.value;
                }
            }
            // Build DTO explicitly to avoid missing/mapped properties from the FormGroup
            const tenantRegisterDto: TenantCreateUpdateDto = TenantCreateUpdateDto.fromJS({
                id: '00000000-0000-0000-0000-000000000000', // Use empty GUID for new tenant
                email: fv.email || '',
                password: fv.password || '',
                name: fv.name || '',
                domain: fv.domain || '',
                address: fv.address || '',
                phone1: fv.phone1 || '',
                phone2: fv.phone2 || '',
                registrationNumber: fv.registrationNumber || '',
                tenantType: fv.tenantType || (0 as any),
                subscriptionPlanId: fv.subscriptionPlanId || undefined,
                isStaticSite: fv.isStaticSite || false
            });
            if (!tenantRegisterDto.email) {
                this.showAlertMessage('warning', 'Email is required for tenant registration.');
                this.isBusy = false;
                return;
            }
            this.authServiceProxy.auth_RegisterTenant(tenantRegisterDto)
                .subscribe({
                    next: (result) => {
                        if (result) {
                            this.showAlertMessage('success', 'Tenant registered successfully');
                            this.router.navigate(['/auth/login']);
                        } else {
                            this.showAlertMessage('error', 'Tenant registration failed');
                        }
                    },
                    error: (error) => {
                        this.showAlertMessage('error', error.message);
                    }
                })
                .add(() => (this.isBusy = false));
        } else {
            // Workaround for autofill: patch form.email from native input if needed
            let fv = this.form.value;
            if (!fv.email) {
                const native = document.getElementById('memberEmail') as HTMLInputElement | null;
                if (native && native.value) {
                    this.form.patchValue({ email: native.value });
                    fv = this.form.value;
                }
            }
            
            // Build request object, only including fields with values
            const requestData: any = {
                email: fv.email || '',
                password: fv.password || ''
            };
            
            // Only add optional fields if they have values
            if (fv.firstName) requestData.firstName = fv.firstName;
            if (fv.lastName) requestData.lastName = fv.lastName;
            if (fv.phoneNumber) requestData.phoneNumber = fv.phoneNumber;
            if (fv.identificationNumber) requestData.identificationNumber = fv.identificationNumber;
            if (fv.policyId) requestData.policyId = fv.policyId;
            
            const memberRegisterRequest: RegisterRequest = RegisterRequest.fromJS(requestData);
            
            if (!memberRegisterRequest.email) {
                this.showAlertMessage('warning', 'Email is required for registration.');
                this.isBusy = false;
                return;
            }
            this.authServiceProxy.auth_Register(memberRegisterRequest)
                .subscribe({
                    next: () => {
                        this.showAlertMessage('success', 'Member registered successfully');

                        // Show identity verification dialog if ID number was provided
                        if (this.form.value.identificationNumber && !this.skipVerification) {
                            this.showVerificationDialog = true;
                        } else {
                            this.router.navigate(['/auth/login']);
                        }
                    },
                    error: (error) => {
                        this.showAlertMessage('error', error.message);
                    }
                })
                .add(() => (this.isBusy = false));
        }
    }

    override async loadTenantSettings() {
        try {
            const settings = await this.tenantSettingsService.loadSettings();
            console.log('Register component - Full settings object:', settings);

            if (settings) {
                this.tenantName = settings.tenantName || 'Funeral Management System';

                // Try multiple ways to get the logo
                let logoId = null;

                // Check if logo is directly on settings object
                if (settings.logo) {
                    logoId = settings.logo;
                }

                // Check if logo is in parsed JSON settings
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

    showPolicySelection() {
        this.showModal = true;
    }
    onPolicySelected(policy: PolicyDto) {
        this.selectedPolicy = policy;
        this.form.patchValue({ policyId: policy.id });
        this.showModal = false;
    }
    closePolicyModal() {
        this.showModal = false;
    }

    onVerificationComplete(result: any) {
        if (result.success) {
            this.showAlertMessage('success', 'Your identity has been successfully verified');
        } else {
            this.showAlertMessage('warning', result.error || 'Identity verification was not successful');
        }
        this.closeVerificationDialog();
    }

    onVerificationStarted() {
        this.showAlertMessage('info', 'Processing identity verification request...');
    }

    closeVerificationDialog() {
        this.showVerificationDialog = false;
        this.router.navigate(['/auth/login']);
    }

    // Helper method to show alerts instead of PrimeNG MessageService
    showAlertMessage(type: 'success' | 'error' | 'warning' | 'info', message: string) {
        this.alertType = type;
        this.alertMessage = message;
        this.showAlert = true;
        setTimeout(() => {
            this.showAlert = false;
        }, 5000);
    }
    
    validateIdNumber(idNumber: string) {
        if (!idNumber) {
            this.idInfo.set(null);
            this.parsedDateOfBirth.set(null);
            this.parsedGender.set(null);
            return;
        }

        const info = SAIdValidator.validate(idNumber);
        this.idInfo.set(info);

        if (info.isValid && info.dateOfBirth) {
            // Ensure we have a proper Date object
            const dob = info.dateOfBirth instanceof Date 
                ? info.dateOfBirth 
                : new Date(info.dateOfBirth);
            this.parsedDateOfBirth.set(dob);
            this.parsedGender.set(info.gender);
        } else {
            this.parsedDateOfBirth.set(null);
            this.parsedGender.set(null);
        }
    }

    onIdNumberChange() {
        const idNumber = this.form.get('identificationNumber')?.value;
        this.validateIdNumber(idNumber);
    }

    skipVerificationAndContinue() {
        this.skipVerification = true;
        this.showVerificationDialog = false;
        this.router.navigate(['/auth/login']);
    }
}
