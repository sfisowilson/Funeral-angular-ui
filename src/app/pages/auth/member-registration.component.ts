import { Component, OnInit, Injector, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { InputMaskModule } from 'primeng/inputmask';
import { CardModule } from 'primeng/card';
import { StepperModule } from 'primeng/stepper';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DateTime } from 'luxon';
import { 
    MemberRegistrationServiceProxy, 
    CheckIdNumberDto, 
    CheckIdNumberResponseDto,
    RegisterNewMemberDto,
    RequestDependentOtpDto,
    VerifyDependentOtpDto,
    PolicyOptionDto
} from '../../core/services/service-proxies';
import { TenantBaseComponent } from '../../core/tenant-base.component';
import { SAIdValidator, SAIdInfo } from '../../shared/utils/sa-id-validator';

@Component({
    selector: 'app-member-registration',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        ButtonModule,
        InputTextModule,
        PasswordModule,
        InputMaskModule,
        CardModule,
        StepperModule,
        ToastModule,
        ProgressSpinnerModule
    ],
    providers: [MessageService, MemberRegistrationServiceProxy],
    templateUrl: './member-registration.component.html',
    styleUrl: './member-registration.component.scss'
})
export class MemberRegistrationComponent extends TenantBaseComponent implements OnInit {
    // Step tracking
    currentStep = signal(1);
    
    // Tenant branding
    tenantLogo: string | null = null;
    tenantName: string = 'Funeral Management System';
    
    // Forms for each step
    idCheckForm: FormGroup;
    newMemberForm: FormGroup;
    otpForm: FormGroup;
    accountForm: FormGroup;
    
    // Data
    idCheckResponse = signal<CheckIdNumberResponseDto | null>(null);
    policyOptions = signal<PolicyOptionDto[]>([]);
    selectedPolicy = signal<PolicyOptionDto | null>(null);
    idInfo = signal<SAIdInfo | null>(null);
    
    // State
    isProcessing = signal(false);
    isExistingMember = signal(false);
    otpSentTo = signal<string>('');
    
