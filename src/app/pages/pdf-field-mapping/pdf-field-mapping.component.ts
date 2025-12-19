import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { 
  PdfFieldMappingServiceProxy, 
  PdfFieldMappingDto,
  CreatePdfFieldMappingRequest,
  UpdatePdfFieldMappingRequest,
  PdfTemplateAnalysisResult,
  PdfTemplateFieldInfo,
  TenantSettingServiceProxy,
  FileUploadServiceProxy
} from '../../core/services/service-proxies';

interface ConditionalRule {
  condition: string;
  pdfField: string;
  setValue: string;
}

@Component({
  selector: 'app-pdf-field-mapping',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [PdfFieldMappingServiceProxy, TenantSettingServiceProxy, FileUploadServiceProxy],
  templateUrl: './pdf-field-mapping.component.html',
  styleUrl: './pdf-field-mapping.component.scss'
})
export class PdfFieldMappingComponent implements OnInit {
  mappings: PdfFieldMappingDto[] = [];
  templateAnalysis: PdfTemplateAnalysisResult | null = null;
  currentTemplateFileId: string | null = null;
  baseUrl = environment.apiUrl;
  
  showMappingDialog = false;
  showAnalysisDialog = false;
  isEditMode = false;
  
  selectedMapping: PdfFieldMappingDto | null = null;
  
  // Form fields
  mappingForm = {
    sourceField: '',
    pdfFieldName: '',
    mappingType: 'Simple',
    isEnabled: true,
    displayOrder: 0,
    description: '',
    conditionalRulesJson: '',
    transformRule: '',
    defaultValue: '',
    checkedValue: 'Yes',
    uncheckedValue: 'Off',
    category: ''
  };

  conditionalRules: ConditionalRule[] = [];

  mappingTypeOptions = [
    { label: 'Simple (Direct mapping)', value: 'Simple' },
    { label: 'Conditional (Rules-based)', value: 'Conditional' },
    { label: 'Transform (Format/Convert)', value: 'Transform' },
    { label: 'Checkbox (Boolean)', value: 'Checkbox' },
    { label: 'Radio Button', value: 'RadioButton' }
  ];

  transformOptions = [
    { label: 'To Uppercase', value: 'ToUpper' },
    { label: 'To Lowercase', value: 'ToLower' },
    { label: 'Format Date (dd/MM/yyyy)', value: 'FormatDate:dd/MM/yyyy' },
    { label: 'Format Date (yyyy-MM-dd)', value: 'FormatDate:yyyy-MM-dd' },
    { label: 'Trim Whitespace', value: 'Trim' }
  ];

  categoryOptions = [
    { label: 'Personal Information', value: 'Personal' },
    { label: 'Contact Information', value: 'Contact' },
    { label: 'Address Information', value: 'Address' },
    { label: 'Employment', value: 'Employment' },
    { label: 'Banking Details', value: 'Banking' },
    { label: 'Policy Information', value: 'Policy' },
    { label: 'Other', value: 'Other' }
  ];

  suggestedSourceFields: string[] = [
    'Title', 'FirstNames', 'Surname', 'Name', 'DateOfBirth', 'IdentificationNumber',
    'Age', 'Gender', 'MaritalStatus', 'Email', 'Phone1', 'Phone2', 
    'Address', 'City', 'Province', 'PostalCode', 'Occupation',
    'BankName', 'AccountNumber', 'AccountType', 'TodayDate', 'CurrentYear'
  ];

  alertMessage: string = '';
  alertType: 'success' | 'danger' | 'warning' | 'info' = 'success';
  showAlert: boolean = false;
  activeTab: string = 'basic-tab';

  constructor(
    private pdfFieldMappingService: PdfFieldMappingServiceProxy,
    private tenantSettingService: TenantSettingServiceProxy,
    private fileUploadService: FileUploadServiceProxy,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadMappings();
    this.loadCurrentTemplate();
  }

