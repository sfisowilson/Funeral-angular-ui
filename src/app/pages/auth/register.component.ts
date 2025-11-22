import { Component, OnInit, Injector, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth-service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { AuthService as AuthApiService } from '../../core/services/generated/auth/auth.service';
import { LookupService } from '../../core/services/generated/lookup/lookup.service';
import { PoliciesService } from '../../core/services/generated/policies/policies.service';
import { MemberRegistrationService } from '../../core/services/generated/member-registration/member-registration.service';
import { PolicyDto, RegisterRequest, TenantCreateUpdateDto } from '../../core/models';
import { PolicySelectionModalComponent } from './policy-selection-modal/policy-selection-modal.component';
import { TenantBaseComponent } from '../../core/tenant-base.component';
import { IdentityVerificationFormComponent } from '../../shared/components/identity-verification/identity-verification-form.component';
import { SAIdValidator, SAIdInfo } from '../../shared/utils/sa-id-validator';
import { environment } from '../../../environments/environment';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule, ReactiveFormsModule, IdentityVerificationFormComponent],
    providers: [HttpClient, AuthApiService, LookupService, PoliciesService, MemberRegistrationService, DialogService],
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
    tenantTypes: { label: string; value: any }[] = [];
    selectedPolicy: PolicyDto | null = null;
    showModal: boolean = false;
    alertMessage: string = '';
    alertType: 'success' | 'error' | 'warning' | 'info' = 'info';
    showAlert: boolean = false;

    // Identity verification properties
    showVerificationDialog: boolean = false;
    registeredUserId?: string;
    skipVerification: boolean = true;
    
    // SA ID validation
    idInfo = signal<SAIdInfo | null>(null);
    parsedDateOfBirth = signal<Date | null>(null);
    parsedGender = signal<string | null>(null);
    
    requirePolicySelection: boolean = true; // Default to true
    private dialogRef?: DynamicDialogRef;
    settings:any;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private authApiService: AuthApiService,
        protected override tenantSettingsService: TenantSettingsService,
        private lookupService: LookupService,
        private route: ActivatedRoute,
        private policyService: PoliciesService,
        private memberRegistrationService: MemberRegistrationService,
        private dialogService: DialogService,
        protected override injector: Injector
    ) {
        super(injector);
    }
    override async ngOnInit(): Promise<void> {
        console.log('RegisterComponent.ngOnInit: CALLED');
        try {
            await super.ngOnInit();

            // Use tenant type from tenant service instead of checking tenant name
            this.isHostTenant = this.tenantService.getTenantType() === 'host';
            this.settings = await this.tenantSettingsService.loadSettings();
            let tenantSettings = JSON.parse(this.settings.settings);
            this.requirePolicySelection = tenantSettings.requirePolicySelection === true; // Default to false if not set
            console.log('requirePolicySelection =', this.requirePolicySelection);

            console.log('RegisterComponent.ngOnInit: tenantType =', this.tenantService.getTenantType(), 'isHostTenant =', this.isHostTenant);

            if (this.isHostTenant) {
                this.lookupService.getApiLookupGetEnumValuesEnumTypeName<any[]>('TenantType').subscribe(
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
                    type: ['']
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

                this.route.queryParams.subscribe((params) => {
                    if (params['policyId']) {
                        const policyId = +params['policyId'];
                        this.form.patchValue({ policyId: policyId });
                        this.policyService.getApiPolicyPolicyGetByIdId<PolicyDto>(policyId.toString()).subscribe((policy) => {
                            this.selectedPolicy = policy;
                        });
                    }
                    // If no policy selected yet, user will need to click "Select Policy" button
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
            const tenantRegisterDto: TenantCreateUpdateDto = {
                id: '00000000-0000-0000-0000-000000000000', // Use empty GUID for new tenant
                email: fv.email || '',
                password: fv.password || '',
                name: fv.name || '',
                domain: fv.domain || '',
                address: fv.address || '',
                phone1: fv.phone1 || '',
                phone2: fv.phone2 || '',
                registrationNumber: fv.registrationNumber || '',
                type: fv.type || (0 as any),
                subscriptionPlanId: fv.subscriptionPlanId || undefined
            };
            if (!tenantRegisterDto.email) {
                this.showAlertMessage('warning', 'Email is required for tenant registration.');
                this.isBusy = false;
                return;
            }
            this.authApiService.postApiAuthAuthRegisterTenant<any>(tenantRegisterDto)
                .subscribe({
                    next: (result) => {
                        if (result) {
                            this.showAlertMessage('success', 'Tenant registered successfully');
                            // Redirect to the new tenant's domain
                            const tenantDomain = fv.domain || '';
                            if (tenantDomain) {
                                const newUrl = `${window.location.protocol}//${tenantDomain}.${environment.baseDomain}/auth/login`;
                                window.location.href = newUrl;
                            } else {
                                this.router.navigate(['/auth/login']);
                            }
                        } else {
                            this.showAlertMessage('error', 'Tenant registration failed');
                        }
                    },
                    error: (error: any) => {
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
            
            // Build member registration request with all required fields
            const memberRegisterRequest: any = {
                email: fv.email || '',
                password: fv.password || '',
                firstNames: fv.firstName || '',
                surname: fv.lastName || '',
                phoneNumber: fv.phoneNumber || '',
                idNumber: fv.identificationNumber || ''
            };
            
            // Only include policy if it was selected (and required)
            if (this.selectedPolicy && this.selectedPolicy.coverageAmount) {
                memberRegisterRequest.selectedCoverAmount = this.selectedPolicy.coverageAmount;
            }
            
            // Add dateOfBirth if available from ID validation
            const dob = this.parsedDateOfBirth();
            if (dob) {
                memberRegisterRequest.dateOfBirth = dob.toISOString();
            }
            
            if (!memberRegisterRequest.email || !memberRegisterRequest.password || 
                !memberRegisterRequest.firstNames || !memberRegisterRequest.surname || 
                !memberRegisterRequest.idNumber) {
                this.showAlertMessage('warning', 'Email, password, first name, last name, and ID number are required.');
                this.isBusy = false;
                return;
            }
            
            // Only validate policy selection if required by tenant
            if (this.requirePolicySelection && !this.selectedPolicy) {
                this.showAlertMessage('warning', 'Please select a policy to continue.');
                this.isBusy = false;
                return;
            }
            
            this.memberRegistrationService.postApiMemberRegistrationMemberRegistrationRegisterNewMember<any>(memberRegisterRequest)
                .subscribe({
                    next: (res) => {
                        debugger;
                        this.showAlertMessage('success', 'Member registered successfully');

                        // Show identity verification dialog if ID number was provided
                        if (this.form.value.identificationNumber && !this.skipVerification) {
                            this.showVerificationDialog = true;
                        } else {
                            this.router.navigate(['/auth/login']);
                        }
                    },
                    error: (error: any) => {
                        this.showAlertMessage('error', error.message);
                    }
                })
                .add(() => (this.isBusy = false));
        }
    }

    override async loadTenantSettings() {
        try {
            this.settings = await this.tenantSettingsService.loadSettings();
            console.log('Register component - Full settings object:', this.settings );

            if (this.settings ) {
                this.tenantName = this.settings.tenantName || 'Funeral Management System';
                
                // Check if policy selection is required
                this.requirePolicySelection = this.settings.requirePolicySelection !== false; // Default to true if not set

                // Try multiple ways to get the logo
                let logoId = null;

                // Check if logo is directly on settings object
                if (this.settings.logo) {
                    logoId = this.settings.logo;
                }

                // Check if logo is in parsed JSON settings
                if (this.settings.settings) {
                    try {
                        const parsedSettings = JSON.parse(this.settings.settings);
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
        this.dialogRef = this.dialogService.open(PolicySelectionModalComponent, {
            header: 'Select Your Policy',
            width: '90vw',
            height: '90vh',
            maximizable: true,
            modal: true,
            dismissableMask: false,
            styleClass: 'policy-selection-dialog'
        });

        this.dialogRef.onClose.subscribe((policy: PolicyDto | null) => {
            if (policy) {
                this.selectedPolicy = policy;
                this.form.patchValue({ policyId: policy.id });
            }
        });
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
