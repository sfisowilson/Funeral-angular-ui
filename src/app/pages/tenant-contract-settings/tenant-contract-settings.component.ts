import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  TenantSettingServiceProxy, 
  TenantSettingDto 
} from '../../core/services/service-proxies';

interface FileMetadata {
  id: string;
  fileName: string;
  contentType: string;
  uploadedAt: Date;
}

@Component({
  selector: 'app-tenant-contract-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">Contract Template Settings</h2>

      <!-- Current Template Status -->
      <div class="card mb-6">
        <h3 class="text-lg font-semibold mb-4">Current Template</h3>
        <div *ngIf="currentTemplate" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold text-blue-900">{{ currentTemplate.fileName }}</p>
              <p class="text-sm text-blue-700">Uploaded: {{ currentTemplate.uploadedAt | date:'medium' }}</p>
            </div>
            <button (click)="removeTemplate()" class="btn btn-danger btn-sm">
              <i class="bi bi-trash me-2"></i>Remove
            </button>
          </div>
        </div>
        <div *ngIf="!currentTemplate" class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <i class="bi bi-file-earmark-pdf text-gray-400" style="font-size: 3rem;"></i>
          <p class="text-gray-600 mt-2">No template uploaded. Using dynamic PDF generation.</p>
        </div>
      </div>

      <!-- Upload New Template -->
      <div class="card mb-6">
        <h3 class="text-lg font-semibold mb-4">Upload New Template</h3>
        <p class="text-gray-600 mb-4">
          Upload a PDF template with form fields that match the field names below.
        </p>
        
        <div class="mb-4">
          <input type="file" 
                 (change)="onFileSelected($event)" 
                 accept=".pdf"
                 #fileInput
                 class="form-control">
        </div>

        <button (click)="uploadTemplate()" 
                [disabled]="!selectedFile || uploading"
                class="btn btn-primary">
          <span *ngIf="uploading" class="spinner-border spinner-border-sm me-2"></span>
          {{ uploading ? 'Uploading...' : 'Upload Template' }}
        </button>
      </div>

      <!-- Field Naming Guide -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">
          <i class="bi bi-info-circle text-primary me-2"></i>PDF Form Field Names
        </h3>
        <p class="text-gray-600 mb-4">
          Your PDF template must have form fields with the following exact names. The system will automatically fill these fields with member data.
        </p>

        <!-- Search/Filter -->
        <div class="mb-4">
          <input type="text" 
                 [(ngModel)]="fieldSearch"
                 placeholder="Search field names..."
                 class="form-control">
        </div>

        <!-- Field Categories -->
        <div class="accordion" id="fieldAccordion">
          
          <!-- Personal Information -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingPersonal">
              <button class="accordion-button collapsed" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#collapsePersonal">
                Personal Information (9 fields)
              </button>
            </h2>
            <div id="collapsePersonal" class="accordion-collapse collapse" 
                 data-bs-parent="#fieldAccordion">
              <div class="accordion-body">
                <div class="field-grid">
                  <div *ngFor="let field of personalFields" class="field-item">
                    <code class="field-name">{{ field.name }}</code>
                    <span class="field-desc">{{ field.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingContact">
              <button class="accordion-button collapsed" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#collapseContact">
                Contact Information (5 fields)
              </button>
            </h2>
            <div id="collapseContact" class="accordion-collapse collapse" 
                 data-bs-parent="#fieldAccordion">
              <div class="accordion-body">
                <div class="field-grid">
                  <div *ngFor="let field of contactFields" class="field-item">
                    <code class="field-name">{{ field.name }}</code>
                    <span class="field-desc">{{ field.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Address Information -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingAddress">
              <button class="accordion-button collapsed" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#collapseAddress">
                Address Information (5 fields)
              </button>
            </h2>
            <div id="collapseAddress" class="accordion-collapse collapse" 
                 data-bs-parent="#fieldAccordion">
              <div class="accordion-body">
                <div class="field-grid">
                  <div *ngFor="let field of addressFields" class="field-item">
                    <code class="field-name">{{ field.name }}</code>
                    <span class="field-desc">{{ field.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Employment & Nationality -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingEmployment">
              <button class="accordion-button collapsed" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#collapseEmployment">
                Employment & Nationality (10 fields)
              </button>
            </h2>
            <div id="collapseEmployment" class="accordion-collapse collapse" 
                 data-bs-parent="#fieldAccordion">
              <div class="accordion-body">
                <div class="field-grid">
                  <div *ngFor="let field of employmentFields" class="field-item">
                    <code class="field-name">{{ field.name }}</code>
                    <span class="field-desc">{{ field.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Banking Details -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingBanking">
              <button class="accordion-button collapsed" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#collapseBanking">
                Banking Details (5 fields)
              </button>
            </h2>
            <div id="collapseBanking" class="accordion-collapse collapse" 
                 data-bs-parent="#fieldAccordion">
              <div class="accordion-body">
                <div class="field-grid">
                  <div *ngFor="let field of bankingFields" class="field-item">
                    <code class="field-name">{{ field.name }}</code>
                    <span class="field-desc">{{ field.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dependents (1-10) -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingDependents">
              <button class="accordion-button collapsed" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#collapseDependents">
                Dependents (20 fields - 10 dependents)
              </button>
            </h2>
            <div id="collapseDependents" class="accordion-collapse collapse" 
                 data-bs-parent="#fieldAccordion">
              <div class="accordion-body">
                <p class="text-sm text-gray-600 mb-3">
                  Pattern: <code>Dependent{{ '{' }}N{{ '}' }}Name</code> and <code>Dependent{{ '{' }}N{{ '}' }}IdNumber</code> where N = 1 to 10
                </p>
                <div class="field-grid">
                  <div class="field-item"><code class="field-name">DependentCount</code><span class="field-desc">Total number of dependents</span></div>
                  <div class="field-item"><code class="field-name">Dependent1Name</code><span class="field-desc">First dependent's full name</span></div>
                  <div class="field-item"><code class="field-name">Dependent1IdNumber</code><span class="field-desc">First dependent's ID number</span></div>
                  <div class="text-center text-gray-500 py-2">... up to Dependent10Name and Dependent10IdNumber</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Beneficiaries (1-10) -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingBeneficiaries">
              <button class="accordion-button collapsed" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#collapseBeneficiaries">
                Beneficiaries (30 fields - 10 beneficiaries)
              </button>
            </h2>
            <div id="collapseBeneficiaries" class="accordion-collapse collapse" 
                 data-bs-parent="#fieldAccordion">
              <div class="accordion-body">
                <p class="text-sm text-gray-600 mb-3">
                  Pattern: <code>Beneficiary{{ '{' }}N{{ '}' }}Name</code>, <code>Beneficiary{{ '{' }}N{{ '}' }}Relationship</code>, <code>Beneficiary{{ '{' }}N{{ '}' }}Percentage</code> where N = 1 to 10
                </p>
                <div class="field-grid">
                  <div class="field-item"><code class="field-name">BeneficiaryCount</code><span class="field-desc">Total number of beneficiaries</span></div>
                  <div class="field-item"><code class="field-name">Beneficiary1Name</code><span class="field-desc">First beneficiary's name</span></div>
                  <div class="field-item"><code class="field-name">Beneficiary1Relationship</code><span class="field-desc">Relationship to member</span></div>
                  <div class="field-item"><code class="field-name">Beneficiary1Percentage</code><span class="field-desc">Percentage share</span></div>
                  <div class="text-center text-gray-500 py-2">... up to Beneficiary10Name, Beneficiary10Relationship, Beneficiary10Percentage</div>
                </div>
              </div>
            </div>
          </div>

          <!-- System Fields -->
          <div class="accordion-item">
            <h2 class="accordion-header" id="headingSystem">
              <button class="accordion-button collapsed" type="button" 
                      data-bs-toggle="collapse" data-bs-target="#collapseSystem">
                System Fields (2 fields)
              </button>
            </h2>
            <div id="collapseSystem" class="accordion-collapse collapse" 
                 data-bs-parent="#fieldAccordion">
              <div class="accordion-body">
                <div class="field-grid">
                  <div *ngFor="let field of systemFields" class="field-item">
                    <code class="field-name">{{ field.name }}</code>
                    <span class="field-desc">{{ field.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Error/Success Messages -->
      <div *ngIf="errorMessage" class="alert alert-danger mt-4">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success mt-4">
        {{ successMessage }}
      </div>
    </div>
  `,
  styles: [`
    .card {
      background: white;
      border-radius: 0.5rem;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .field-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1rem;
    }

    .field-item {
      display: flex;
      flex-direction: column;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 0.375rem;
      border: 1px solid #e5e7eb;
    }

    .field-name {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #1e40af;
      background: #dbeafe;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      display: inline-block;
      margin-bottom: 0.25rem;
    }

    .field-desc {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .accordion-button:not(.collapsed) {
      background-color: #eff6ff;
      color: #1e40af;
    }
  `]
})
export class TenantContractSettingsComponent implements OnInit {
  currentTemplate?: FileMetadata;
  selectedFile?: File;
  uploading = false;
  fieldSearch = '';
  errorMessage = '';
  successMessage = '';

  personalFields = [
    { name: 'Title', description: 'Title (Mr, Mrs, Ms, Dr, etc.)' },
    { name: 'FirstNames', description: 'First names' },
    { name: 'Surname', description: 'Surname/Last name' },
    { name: 'Name', description: 'Full name (FirstNames + Surname)' },
    { name: 'DateOfBirth', description: 'Date of birth (DD/MM/YYYY)' },
    { name: 'IdentificationNumber', description: 'ID/Passport number' },
    { name: 'Age', description: 'Current age in years' },
    { name: 'Gender', description: 'Gender (Male/Female/Other)' },
    { name: 'MaritalStatus', description: 'Marital status' }
  ];

  contactFields = [
    { name: 'Email', description: 'Email address' },
    { name: 'Phone1', description: 'Primary phone number' },
    { name: 'Phone2', description: 'Secondary phone number' },
    { name: 'WorkPhoneNumber', description: 'Work phone number' },
    { name: 'EmergencyContactNumber', description: 'Emergency contact number' }
  ];

  addressFields = [
    { name: 'Address', description: 'Full address (combined)' },
    { name: 'StreetAddress', description: 'Street address/line 1' },
    { name: 'City', description: 'City' },
    { name: 'Province', description: 'Province/State' },
    { name: 'PostalCode', description: 'Postal/ZIP code' }
  ];

  employmentFields = [
    { name: 'Occupation', description: 'Current occupation' },
    { name: 'SourceOfIncome', description: 'Primary source of income' },
    { name: 'SourceOfIncomeOther', description: 'Other income source details' },
    { name: 'PassportNumber', description: 'Passport number (if applicable)' },
    { name: 'CountryOfBirth', description: 'Country of birth' },
    { name: 'CountryOfResidence', description: 'Country of residence' },
    { name: 'Citizenship', description: 'Citizenship' },
    { name: 'Nationality', description: 'Nationality' },
    { name: 'IsForeigner', description: 'Is foreigner (Yes/No)' },
    { name: 'WorkPermitNumber', description: 'Work permit number (if applicable)' }
  ];

  bankingFields = [
    { name: 'BankName', description: 'Bank name' },
    { name: 'AccountNumber', description: 'Bank account number' },
    { name: 'AccountType', description: 'Account type (Savings/Checking)' },
    { name: 'AccountHolderName', description: 'Account holder name' },
    { name: 'BranchCode', description: 'Branch code' }
  ];

  systemFields = [
    { name: 'TodayDate', description: 'Current date (DD/MM/YYYY)' },
    { name: 'CurrentYear', description: 'Current year (YYYY)' }
  ];

  constructor(private tenantService: TenantSettingServiceProxy) {}

  async ngOnInit(): Promise<void> {
    await this.loadCurrentTemplate();
  }

  async loadCurrentTemplate(): Promise<void> {
    try {
      const settings = await this.tenantService.tenantSetting_GetCurrentTenantSettings().toPromise();

      if (settings?.contractTemplateFileId) {
        // Extract file metadata if available from settings
        // Note: The DTO doesn't include contractTemplateFile navigation property
        // so we'll just store the ID for now
        this.currentTemplate = {
          id: settings.contractTemplateFileId,
          fileName: 'Contract Template',
          contentType: 'application/pdf',
          uploadedAt: new Date()
        };
      }
    } catch (error) {
      console.error('Failed to load template', error);
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedFile = file;
      this.errorMessage = '';
    } else {
      this.errorMessage = 'Please select a valid PDF file';
      this.selectedFile = undefined;
    }
  }

  async uploadTemplate(): Promise<void> {
    if (!this.selectedFile) return;

    this.uploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

      await this.tenantService.uploadContractTemplate({ data: formData, fileName: this.selectedFile.name }).toPromise();

      this.successMessage = 'Template uploaded successfully!';
      await this.loadCurrentTemplate();
      this.selectedFile = undefined;
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to upload template';
    } finally {
      this.uploading = false;
    }
  }

  async removeTemplate(): Promise<void> {
    if (!confirm('Are you sure you want to remove the current template? This will revert to dynamic PDF generation.')) {
      return;
    }

    try {
      await this.tenantService.removeContractTemplate().toPromise();

      this.successMessage = 'Template removed successfully!';
      this.currentTemplate = undefined;
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to remove template';
    }
  }
}