  showToast(severity: 'success' | 'danger' | 'warning' | 'info', summary: string, detail: string): void {
    this.alertType = severity;
    this.alertMessage = `${summary}: ${detail}`;
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 5000);
  }

  loadMappings(): void {
    this.pdfFieldMappingService.pdfFieldMapping_GetAll().subscribe({
      next: (mappings) => {
        this.mappings = mappings;
      },
      error: (error) => {
        this.showToast('danger', 'Error', 'Failed to load mappings');
        console.error('Error loading mappings:', error);
      }
    });
  }

  loadCurrentTemplate(): void {
    this.tenantSettingService.tenantSetting_GetCurrentTenantSettings().subscribe({
      next: (settings) => {
        console.log('Tenant settings loaded:', settings);
        if (settings?.contractTemplateFileId) {
          this.currentTemplateFileId = settings.contractTemplateFileId;
          console.log('Template file ID set to:', this.currentTemplateFileId);
        } else {
          this.currentTemplateFileId = null;
          console.log('No contract template file ID found');
        }
      },
      error: (error) => {
        console.error('Error loading tenant settings:', error);
        this.currentTemplateFileId = null;
      }
    });
  }

  onTemplateUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.showToast('danger', 'Invalid File', 'Only PDF files are allowed for contract templates');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${this.baseUrl}/api/TenantSetting/upload-contract-template`, formData).subscribe({
      next: (result: any) => {
        this.showToast('success', 'Success', 'Contract template uploaded successfully');
        this.currentTemplateFileId = result.fileId;
        console.log('Upload successful, template ID:', result.fileId);
        // Reload to confirm it's saved
        setTimeout(() => this.loadCurrentTemplate(), 500);
      },
      error: (error: any) => {
        this.showToast('danger', 'Error', 'Failed to upload contract template: ' + (error?.error?.message || error?.message || 'Unknown error'));
        console.error('Contract template upload error:', error);
      }
    });

    event.target.value = '';
  }

  removeTemplate(): void {
    if (!confirm('Are you sure you want to remove the contract template?')) {
      return;
    }

    this.http.delete(`${this.baseUrl}/api/TenantSetting/remove-contract-template`).subscribe({
      next: () => {
        this.showToast('success', 'Success', 'Contract template removed successfully');
        this.currentTemplateFileId = null;
        this.templateAnalysis = null;
      },
      error: (error: any) => {
        this.showToast('danger', 'Error', 'Failed to remove contract template: ' + (error?.error?.message || error?.message || 'Unknown error'));
        console.error('Contract template removal error:', error);
      }
    });
  }

  analyzeTemplate(templateFileId?: string): void {
    const fileId = templateFileId || this.currentTemplateFileId;
    if (!fileId) {
      this.showToast('warning', 'No Template', 'Please upload a PDF template first');
      return;
    }
    
    this.pdfFieldMappingService.pdfFieldMapping_AnalyzeTemplate(fileId).subscribe({
      next: (analysis) => {
        this.templateAnalysis = analysis;
        this.showAnalysisDialog = true;
      },
      error: (error) => {
        this.showToast('danger', 'Error', 'Failed to analyze template');
        console.error('Error analyzing template:', error);
      }
    });
  }

  openCreateDialog(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showMappingDialog = true;
  }

  openEditDialog(mapping: PdfFieldMappingDto): void {
    this.isEditMode = true;
    this.selectedMapping = mapping;
    this.mappingForm = {
      sourceField: mapping.sourceField || '',
      pdfFieldName: mapping.pdfFieldName || '',
      mappingType: mapping.mappingType || 'Simple',
      isEnabled: mapping.isEnabled,
      displayOrder: mapping.displayOrder,
      description: mapping.description || '',
      conditionalRulesJson: mapping.conditionalRulesJson || '',
      transformRule: mapping.transformRule || '',
      defaultValue: mapping.defaultValue || '',
      checkedValue: mapping.checkedValue || 'Yes',
      uncheckedValue: mapping.uncheckedValue || 'Off',
      category: mapping.category || ''
    };

    if (mapping.conditionalRulesJson) {
      try {
        this.conditionalRules = JSON.parse(mapping.conditionalRulesJson);
      } catch {
        this.conditionalRules = [];
      }
    }

    this.showMappingDialog = true;
  }

  resetForm(): void {
    this.mappingForm = {
      sourceField: '',
      pdfFieldName: '',
      mappingType: 'Simple',
      isEnabled: true,
      displayOrder: this.mappings.length,
      description: '',
      conditionalRulesJson: '',
      transformRule: '',
      defaultValue: '',
      checkedValue: 'Yes',
      uncheckedValue: 'Off',
      category: ''
    };
    this.conditionalRules = [];
  }

  saveMapping(): void {
    if (this.mappingForm.mappingType === 'Conditional') {
      this.mappingForm.conditionalRulesJson = JSON.stringify(this.conditionalRules);
    }

    if (this.isEditMode && this.selectedMapping) {
      this.updateMapping();
    } else {
      this.createMapping();
    }
  }

  createMapping(): void {
    const request = new CreatePdfFieldMappingRequest({
      sourceField: this.mappingForm.sourceField,
      pdfFieldName: this.mappingForm.pdfFieldName,
      mappingType: this.mappingForm.mappingType,
      isEnabled: this.mappingForm.isEnabled,
      displayOrder: this.mappingForm.displayOrder,
      description: this.mappingForm.description,
      conditionalRulesJson: this.mappingForm.conditionalRulesJson,
      transformRule: this.mappingForm.transformRule,
      defaultValue: this.mappingForm.defaultValue,
      checkedValue: this.mappingForm.checkedValue,
      uncheckedValue: this.mappingForm.uncheckedValue,
      category: this.mappingForm.category,
      isArrayField: false,
      arrayName: undefined,
      arrayFieldPattern: undefined,
      arrayMaxItems: undefined,
      sourceArrayPath: undefined,
      fieldNamePrefix: undefined,
      usePrefixInPdfFieldName: false
    });

    this.pdfFieldMappingService.pdfFieldMapping_Create(request).subscribe({
      next: (mapping) => {
        this.mappings.push(mapping);
        this.showToast('success', 'Success', 'Mapping created successfully');
        this.showMappingDialog = false;
      },
      error: (error) => {
        this.showToast('danger', 'Error', 'Failed to create mapping');
        console.error('Error creating mapping:', error);
      }
    });
  }

  updateMapping(): void {
    if (!this.selectedMapping) return;

    const request = new UpdatePdfFieldMappingRequest({
      sourceField: this.mappingForm.sourceField,
      pdfFieldName: this.mappingForm.pdfFieldName,
      mappingType: this.mappingForm.mappingType,
      isEnabled: this.mappingForm.isEnabled,
      displayOrder: this.mappingForm.displayOrder,
      description: this.mappingForm.description,
      conditionalRulesJson: this.mappingForm.conditionalRulesJson,
      transformRule: this.mappingForm.transformRule,
      defaultValue: this.mappingForm.defaultValue,
      checkedValue: this.mappingForm.checkedValue,
      uncheckedValue: this.mappingForm.uncheckedValue,
      category: this.mappingForm.category,
      isArrayField: false,
      arrayName: undefined,
      arrayFieldPattern: undefined,
      arrayMaxItems: undefined,
      sourceArrayPath: undefined,
      fieldNamePrefix: undefined,
      usePrefixInPdfFieldName: false
    });

    this.pdfFieldMappingService.pdfFieldMapping_Update(this.selectedMapping.id, request).subscribe({
      next: (mapping) => {
        const index = this.mappings.findIndex(m => m.id === this.selectedMapping!.id);
        if (index !== -1) {
          this.mappings[index] = mapping;
        }
        this.showToast('success', 'Success', 'Mapping updated successfully');
        this.showMappingDialog = false;
      },
      error: (error) => {
        this.showToast('danger', 'Error', 'Failed to update mapping');
        console.error('Error updating mapping:', error);
      }
    });
  }

  deleteMapping(mapping: PdfFieldMappingDto): void {
    if (!confirm(`Delete mapping "${mapping.sourceField} → ${mapping.pdfFieldName}"?`)) {
      return;
    }

    this.pdfFieldMappingService.pdfFieldMapping_Delete(mapping.id).subscribe({
      next: () => {
        this.mappings = this.mappings.filter(m => m.id !== mapping.id);
        this.showToast('success', 'Success', 'Mapping deleted successfully');
      },
      error: (error) => {
        this.showToast('danger', 'Error', 'Failed to delete mapping');
        console.error('Error deleting mapping:', error);
      }
    });
  }

  toggleMapping(mapping: PdfFieldMappingDto): void {
    const newState = !mapping.isEnabled;
    
    const request = new UpdatePdfFieldMappingRequest({
      sourceField: mapping.sourceField,
      pdfFieldName: mapping.pdfFieldName,
      mappingType: mapping.mappingType,
      isEnabled: newState,
      displayOrder: mapping.displayOrder,
      description: mapping.description,
      conditionalRulesJson: mapping.conditionalRulesJson,
      transformRule: mapping.transformRule,
      defaultValue: mapping.defaultValue,
      checkedValue: mapping.checkedValue,
      uncheckedValue: mapping.uncheckedValue,
      category: mapping.category,
      isArrayField: mapping.isArrayField || false,
      arrayName: mapping.arrayName,
      arrayFieldPattern: mapping.arrayFieldPattern,
      arrayMaxItems: mapping.arrayMaxItems,
      sourceArrayPath: mapping.sourceArrayPath,
      fieldNamePrefix: mapping.fieldNamePrefix,
      usePrefixInPdfFieldName: mapping.usePrefixInPdfFieldName || false
    });

    this.pdfFieldMappingService.pdfFieldMapping_Update(mapping.id, request).subscribe({
      next: (updated) => {
        mapping.isEnabled = newState;
        this.showToast('success', 'Success', `Mapping ${newState ? 'enabled' : 'disabled'} successfully`);
      },
      error: (error) => {
        this.showToast('danger', 'Error', 'Failed to toggle mapping');
        console.error('Error toggling mapping:', error);
      }
    });
  }

  addConditionalRule(): void {
    this.conditionalRules.push({
      condition: '',
      pdfField: '',
      setValue: 'Yes'
    });
  }

  removeConditionalRule(index: number): void {
    this.conditionalRules.splice(index, 1);
  }

  createMappingFromTemplate(field: PdfTemplateFieldInfo): void {
    this.openCreateDialog();
    this.mappingForm.pdfFieldName = field.fieldName || '';
    
    // Auto-suggest mapping type based on field type
    if (field.fieldType === 'Checkbox') {
      this.mappingForm.mappingType = 'Checkbox';
    } else {
      this.mappingForm.mappingType = 'Simple';
    }
  }

  quickMapTitleCheckboxes(): void {
    // Quick setup for common Title → checkbox pattern
    this.openCreateDialog();
    this.mappingForm.sourceField = 'Title';
    this.mappingForm.mappingType = 'Conditional';
    this.mappingForm.category = 'Personal';
    this.mappingForm.description = 'Map Title to checkboxes';
    
    this.conditionalRules = [
      { condition: "value == 'Mr'", pdfField: 'checkbox_Mr', setValue: 'Yes' },
      { condition: "value == 'Mrs'", pdfField: 'checkbox_Mrs', setValue: 'Yes' },
      { condition: "value == 'Ms'", pdfField: 'checkbox_Ms', setValue: 'Yes' },
      { condition: "value == 'Miss'", pdfField: 'checkbox_Miss', setValue: 'Yes' },
      { condition: "value == 'Dr'", pdfField: 'checkbox_Dr', setValue: 'Yes' },
      { condition: "value == 'Prof'", pdfField: 'checkbox_Prof', setValue: 'Yes' }
    ];
  }

  quickMapGenderCheckboxes(): void {
    this.openCreateDialog();
    this.mappingForm.sourceField = 'Gender';
    this.mappingForm.mappingType = 'Conditional';
    this.mappingForm.category = 'Personal';
    this.mappingForm.description = 'Map Gender to checkboxes';
    
    this.conditionalRules = [
      { condition: "value == 'Male'", pdfField: 'checkbox_Male', setValue: 'Yes' },
      { condition: "value == 'Female'", pdfField: 'checkbox_Female', setValue: 'Yes' }
    ];
  }

  getMappingTypeLabel(type: string): string {
    const option = this.mappingTypeOptions.find(o => o.value === type);
    return option?.label || type;
  }

  getMappingCount(type: string): number {
    return this.mappings.filter(m => m.mappingType === type).length;
  }

  getEnabledCount(): number {
    return this.mappings.filter(m => m.isEnabled).length;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
