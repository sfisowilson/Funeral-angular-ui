import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { UserProfileServiceProxy, CreateVerificationRequestDto, VerificationRequestDto } from '../../core/services/service-proxies';

interface VerificationTypeOption {
    label: string;
    value: string;
    description: string;
    icon: string;
}

interface VerificationStatus {
    status: string;
    label: string;
    severity: 'success' | 'info' | 'warning' | 'danger';
    icon: string;
}

@Component({
    selector: 'app-identity-verification',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, CalendarModule, DropdownModule, TableModule, TagModule, ToastModule, CardModule, DividerModule, ProgressSpinnerModule],
    providers: [UserProfileServiceProxy, MessageService],
    templateUrl: './identity-verification.component.html',
    styleUrl: './identity-verification.component.scss'
})
export class IdentityVerificationComponent implements OnInit {
    verificationForm: FormGroup;
    verificationHistory = signal<VerificationRequestDto[]>([]);
    loading = signal(false);
    submitting = signal(false);
    quickVerifying = signal(false);

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
        private userProfileService: UserProfileServiceProxy,
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
        this.loadVerificationHistory();
    }

    loadVerificationHistory(): void {
        this.loading.set(true);
        this.userProfileService.userProfile_GetVerificationHistory().subscribe({
            next: (history) => {
                this.verificationHistory.set(history || []);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading verification history:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load verification history'
                });
                this.loading.set(false);
            }
        });
    }

    submitVerification(): void {
        if (this.verificationForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        this.submitting.set(true);

        const formValue = this.verificationForm.value;
        const request = new CreateVerificationRequestDto();
        request.idNumber = formValue.idNumber;
        request.firstName = formValue.firstName;
        request.lastName = formValue.lastName;
        request.dateOfBirth = formValue.dateOfBirth;
        request.verificationType = formValue.verificationType;
        // Optional fields - can be undefined for user profile verification
        request.userId = undefined;
        request.memberId = undefined;
        request.claimId = undefined;

        this.userProfileService.userProfile_VerifyIdentity(request).subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Verification Submitted',
                    detail: 'Your identity verification request has been submitted successfully'
                });
                this.verificationForm.reset();
                this.verificationForm.patchValue({ verificationType: 'STANDARD' });
                this.loadVerificationHistory();
                this.submitting.set(false);
            },
            error: (error) => {
                console.error('Verification error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Verification Failed',
                    detail: 'Failed to submit verification request. Please try again.'
                });
                this.submitting.set(false);
            }
        });
    }

    performQuickIdCheck(): void {
        this.quickVerifying.set(true);

        this.userProfileService.userProfile_QuickIdCheck().subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Quick Verification Complete',
                    detail: 'Quick ID check completed successfully'
                });
                this.loadVerificationHistory();
                this.quickVerifying.set(false);
            },
            error: (error) => {
                console.error('Quick verification error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Quick Verification Failed',
                    detail: 'Failed to perform quick ID check. Please try again.'
                });
                this.quickVerifying.set(false);
            }
        });
    }

    getVerificationStatus(status: string): VerificationStatus {
        switch (status?.toUpperCase()) {
            case 'VERIFIED':
            case 'COMPLETED':
                return {
                    status,
                    label: 'Verified',
                    severity: 'success',
                    icon: 'pi pi-check-circle'
                };
            case 'PENDING':
            case 'PROCESSING':
                return {
                    status,
                    label: 'Processing',
                    severity: 'info',
                    icon: 'pi pi-clock'
                };
            case 'FAILED':
            case 'REJECTED':
                return {
                    status,
                    label: 'Failed',
                    severity: 'danger',
                    icon: 'pi pi-times-circle'
                };
            case 'EXPIRED':
                return {
                    status,
                    label: 'Expired',
                    severity: 'warning',
                    icon: 'pi pi-exclamation-triangle'
                };
            default:
                return {
                    status,
                    label: status || 'Unknown',
                    severity: 'info',
                    icon: 'pi pi-info-circle'
                };
        }
    }

    formatDate(date: any): string {
        if (!date) return 'N/A';
        try {
            return new Date(date).toLocaleDateString('en-ZA', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid Date';
        }
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

        if (field.errors['required']) return `${fieldName} is required`;
        if (field.errors['pattern']) return 'Please enter a valid 13-digit ID number';
        if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;

        return 'Invalid input';
    }
}
