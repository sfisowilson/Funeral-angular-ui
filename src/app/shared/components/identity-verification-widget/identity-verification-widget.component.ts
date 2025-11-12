import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserProfileServiceProxy, CreateVerificationRequestDto, VerificationRequestDto } from '../../core/services/service-proxies';

interface VerificationTypeOption {
    label: string;
    value: string;
    description: string;
    icon: string;
}

export interface VerificationWidgetConfig {
    title?: string;
    subtitle?: string;
    showQuickCheck?: boolean;
    verificationType?: string;
    memberId?: string;
    claimId?: string;
    userId?: string;
    compact?: boolean;
}

@Component({
    selector: 'app-identity-verification-widget',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, CalendarModule, DropdownModule, CardModule, ToastModule],
    providers: [UserProfileServiceProxy, MessageService],
    templateUrl: './identity-verification-widget.component.html',
    styleUrl: './identity-verification-widget.component.scss'
})
export class IdentityVerificationWidgetComponent implements OnInit {
    @Input() config: VerificationWidgetConfig = {};
    @Input() autoFillData: { firstName?: string; lastName?: string; idNumber?: string; dateOfBirth?: Date } = {};
    @Output() verificationComplete = new EventEmitter<VerificationRequestDto>();
    @Output() verificationStarted = new EventEmitter<void>();

    verificationForm: FormGroup;
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
        // Auto-fill form with provided data
        if (this.autoFillData) {
            this.verificationForm.patchValue({
                firstName: this.autoFillData.firstName || '',
                lastName: this.autoFillData.lastName || '',
                idNumber: this.autoFillData.idNumber || '',
                dateOfBirth: this.autoFillData.dateOfBirth || null,
                verificationType: this.config.verificationType || 'STANDARD'
            });
        }

        // Set default verification type from config
        if (this.config.verificationType) {
            this.verificationForm.patchValue({ verificationType: this.config.verificationType });
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

        // Set context IDs from config
        request.userId = this.config.userId;
        request.memberId = this.config.memberId;
        request.claimId = this.config.claimId;

        this.userProfileService.userProfile_VerifyIdentity(request).subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Verification Submitted',
                    detail: 'Identity verification request submitted successfully'
                });
                this.verificationComplete.emit(result);
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
        this.verificationStarted.emit();

        this.userProfileService.userProfile_QuickIdCheck().subscribe({
            next: (result) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Quick Verification Complete',
                    detail: 'Quick ID check completed successfully'
                });
                this.verificationComplete.emit(result);
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

        if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
        if (field.errors['pattern']) return 'Please enter a valid 13-digit ID number';
        if (field.errors['minlength']) return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;

        return 'Invalid input';
    }

    private getFieldDisplayName(fieldName: string): string {
        switch (fieldName) {
            case 'idNumber':
                return 'ID Number';
            case 'firstName':
                return 'First Name';
            case 'lastName':
                return 'Last Name';
            case 'dateOfBirth':
                return 'Date of Birth';
            case 'verificationType':
                return 'Verification Type';
            default:
                return fieldName;
        }
    }

    get title(): string {
        return this.config.title || 'Identity Verification';
    }

    get subtitle(): string {
        return this.config.subtitle || 'Verify identity for enhanced security and compliance';
    }

    get showQuickCheck(): boolean {
        return this.config.showQuickCheck !== false; // Default to true unless explicitly set to false
    }

    get isCompact(): boolean {
        return this.config.compact || false;
    }
}
