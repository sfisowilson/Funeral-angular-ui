import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import {
  MemberBankingDetailServiceProxy,
  CreateMemberBankingDetailDto,
  MemberBankingDetailDto
} from '../../../core/services/service-proxies';

interface BankOption {
  label: string;
  value: string;
}

interface AccountTypeOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-banking-details-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    DropdownModule,
    InputTextModule,
    InputNumberModule,
    ToastModule
  ],
  providers: [MessageService, MemberBankingDetailServiceProxy],
  templateUrl: './banking-details-step.component.html',
  styleUrl: './banking-details-step.component.scss'
})
export class BankingDetailsStepComponent implements OnInit {
  viewMode = input<boolean>(false);
  memberId = input<string | undefined>(undefined);
  stepComplete = output<void>();
  
  bankingForm!: FormGroup;
  loading = signal<boolean>(false);
  existingBankingDetails = signal<MemberBankingDetailDto | null>(null);

  banks: BankOption[] = [
    { label: 'ABSA', value: 'ABSA' },
    { label: 'Standard Bank', value: 'Standard Bank' },
    { label: 'FNB', value: 'FNB' },
    { label: 'Nedbank', value: 'Nedbank' },
    { label: 'Capitec', value: 'Capitec' },
    { label: 'African Bank', value: 'African Bank' },
    { label: 'Discovery Bank', value: 'Discovery Bank' },
    { label: 'TymeBank', value: 'TymeBank' },
    { label: 'Bank Zero', value: 'Bank Zero' },
    { label: 'Other', value: 'Other' }
  ];

  accountTypes: AccountTypeOption[] = [
    { label: 'Cheque/Current', value: 'Cheque' },
    { label: 'Savings', value: 'Savings' },
    { label: 'Transmission', value: 'Transmission' }
  ];

  debitDays: { label: string; value: number }[] = [];

  constructor(
    private fb: FormBuilder,
    private bankingService: MemberBankingDetailServiceProxy,
    private messageService: MessageService
  ) {
    this.initializeForm();
    this.generateDebitDays();
  }

  ngOnInit(): void {
    this.loadExistingBankingDetails();
  }

  initializeForm(): void {
    this.bankingForm = this.fb.group({
      bankName: ['', Validators.required],
      accountNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{8,15}$/)]],
      accountType: ['', Validators.required],
      branchCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      branchName: ['', Validators.required],
      accountHolderName: ['', Validators.required],
      debitDay: [null, [Validators.required, Validators.min(1), Validators.max(31)]]
    });
  }

  generateDebitDays(): void {
    this.debitDays = [];
    for (let i = 1; i <= 31; i++) {
      const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
      this.debitDays.push({ 
        label: `${i}${suffix} of the month`, 
        value: i 
      });
    }
  }

  loadExistingBankingDetails(): void {
    this.loading.set(true);
    
    // Use appropriate method based on whether viewing own or another member's banking details
    const bankingObservable = this.memberId()
        ? this.bankingService.memberBankingDetail_GetBankingDetailsByMemberId(this.memberId()!)
        : this.bankingService.memberBankingDetail_GetMyBankingDetails();
    
    bankingObservable.subscribe({
      next: (details) => {
        this.existingBankingDetails.set(details);
        this.bankingForm.patchValue({
          bankName: details.bankName,
          accountNumber: details.accountNumber,
          accountType: details.accountType,
          branchCode: details.branchCode,
          branchName: details.branchName,
          accountHolderName: details.accountHolderName,
          debitDay: details.debitDay
        });
        this.loading.set(false);
      },
      error: (error) => {
        // If no banking details exist yet, that's fine
        if (error.status !== 404) {
          this.handleError(error);
        }
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.bankingForm.invalid) {
      this.markFormGroupTouched(this.bankingForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields correctly'
      });
      return;
    }

    this.loading.set(true);

    const dto = new CreateMemberBankingDetailDto({
      bankName: this.bankingForm.value.bankName,
      accountNumber: this.bankingForm.value.bankName,
      accountType: this.bankingForm.value.accountType,
      branchCode: this.bankingForm.value.branchCode,
      branchName: this.bankingForm.value.branchName,
      accountHolderName: this.bankingForm.value.accountHolderName,
      debitDay: this.bankingForm.value.debitDay,
      paymentMethod: 1 // Default to Debit Order - TODO: Add payment method dropdown to form
    });

    const existing = this.existingBankingDetails();

    if (existing) {
      // Update existing
      this.bankingService.memberBankingDetail_UpdateBankingDetails(existing.id!, dto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Banking details updated successfully'
          });
          this.loading.set(false);
          this.stepComplete.emit();
        },
        error: (error) => this.handleError(error)
      });
    } else {
      // Create new
      this.bankingService.memberBankingDetail_CreateBankingDetails(dto).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Banking details saved successfully'
          });
          this.loading.set(false);
          this.stepComplete.emit();
        },
        error: (error) => this.handleError(error)
      });
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  handleError(error: any): void {
    console.error('Banking details error:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: error.error?.message || 'An error occurred while saving banking details'
    });
    this.loading.set(false);
  }

  skipStep(): void {
    // Banking details are optional, so user can skip and move to next step
    this.stepComplete.emit();
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.bankingForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.bankingForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'This field is required';
    }
    
    if (field?.hasError('pattern')) {
      if (fieldName === 'accountNumber') {
        return 'Account number must be 8-15 digits';
      }
      if (fieldName === 'branchCode') {
        return 'Branch code must be 6 digits';
      }
    }
    
    if (field?.hasError('min') || field?.hasError('max')) {
      if (fieldName === 'debitDay') {
        return 'Debit day must be between 1 and 31';
      }
    }
    
    return '';
  }
  
  /**
   * Clear all form data after successful submission
   */
  clearForm() {
    console.log('[BankingDetailsStep] Clearing form data...');
    
    // Reset form
    if (this.bankingForm) {
      this.bankingForm.reset();
    }
    
    // No bankingDetailsId property exists - skipping
    
    console.log('[BankingDetailsStep] Form cleared successfully');
  }
}
