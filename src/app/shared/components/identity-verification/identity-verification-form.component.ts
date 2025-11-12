import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { VerificationServiceProxy, CreateVerificationRequestDto, VerificationRequestDto } from '../../../core/services/service-proxies';
import { TenantFeatureService, TenantFeaturesDto } from '../../../core/services/tenant-feature.service';

interface VerificationTypeOption {
    label: string;
    value: string;
    description: string;
    icon: string;
}

interface VerificationResult {
    success: boolean;
    verificationRequest?: VerificationRequestDto;
    error?: string;
}

@Component({
    selector: 'app-identity-verification-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, InputTextModule, CalendarModule, DropdownModule, CardModule, DividerModule, ProgressSpinnerModule, TagModule],
    templateUrl: './identity-verification-form.component.html',
    styleUrl: './identity-verification-form.component.scss'
})
export class IdentityVerificationFormComponent implements OnInit {
    @Input() title: string = 'Identity Verification';
    @Input() subtitle: string = 'Please verify your identity to continue';
    @Input() memberId?: string;
    @Input() userId?: string;
    @Input() claimId?: string;
    @Input() autoSubmit: boolean = false;
    @Input() showQuickVerify: boolean = true;
    @Input() initialData?: {
        idNumber?: string;
        firstName?: string;
        lastName?: string;
        dateOfBirth?: Date;
    };

    @Output() verificationComplete = new EventEmitter<VerificationResult>();
    @Output() verificationStarted = new EventEmitter<void>();

    verificationForm: FormGroup;
    submitting = signal(false);
    quickVerifying = signal(false);
    maxDate = new Date(); // Add maxDate property
    tenantFeatures = signal<TenantFeaturesDto | null>(null);
    featuresLoading = signal(true);

    verificationTypes: VerificationTypeOption[] = [
        {
            label: 'Standard ID Verification',
            value: 'STANDARD',
            description: 'Basic identity verification using ID number and personal details',
            icon: 'pi pi-id-card'
        },
        {
            label: 'Enhanced Verification',
            value: 'ENHANCED',
            description: 'Advanced verification with additional checks',
            icon: 'pi pi-shield'
        },
        {
            label: 'Quick ID Check',
            value: 'QUICK',
            description: 'Fast identity verification using existing profile data',
            icon: 'pi pi-bolt'
        }
    ];

    constructor(
        private fb: FormBuilder,
        private verificationService: VerificationServiceProxy,
        private tenantFeatureService: TenantFeatureService,
        private messageService: MessageService
    ) {
        this.verificationForm = this.fb.group({
            idNumber: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            dateOfBirth: [null, Validators.required],
            verificationType: ['STANDARD', Validators.required]
        });
    }

    ngOnInit(): void {
        // Load tenant features first
        this.loadTenantFeatures();

        if (this.initialData) {
            this.verificationForm.patchValue({
                idNumber: this.initialData.idNumber || '',
                firstName: this.initialData.firstName || '',
                lastName: this.initialData.lastName || '',
                dateOfBirth: this.initialData.dateOfBirth || null
            });
        }

        if (this.autoSubmit && this.isFormValid()) {
            this.submitVerification();
        }
    }

