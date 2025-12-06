import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantBankingService, TenantBankingDetail } from '../../services/tenant-banking.service';

@Component({
  selector: 'app-tenant-banking-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">Banking Details Setup</h2>
      
      <div *ngIf="existingDetails" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 class="font-semibold mb-2">Current Banking Details</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><span class="font-medium">Bank:</span> {{ existingDetails.bankName }}</div>
          <div><span class="font-medium">Account Type:</span> {{ existingDetails.accountType }}</div>
          <div><span class="font-medium">Account Number:</span> ****{{ existingDetails.accountNumber.slice(-4) }}</div>
          <div><span class="font-medium">Branch Code:</span> {{ existingDetails.branchCode }}</div>
          <div><span class="font-medium">Debit Day:</span> {{ existingDetails.debitDay }}</div>
          <div>
            <span class="font-medium">Status:</span> 
            <span [class]="existingDetails.isVerified ? 'text-green-600' : 'text-yellow-600'">
              {{ existingDetails.isVerified ? 'Verified' : 'Pending Verification' }}
            </span>
          </div>
        </div>
        <button *ngIf="!existingDetails.isVerified" 
                (click)="verifyBankingDetails()"
                class="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Verify Banking Details
        </button>
      </div>

      <form [formGroup]="bankingForm" (ngSubmit)="saveBankingDetails()" class="bg-white shadow-md rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium mb-2">Bank Name *</label>
            <select formControlName="bankName" class="w-full border rounded-lg px-3 py-2">
              <option value="">Select Bank</option>
              <option value="ABSA">ABSA</option>
              <option value="Standard Bank">Standard Bank</option>
              <option value="FNB">FNB</option>
              <option value="Nedbank">Nedbank</option>
              <option value="Capitec">Capitec</option>
              <option value="African Bank">African Bank</option>
              <option value="Discovery Bank">Discovery Bank</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Account Type *</label>
            <select formControlName="accountType" class="w-full border rounded-lg px-3 py-2">
              <option value="">Select Type</option>
              <option value="Cheque">Cheque/Current</option>
              <option value="Savings">Savings</option>
              <option value="Transmission">Transmission</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Account Number *</label>
            <input type="text" formControlName="accountNumber" 
                   class="w-full border rounded-lg px-3 py-2"
                   placeholder="Enter account number">
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Branch Code *</label>
            <input type="text" formControlName="branchCode" 
                   class="w-full border rounded-lg px-3 py-2"
                   placeholder="Enter branch code">
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Account Holder Name *</label>
            <input type="text" formControlName="accountHolderName" 
                   class="w-full border rounded-lg px-3 py-2"
                   placeholder="Enter account holder name">
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Debit Day (1-31)</label>
            <input type="number" formControlName="debitDay" 
                   min="1" max="31"
                   class="w-full border rounded-lg px-3 py-2"
                   placeholder="Preferred debit day">
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Payment Method *</label>
            <select formControlName="paymentMethod" class="w-full border rounded-lg px-3 py-2">
              <option value="">Select Method</option>
              <option value="DebitOrder">Debit Order</option>
              <option value="EFT">EFT</option>
              <option value="StopOrder">Stop Order</option>
            </select>
          </div>
        </div>

        <div class="mt-6 flex gap-4">
          <button type="submit" 
                  [disabled]="!bankingForm.valid || saving"
                  class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ saving ? 'Saving...' : 'Save Banking Details' }}
          </button>
          <button type="button" 
                  (click)="resetForm()"
                  class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400">
            Reset
          </button>
        </div>

        <div *ngIf="message" [class]="messageClass" class="mt-4 p-3 rounded-lg">
          {{ message }}
        </div>
      </form>
    </div>
  `
})
export class TenantBankingSetupComponent implements OnInit {
  bankingForm: FormGroup;
  existingDetails?: TenantBankingDetail;
  saving = false;
  message = '';
  messageClass = '';

  constructor(
    private fb: FormBuilder,
    private bankingService: TenantBankingService
  ) {
    this.bankingForm = this.fb.group({
      bankName: ['', Validators.required],
      accountType: ['', Validators.required],
      accountNumber: ['', Validators.required],
      branchCode: ['', Validators.required],
      accountHolderName: ['', Validators.required],
      debitDay: [1, [Validators.min(1), Validators.max(31)]],
      paymentMethod: ['DebitOrder', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadBankingDetails();
  }

  loadBankingDetails(): void {
    this.bankingService.getBankingDetails().subscribe({
      next: (details) => {
        this.existingDetails = details;
        this.bankingForm.patchValue(details);
      },
      error: (err) => {
        console.log('No existing banking details found');
      }
    });
  }

  saveBankingDetails(): void {
    if (!this.bankingForm.valid) return;

    this.saving = true;
    const formData = {
      ...this.bankingForm.value,
      id: this.existingDetails?.id || ''
    };

    this.bankingService.saveBankingDetails(formData).subscribe({
      next: (result) => {
        this.message = 'Banking details saved successfully!';
        this.messageClass = 'bg-green-100 text-green-800 border border-green-300';
        this.existingDetails = result;
        this.saving = false;
      },
      error: (err) => {
        this.message = 'Error saving banking details. Please try again.';
        this.messageClass = 'bg-red-100 text-red-800 border border-red-300';
        this.saving = false;
      }
    });
  }

  verifyBankingDetails(): void {
    if (!this.existingDetails?.id) return;

    this.bankingService.verifyBankingDetails(this.existingDetails.id).subscribe({
      next: (result) => {
        this.message = result.message;
        this.messageClass = 'bg-green-100 text-green-800 border border-green-300';
        this.loadBankingDetails();
      },
      error: (err) => {
        this.message = 'Error verifying banking details.';
        this.messageClass = 'bg-red-100 text-red-800 border border-red-300';
      }
    });
  }

  resetForm(): void {
    this.bankingForm.reset({ debitDay: 1, paymentMethod: 'DebitOrder' });
    this.message = '';
  }
}
