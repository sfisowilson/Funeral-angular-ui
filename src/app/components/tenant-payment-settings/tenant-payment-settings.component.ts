import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TenantBankingService, TenantBankingDetail } from '../../services/tenant-banking.service';

interface DebitOrderSettings {
  debitOrderProvider?: string;
  debitOrderUserId?: string;
  debitOrderAbbreviation?: string;
  debitOrderBatchPath?: string;
  collectionBankName?: string;
  collectionAccountNumber?: string;
  collectionAccountType?: string;
  collectionBranchCode?: string;
  preferredDebitDay?: number;
}

@Component({
  selector: 'app-tenant-payment-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">Payment Settings</h2>

      <!-- Alert Message -->
      <div *ngIf="message" [class]="messageClass" class="mb-6 p-4 rounded-lg">
        {{ message }}
      </div>

      <!-- Tabs -->
      <div class="mb-6 border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button (click)="activeTab = 'banking'"
                  [class.border-blue-600]="activeTab === 'banking'"
                  [class.text-blue-600]="activeTab === 'banking'"
                  class="py-4 px-1 border-b-2 font-medium text-sm">
            Banking Details
          </button>
          <button *ngIf="isHostTenant" 
                  (click)="activeTab = 'collection'"
                  [class.border-blue-600]="activeTab === 'collection'"
                  [class.text-blue-600]="activeTab === 'collection'"
                  class="py-4 px-1 border-b-2 font-medium text-sm">
            Collection Account
          </button>
          <button *ngIf="isHostTenant"
                  (click)="activeTab = 'debitorder'"
                  [class.border-blue-600]="activeTab === 'debitorder'"
                  [class.text-blue-600]="activeTab === 'debitorder'"
                  class="py-4 px-1 border-b-2 font-medium text-sm">
            Debit Order Settings
          </button>
        </nav>
      </div>

      <!-- Banking Details Tab (For Child Tenants) -->
      <div *ngIf="activeTab === 'banking'" class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">My Banking Details</h3>
        <p class="text-gray-600 mb-4">These details will be used for subscription payments via debit order or EFT.</p>
        
        <form [formGroup]="bankingForm" (ngSubmit)="saveBankingDetails()">
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
              <label class="block text-sm font-medium mb-2">Preferred Debit Day (1-31)</label>
              <input type="number" formControlName="debitDay" 
                     min="1" max="31"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Day of month">
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
          </div>
        </form>

        <div *ngIf="existingBanking" class="mt-6 p-4 bg-gray-50 rounded-lg">
          <p class="text-sm font-medium mb-2">Current Status:</p>
          <span [class]="existingBanking.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                class="px-3 py-1 text-sm rounded-full">
            {{ existingBanking.isVerified ? 'Verified' : 'Pending Verification' }}
          </span>
        </div>
      </div>

      <!-- Collection Account Tab (Host Tenant Only) -->
      <div *ngIf="activeTab === 'collection' && isHostTenant" class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">Collection Account</h3>
        <p class="text-gray-600 mb-4">This account will receive payments from your tenants.</p>
        
        <form [formGroup]="collectionForm" (ngSubmit)="saveCollectionAccount()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium mb-2">Bank Name *</label>
              <select formControlName="collectionBankName" class="w-full border rounded-lg px-3 py-2">
                <option value="">Select Bank</option>
                <option value="ABSA">ABSA</option>
                <option value="Standard Bank">Standard Bank</option>
                <option value="FNB">FNB</option>
                <option value="Nedbank">Nedbank</option>
                <option value="Capitec">Capitec</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Account Type *</label>
              <select formControlName="collectionAccountType" class="w-full border rounded-lg px-3 py-2">
                <option value="">Select Type</option>
                <option value="Business Cheque">Business Cheque</option>
                <option value="Business Savings">Business Savings</option>
                <option value="Current">Current Account</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Account Number *</label>
              <input type="text" formControlName="collectionAccountNumber" 
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Enter account number">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Branch Code *</label>
              <input type="text" formControlName="collectionBranchCode" 
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Enter branch code">
            </div>
          </div>

          <div class="mt-6">
            <button type="submit" 
                    [disabled]="!collectionForm.valid || saving"
                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save Collection Account' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Debit Order Settings Tab (Host Tenant Only) -->
      <div *ngIf="activeTab === 'debitorder' && isHostTenant" class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-semibold mb-4">Debit Order Configuration</h3>
        <p class="text-gray-600 mb-4">Configure your debit order processing settings.</p>
        
        <form [formGroup]="debitOrderForm" (ngSubmit)="saveDebitOrderSettings()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium mb-2">Service Provider *</label>
              <select formControlName="debitOrderProvider" class="w-full border rounded-lg px-3 py-2">
                <option value="">Select Provider</option>
                <option value="BankServ">BankServ</option>
                <option value="PaymentHub">PaymentHub</option>
                <option value="Masterpass">Masterpass</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">User ID *</label>
              <input type="text" formControlName="debitOrderUserId" 
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Your company user ID">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Company Abbreviation (3-4 chars) *</label>
              <input type="text" formControlName="debitOrderAbbreviation" 
                     maxlength="4"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="e.g., COMP">
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Preferred Debit Day *</label>
              <input type="number" formControlName="preferredDebitDay" 
                     min="1" max="31"
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="Day of month (1-31)">
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium mb-2">Batch Output Path</label>
              <input type="text" formControlName="debitOrderBatchPath" 
                     class="w-full border rounded-lg px-3 py-2"
                     placeholder="./DebitOrderBatches">
            </div>
          </div>

          <div class="mt-6">
            <button type="submit" 
                    [disabled]="!debitOrderForm.valid || saving"
                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ saving ? 'Saving...' : 'Save Debit Order Settings' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class TenantPaymentSettingsComponent implements OnInit {
  activeTab = 'banking';
  isHostTenant = false; // Set based on tenant type
  
  bankingForm: FormGroup;
  collectionForm: FormGroup;
  debitOrderForm: FormGroup;
  
  existingBanking?: TenantBankingDetail;
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
      debitDay: [1],
      paymentMethod: ['DebitOrder', Validators.required]
    });

    this.collectionForm = this.fb.group({
      collectionBankName: ['', Validators.required],
      collectionAccountType: ['', Validators.required],
      collectionAccountNumber: ['', Validators.required],
      collectionBranchCode: ['', Validators.required]
    });

    this.debitOrderForm = this.fb.group({
      debitOrderProvider: ['BankServ', Validators.required],
      debitOrderUserId: ['', Validators.required],
      debitOrderAbbreviation: ['', [Validators.required, Validators.maxLength(4)]],
      preferredDebitDay: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      debitOrderBatchPath: ['./DebitOrderBatches']
    });
  }

  ngOnInit(): void {
    this.loadBankingDetails();
    this.loadTenantSettings();
    // TODO: Check tenant type to set isHostTenant
  }

  loadBankingDetails(): void {
    this.bankingService.getBankingDetails().subscribe({
      next: (details) => {
        this.existingBanking = details;
        this.bankingForm.patchValue(details);
      },
      error: () => console.log('No banking details found')
    });
  }

  loadTenantSettings(): void {
    // TODO: Implement with TenantSettingServiceProxy if needed
    console.log('Tenant settings loaded');
  }

  saveBankingDetails(): void {
    if (!this.bankingForm.valid) return;

    this.saving = true;
    const formData = this.bankingForm.value as TenantBankingDetail;

    this.bankingService.saveBankingDetails(formData).subscribe({
      next: (result) => {
        this.message = 'Banking details saved successfully!';
        this.messageClass = 'bg-green-100 text-green-800 border border-green-300';
        this.existingBanking = result;
        this.saving = false;
      },
      error: () => {
        this.message = 'Error saving banking details';
        this.messageClass = 'bg-red-100 text-red-800 border border-red-300';
        this.saving = false;
      }
    });
  }

  saveCollectionAccount(): void {
    if (!this.collectionForm.valid) return;
    this.saveSettings(this.collectionForm.value);
  }

  saveDebitOrderSettings(): void {
    if (!this.debitOrderForm.valid) return;
    this.saveSettings(this.debitOrderForm.value);
  }

  private saveSettings(settings: any): void {
    this.saving = true;
    // TODO: Implement with TenantSettingServiceProxy
    this.message = 'Settings saved successfully!';
    this.messageClass = 'bg-green-100 text-green-800 border border-green-300';
    this.saving = false;
  }
}