    private loadTenantFeatures(): void {
        this.featuresLoading.set(true);

        this.tenantFeatureService.getCurrentTenantFeatures().subscribe({
            next: (features) => {
                this.tenantFeatures.set(features);
                this.filterVerificationTypes(features);
                this.featuresLoading.set(false);
            },
            error: (error) => {
                console.error('Failed to load tenant features:', error);
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Feature Check Failed',
                    detail: 'Unable to verify subscription features. Some options may be limited.'
                });
                this.featuresLoading.set(false);
            }
        });
    }

    private filterVerificationTypes(features: TenantFeaturesDto): void {
        // Start with all verification types
        let availableTypes = [...this.verificationTypes];

        // Filter based on subscription features
        if (!features.identityVerification) {
            // If identity verification is not supported, disable the component
            this.verificationForm.disable();
            this.messageService.add({
                severity: 'info',
                summary: 'Feature Not Available',
                detail: 'Identity verification is not available in your current subscription plan.'
            });
            return;
        }

        // Filter enhanced verification
        if (!features.enhancedVerification) {
            availableTypes = availableTypes.filter((type) => type.value !== 'ENHANCED');
        }

        // Filter quick ID check
        if (!features.quickIdCheck) {
            availableTypes = availableTypes.filter((type) => type.value !== 'QUICK');
            this.showQuickVerify = false;
        }

        // Update the available verification types
        this.verificationTypes = availableTypes;

        // If current selection is no longer available, reset to first available option
        const currentType = this.verificationForm.get('verificationType')?.value;
        if (!availableTypes.some((type) => type.value === currentType)) {
            this.verificationForm.patchValue({
                verificationType: availableTypes.length > 0 ? availableTypes[0].value : ''
            });
        }

        // Check usage limits
        if (features.verificationLimitReached) {
            this.verificationForm.disable();
            this.messageService.add({
                severity: 'warn',
                summary: 'Usage Limit Reached',
                detail: `You have reached your monthly verification limit of ${features.maxVerificationsPerMonth}. Upgrade your plan for more verifications.`
            });
        } else if (features.maxVerificationsPerMonth > 0) {
            // Show usage information
            const remaining = features.maxVerificationsPerMonth - features.verificationsUsedThisMonth;
            if (remaining <= 3) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Low Verification Credits',
                    detail: `You have ${remaining} verification${remaining === 1 ? '' : 's'} remaining this month.`
                });
            }
        }
    }

    submitVerification(): void {
        if (this.verificationForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        this.submitting.set(true);
        this.verificationStarted.emit();

        const formValue = this.verificationForm.value;
        const request = new CreateVerificationRequestDto();
        request.idNumber = formValue.idNumber;
        request.firstName = formValue.firstName;
        request.lastName = formValue.lastName;
        request.dateOfBirth = formValue.dateOfBirth;
        request.verificationType = formValue.verificationType;

        // Set context-specific IDs
        request.userId = this.userId;
        request.memberId = this.memberId;
        request.claimId = this.claimId;

        this.verificationService.verification_CreateRequest(request).subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Verification Submitted',
                    detail: 'Identity verification request has been submitted successfully'
                });

                this.verificationComplete.emit({
                    success: true,
                    verificationRequest: result
                });

                this.submitting.set(false);
            },
            error: (error) => {
                console.error('Verification error:', error);
                const errorMessage = error?.error?.message || 'Failed to submit verification request. Please try again.';

                this.messageService.add({
                    severity: 'error',
                    summary: 'Verification Failed',
                    detail: errorMessage
                });

                this.verificationComplete.emit({
                    success: false,
                    error: errorMessage
                });

                this.submitting.set(false);
            }
        });
    }

    performQuickVerification(): void {
        if (!this.verificationForm.get('idNumber')?.value) {
            this.messageService.add({
                severity: 'warn',
                summary: 'ID Number Required',
                detail: 'Please enter an ID number for quick verification'
            });
            return;
        }

        this.quickVerifying.set(true);
        this.verificationStarted.emit();

        const request = new CreateVerificationRequestDto();
        request.idNumber = this.verificationForm.get('idNumber')?.value;
        request.verificationType = 'QUICK';
        request.userId = this.userId;
        request.memberId = this.memberId;
        request.claimId = this.claimId;

        this.verificationService.verification_CreateRequest(request).subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Quick Verification Complete',
                    detail: 'Quick ID check completed successfully'
                });

                this.verificationComplete.emit({
                    success: true,
                    verificationRequest: result
                });

                this.quickVerifying.set(false);
            },
            error: (error) => {
                console.error('Quick verification error:', error);
                const errorMessage = error?.error?.message || 'Failed to perform quick ID check. Please try again.';

                this.messageService.add({
                    severity: 'error',
                    summary: 'Quick Verification Failed',
                    detail: errorMessage
                });

                this.verificationComplete.emit({
                    success: false,
                    error: errorMessage
                });

                this.quickVerifying.set(false);
            }
        });
    }

    isFormValid(): boolean {
        return this.verificationForm.valid;
    }

    private markFormGroupTouched(): void {
        Object.keys(this.verificationForm.controls).forEach((key) => {
            const control = this.verificationForm.get(key);
            control?.markAsTouched();
        });
    }

    isFieldInvalid(fieldName: string): boolean {
        const field = this.verificationForm.get(fieldName);
        return !!(field && field.invalid && (field.dirty || field.touched));
    }

    getFieldError(fieldName: string): string {
        const field = this.verificationForm.get(fieldName);
        if (!field || !field.errors) return '';

        if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
        if (field.errors['pattern']) return 'Please enter a valid 13-digit ID number';
        if (field.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;

        return 'Invalid input';
    }

    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            idNumber: 'ID Number',
            firstName: 'First Name',
            lastName: 'Last Name',
            dateOfBirth: 'Date of Birth',
            verificationType: 'Verification Type'
        };
        return labels[fieldName] || fieldName;
    }
}
