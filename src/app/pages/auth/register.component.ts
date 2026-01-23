import { Component, OnInit, Injector, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { AuthServiceProxy, OnboardingFieldConfigurationDto, OnboardingFieldConfigurationServiceProxy, PolicyDto, PolicyServiceProxy, RegisterRequest, TenantCreateUpdateDto } from '../../core/services/service-proxies';
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
    providers: [HttpClient, AuthServiceProxy, LookupServiceProxy, PolicyServiceProxy, OnboardingFieldConfigurationServiceProxy],
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

    // Dynamic fields
    dynamicFields: OnboardingFieldConfigurationDto[] = [];

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
        private onboardingFieldService: OnboardingFieldConfigurationServiceProxy,
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
                    (response) => {
                        const data = response?.result || [];
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
                    email: ['', [Validators.required, Validators.email]],
                    password: ['', Validators.required],
                    firstName: ['', Validators.required],
                    lastName: ['', Validators.required],
                    phoneNumber: [''],
                    policyId: [null],
                    identificationNumber: [''] // Add ID number for verification
                });

                // Load policies for member registration
                this.policyService.policy_GetAllPolicies(undefined, undefined, undefined, undefined, undefined).subscribe({
                    next: (response) => {
                        this.policies = response?.result || [];
                    },
                    error: (error) => {
                        console.error('Error loading policies:', error);
                    }
                });

                this.route.queryParams.subscribe((params) => {
                    if (params['policyId']) {
                        const policyId = +params['policyId'];
                        this.form.patchValue({ policyId: policyId });
                        this.policyService.policy_GetById(policyId.toString()).subscribe((response) => {
                            this.selectedPolicy = response?.result || null;
                        });
                    } else {
                        this.showPolicySelection();
                    }
                });

                // Fetch dynamic fields
                this.onboardingFieldService.onboardingFieldConfiguration_GetEnabledByContext('Registration')
                    .subscribe(response => {
                        // Filter out fields that don't have a fieldKey, as they cannot be used.
                        this.dynamicFields = response?.result?.filter(f => f.fieldKey) || [];
                        this.dynamicFields.forEach(field => {
                            // Now we can be sure field.fieldKey is a string.
                            const validators = field.isRequired ? [Validators.required] : [];
                            this.form.addControl(field.fieldKey!, this.fb.control('', validators));
                        });
                    });
            }
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
            const fv = this.form.value;
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
            const fv = this.form.value;
            
            // Build request object for registration
            const requestData: any = {
                email: fv.email || '',
                password: fv.password || '',
                firstName: fv.firstName || '',
                lastName: fv.lastName || '',
                phoneNumber: fv.phoneNumber || undefined,
                identificationNumber: fv.identificationNumber || undefined,
                policyId: fv.policyId || undefined,
                customFields: {}
            };

            // Populate custom fields
            this.dynamicFields.forEach(field => {
                const rawValue = fv[field.fieldKey];
                if (!field.fieldKey || rawValue === undefined || rawValue === null) {
                    return;
                }

                // Always send strings so the API can bind into Dictionary<string, string?>.
                requestData.customFields[field.fieldKey] = rawValue.toString();
            });
            
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
        if (this.policies.length === 0) {
            this.showModal = false;
            return;
        }
        
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

    private patchEmailFromNativeInput(): void {
        // Pull the autofilled value from the native input into the reactive control.
        const emailControl = this.form.get('email');
        if (!emailControl || emailControl.value) {
            return;
        }

        const elementId = this.isHostTenant ? 'tenantEmail' : 'memberEmail';
        const native = document.getElementById(elementId) as HTMLInputElement | null;
        if (native && native.value) {
            emailControl.setValue(native.value);
        }
    }

    getOptions(jsonString: string | null | undefined): { value: string, label: string }[] {
        if (!jsonString) {
            return [];
        }
        try {
            // It might be a simple comma-separated string or a JSON array of objects
            if (jsonString.startsWith('[')) {
                return JSON.parse(jsonString);
            } else {
                // Handle comma-separated string and convert it to the object array format
                return jsonString.split(',').map(item => {
                    const trimmed = item.trim();
                    return { value: trimmed, label: trimmed };
                });
            }
        } catch (e) {
            console.error('Error parsing options:', e);
            return [];
        }
    }
}