    constructor(
        private fb: FormBuilder,
        private router: Router,
        private messageService: MessageService,
        private registrationService: MemberRegistrationServiceProxy,
        protected override injector: Injector
    ) {
        super(injector);
        
        // Step 1: ID Number Check
        this.idCheckForm = this.fb.group({
            idNumber: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]]
        });
        
        // Step 2a: New Member Registration
        this.newMemberForm = this.fb.group({
            firstNames: ['', Validators.required],
            surname: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phoneNumber: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
        
        // Step 2b: OTP Request
        this.otpForm = this.fb.group({
            contactMethod: ['email', Validators.required]
        });
        
        // Step 3: Account Creation (for existing members)
        this.accountForm = this.fb.group({
            otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }
    
    override async ngOnInit(): Promise<void> {
        await super.ngOnInit();
    }
    
    // Password match validator
    passwordMatchValidator(group: FormGroup) {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }
    
    // Step 1: Check ID Number
    async checkIdNumber() {
        if (this.idCheckForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Input',
                detail: 'Please enter a valid 13-digit South African ID number'
            });
            return;
        }
        
        const idNumber = this.idCheckForm.value.idNumber;
        
        // Validate ID number format
        const idInfo = SAIdValidator.validate(idNumber);
        this.idInfo.set(idInfo);
        
        if (!idInfo.isValid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid ID Number',
                detail: 'Please enter a valid South African ID number'
            });
            return;
        }
        
        this.isProcessing.set(true);
        
        try {
            const dto = new CheckIdNumberDto();
            dto.idNumber = idNumber;
            
            const response = await this.registrationService.memberRegistration_CheckIdNumber(dto).toPromise();
            
            if (!response) {
                throw new Error('No response from server');
            }
            
            this.idCheckResponse.set(response);
            
            if (response.exists) {
                // Check if user account already exists
                if (response.hasUserAccount) {
                    // User already has an account - redirect to login
                    this.messageService.add({
                        severity: 'info',
                        summary: 'Account Exists',
                        detail: 'This ID number already has an account. Redirecting to login...'
                    });
                    
                    setTimeout(() => {
                        this.router.navigate(['/auth/login']);
                    }, 2000);
                    return;
                }
                
                // Existing member without user account - go to OTP flow
                this.isExistingMember.set(true);
                this.currentStep.set(3); // Skip to OTP step
                
                this.messageService.add({
                    severity: 'info',
                    summary: 'Member Found',
                    detail: `Welcome, ${response.memberName}! We'll send you a verification code to create your account.`
                });
            } else {
                // New member - load policy options
                this.isExistingMember.set(false);
                await this.loadPolicyOptions();
                this.currentStep.set(2);
                
                // Pre-fill date of birth from ID
                if (idInfo.dateOfBirth) {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'ID Verified',
                        detail: `Date of Birth: ${idInfo.dateOfBirth.toLocaleDateString()}, Gender: ${idInfo.gender}`
                    });
                }
            }
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to check ID number'
            });
        } finally {
            this.isProcessing.set(false);
        }
    }
    
    // Step 2: Load Policy Options
    async loadPolicyOptions() {
        try {
            const options = await this.registrationService.memberRegistration_GetPolicyOptions().toPromise();
            if (options) {
                this.policyOptions.set(options);
                
                // Auto-select recommended policy
                const recommended = options.find(p => p.isRecommended);
                if (recommended) {
                    this.selectedPolicy.set(recommended);
                }
            }
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load policy options'
            });
        }
    }
    
    // Select policy
    selectPolicy(policy: PolicyOptionDto) {
        this.selectedPolicy.set(policy);
    }
    
    // Step 2a: Register New Member
    async registerNewMember() {
        if (this.newMemberForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Input',
                detail: 'Please fill in all required fields correctly'
            });
            return;
        }
        
        if (!this.selectedPolicy()) {
            this.messageService.add({
                severity: 'error',
                summary: 'No Policy Selected',
                detail: 'Please select a funeral cover policy'
            });
            return;
        }
        
        this.isProcessing.set(true);
        
        try {
            const idInfo = this.idInfo();
            const dto = new RegisterNewMemberDto();
            dto.idNumber = this.idCheckForm.value.idNumber;
            dto.email = this.newMemberForm.value.email;
            dto.password = this.newMemberForm.value.password;
            dto.firstNames = this.newMemberForm.value.firstNames;
            dto.surname = this.newMemberForm.value.surname;
            dto.phoneNumber = this.newMemberForm.value.phoneNumber;
            dto.selectedCoverAmount = this.selectedPolicy()!.coverAmount;
            dto.dateOfBirth = idInfo?.dateOfBirth ? DateTime.fromJSDate(idInfo.dateOfBirth) : undefined;
            
            const response = await this.registrationService.memberRegistration_RegisterNewMember(dto).toPromise();
            
            if (response?.succeeded) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Registration Successful',
                    detail: 'Your account has been created successfully!'
                });
                
                // Wait a bit then redirect to login
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 2000);
            } else {
                throw new Error(response?.message || 'Registration failed');
            }
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Registration Failed',
                detail: error.message || 'Failed to create account'
            });
        } finally {
            this.isProcessing.set(false);
        }
    }
    
    // Step 2b: Send OTP to existing member
    async sendOtp() {
        const response = this.idCheckResponse();
        if (!response) return;
        
        const contactMethod = this.otpForm.value.contactMethod;
        
        this.isProcessing.set(true);
        
        try {
            const dto = new RequestDependentOtpDto();
            dto.idNumber = this.idCheckForm.value.idNumber;
            dto.contactMethod = contactMethod;
            
            const success = await this.registrationService.memberRegistration_SendDependentOtp(dto).toPromise();
            
            if (success) {
                const contactValue = contactMethod === 'email' ? response.contactEmail : response.contactPhone;
                this.otpSentTo.set(contactValue || '');
                
                this.messageService.add({
                    severity: 'success',
                    summary: 'OTP Sent',
                    detail: `Verification code sent to ${contactValue}`
                });
                
                this.currentStep.set(4); // Move to OTP verification step
            }
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to send verification code'
            });
        } finally {
            this.isProcessing.set(false);
        }
    }
    
    // Step 3: Verify OTP and Create Account
    async verifyOtpAndCreateAccount() {
        if (this.accountForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid Input',
                detail: 'Please fill in all required fields correctly'
            });
            return;
        }
        
        const response = this.idCheckResponse();
        if (!response) return;
        
        this.isProcessing.set(true);
        
        try {
            const dto = new VerifyDependentOtpDto();
            dto.idNumber = this.idCheckForm.value.idNumber;
            dto.otpCode = this.accountForm.value.otpCode;
            dto.email = this.accountForm.value.email;
            dto.password = this.accountForm.value.password;
            
            const authResult = await this.registrationService.memberRegistration_VerifyOtpAndCreateAccount(dto).toPromise();
            
            if (authResult?.succeeded) {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Account Created',
                    detail: 'Your account has been created successfully!'
                });
                
                // Wait a bit then redirect to login
                setTimeout(() => {
                    this.router.navigate(['/auth/login']);
                }, 2000);
            } else {
                throw new Error(authResult?.message || 'Verification failed');
            }
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Verification Failed',
                detail: error.message || 'Failed to verify code'
            });
        } finally {
            this.isProcessing.set(false);
        }
    }
    
    // Navigation
    goBack() {
        if (this.currentStep() > 1) {
            this.currentStep.update(step => step - 1);
        }
    }
    
    goToLogin() {
        this.router.navigate(['/auth/login']);
    }
    
    onIdNumberChange() {
        const idNumber = this.idCheckForm.value.idNumber;
        if (idNumber && idNumber.length === 13) {
            const info = SAIdValidator.validate(idNumber);
            this.idInfo.set(info);
        } else {
            this.idInfo.set(null);
        }
    }
}
