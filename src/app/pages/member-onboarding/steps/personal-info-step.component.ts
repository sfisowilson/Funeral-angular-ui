import { Component, OnInit, Input, Output, EventEmitter, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { InputMaskModule } from 'primeng/inputmask';
import { TabViewModule } from 'primeng/tabview';
import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { 
    DynamicFormService, 
    DynamicFormCategory, 
    DynamicFormField 
} from '../../../core/services/dynamic-form.service';
import {
    OnboardingFieldConfigurationServiceProxy,
    MemberProfileCompletionServiceProxy,
    UpdateProfileCompletionStepDto,
    SaveMemberOnboardingDataDto,
    MemberOnboardingDataDto,
    MemberServiceProxy,
    MemberDto,
    FileUploadServiceProxy,
    DocumentRequirementServiceProxy,
    FileMetadataDto,
    MemberDocumentType,
    DocumentRequirement
} from '../../../core/services/service-proxies';
import { AuthService } from '../../../auth/auth-service';
import { SAIdValidator, SAIdInfo } from '../../../shared/utils/sa-id-validator';
import { EmbeddedCalculatorComponent, CalculatorConfig, CalculatorResult } from '../../../shared/components/embedded-calculator/embedded-calculator.component';
import { DynamicRepeaterFieldComponent, RepeaterConfig } from '../../../shared/components/dynamic-repeater-field/dynamic-repeater-field.component';
import { DynamicFileUploadComponent, FileUploadConfig, UploadedFile } from '../../../shared/components/dynamic-file-upload/dynamic-file-upload.component';

@Component({
    selector: 'app-personal-info-step',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CardModule,
        ButtonModule,
        InputTextModule,
        DropdownModule,
        RadioButtonModule,
        CheckboxModule,
        CalendarModule,
        InputMaskModule,
        TabViewModule,
        FileUploadModule,
        TableModule,
        TagModule,
        TooltipModule,
        ToastModule,
        ProgressSpinnerModule,
        EmbeddedCalculatorComponent,
        DynamicRepeaterFieldComponent,
        DynamicFileUploadComponent
    ],
    providers: [
        MessageService,
        DynamicFormService
    ],
    templateUrl: './personal-info-step.component.html',
    styleUrl: './personal-info-step.component.scss'
})
export class PersonalInfoStepComponent implements OnInit {
    @Input() viewMode: boolean = false;
    @Input() memberId?: string;
    @Output() stepComplete = new EventEmitter<void>();

    categories = signal<DynamicFormCategory[]>([]);
    formGroup = signal<FormGroup | null>(null);
    memberData = signal<MemberDto | null>(null);
    loading = signal(false);
    saving = signal(false);
    
    // SA ID validation
    idInfo = signal<SAIdInfo | null>(null);
    parsedDateOfBirth = signal<Date | null>(null);
    parsedGender = signal<string | null>(null);
    
    // Document upload properties
    uploadedDocuments = signal<FileMetadataDto[]>([]);
    uploading = signal(false);
    selectedFile?: File;
    selectedDocumentType?: MemberDocumentType;
    requiredDocuments = signal<DocumentRequirement[]>([]);
    
    documentTypes = [
        { label: 'ID Document', value: MemberDocumentType._1 },
        { label: 'Proof of Residence', value: MemberDocumentType._2 },
        { label: 'Birth Certificate', value: MemberDocumentType._3 },
        { label: 'Marriage Certificate', value: MemberDocumentType._4 },
        { label: 'Divorce Decree', value: MemberDocumentType._5 },
        { label: 'Death Certificate', value: MemberDocumentType._6 },
        { label: 'Other Document', value: MemberDocumentType._99 }
    ];
    
    // Calculator and repeater field storage
    calculatorValues: { [fieldKey: string]: CalculatorResult } = {};
    fileUploadValues: { [fieldKey: string]: UploadedFile[] } = {};
    repeaterValues: { [fieldKey: string]: any[] } = {};
    
    private stepCompleteSubject = new Subject<void>();

    constructor(
        private dynamicFormService: DynamicFormService,
        private fieldConfigService: OnboardingFieldConfigurationServiceProxy,
        private profileService: MemberProfileCompletionServiceProxy,
        private memberService: MemberServiceProxy,
        private fileUploadService: FileUploadServiceProxy,
        private documentRequirementService: DocumentRequirementServiceProxy,
        private messageService: MessageService,
        public authService: AuthService
    ) {
        // Debounce step completion to prevent rapid emissions
        this.stepCompleteSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            this.stepComplete.emit();
        });
    }

    ngOnInit() {
        this.loadMemberData();
        this.loadFormConfiguration();
        this.loadExistingData();
        this.loadRequiredDocuments();
        this.loadMemberDocuments();
    }

    /**
     * Load member basic information (ID, email, phone)
     */
    loadMemberData() {
        const memberId = this.authService.getUserId();
        if (!memberId) {
            console.error('[PersonalInfo] Cannot load member data: memberId not found');
            return;
        }

        this.memberService.member_GetById(memberId).subscribe({
            next: (member: MemberDto) => {
                console.log('[PersonalInfo] Loaded member data:', member);
                this.memberData.set(member);
                
                // Validate existing ID number
                if (member.identificationNumber) {
                    this.validateIdNumber(member.identificationNumber);
                }
            },
            error: (error: any) => {
                console.error('[PersonalInfo] Error loading member data:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load member information'
                });
            }
        });
    }

    /**
     * Load form configuration from backend
     */
    loadFormConfiguration() {
        this.loading.set(true);
        
        this.dynamicFormService.loadFormConfiguration().subscribe({
            next: (categories: DynamicFormCategory[]) => {
                console.log('[PersonalInfo] Loaded categories:', categories);
                this.categories.set(categories);
                
                // Create form group from categories
                const form = this.dynamicFormService.createFormGroup(categories);
                this.formGroup.set(form);
                
                this.loading.set(false);
                
                // Check if step is already complete
                this.checkCompletion();
            },
            error: (error: any) => {
                console.error('[PersonalInfo] Error loading form configuration:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load form configuration'
                });
                this.loading.set(false);
            }
        });
    }

    /**
     * Load existing member onboarding data if available
     */
    loadExistingData() {
        this.fieldConfigService.onboardingFieldConfiguration_GetMemberData().subscribe({
            next: (data: MemberOnboardingDataDto) => {
                if (data && data.fieldValues) {
                    console.log('[PersonalInfo] Loaded existing data:', data);
                    
                    // Wait for form to be ready
                    setTimeout(() => {
                        const form = this.formGroup();
                        if (form && data.fieldValues) {
                            // Convert fieldValues dictionary to array format for populateForm
                            const dataArray = Object.entries(data.fieldValues).map(([key, value]) => ({
                                fieldKey: key,
                                fieldValue: value
                            }));
                            
                            this.dynamicFormService.populateForm(form, dataArray);
                        }
                    }, 500);
                }
            },
            error: (error: any) => {
                console.error('[PersonalInfo] Error loading existing data:', error);
                // Don't show error to user - it's okay if no data exists yet
            }
        });
    }

    /**
     * Save form data to backend
     */
    saveData() {
        const form = this.formGroup();
        if (!form) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Form not initialized'
            });
            return;
        }

        // Validate form
        if (form.invalid) {
            this.markFormGroupTouched(form);
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields correctly'
            });
            return;
        }

        this.saving.set(true);

        // Extract form data
        const formDataArray = this.dynamicFormService.extractFormData(form);
        
        // Convert array to fieldValues dictionary for the DTO
        const fieldValues: { [key: string]: string } = {};
        formDataArray.forEach(item => {
            fieldValues[item.fieldKey] = item.fieldValue;
        });
        
        const dto = new SaveMemberOnboardingDataDto({
            fieldValues: fieldValues
        });
        
        console.log('[PersonalInfo] Saving form data:', dto);

        // Validate ID number before saving
        const member = this.memberData();
        if (member && member.identificationNumber) {
            const info = this.idInfo();
            if (!info || !info.isValid) {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Invalid ID Number',
                    detail: info?.errorMessage || 'Please enter a valid South African ID number'
                });
                this.saving.set(false);
                return;
            }
        }

        // Save member basic information first
        if (member) {
            // Create a clean DTO to send to the API
            const memberDto = new MemberDto({
                ...member,
                // Convert Date object to ISO string for proper serialization
                dateOfBirth: member.dateOfBirth ? 
                    (member.dateOfBirth instanceof Date ? 
                        member.dateOfBirth.toISOString() : 
                        member.dateOfBirth) as any : 
                    undefined
            });
            
            this.memberService.member_UpdateMember(memberDto.id, memberDto).subscribe({
                next: () => {
                    console.log('[PersonalInfo] Member basic info saved');
                    // Then save custom form fields
                    this.saveDynamicFormData(dto);
                },
                error: (error: any) => {
                    console.error('[PersonalInfo] Error saving member data:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error?.error?.message || 'Failed to save member information'
                    });
                    this.saving.set(false);
                }
            });
        } else {
            // If no member data loaded, just save dynamic fields
            this.saveDynamicFormData(dto);
        }
    }

    /**
     * Save dynamic form data to backend
     */
    private saveDynamicFormData(dto: SaveMemberOnboardingDataDto) {
        this.fieldConfigService.onboardingFieldConfiguration_SaveMemberData(dto).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Personal information saved successfully'
                });
                this.saving.set(false);
                
                // Mark step as complete
                this.markStepComplete();
            },
            error: (error: any) => {
                console.error('[PersonalInfo] Error saving data:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error?.error?.message || 'Failed to save personal information'
                });
                this.saving.set(false);
            }
        });
    }

    /**
     * Mark profile completion step as complete
     */
    private markStepComplete() {
        const memberId = this.authService.getUserId();
        if (!memberId) {
            console.error('[PersonalInfo] Cannot mark step complete: memberId not found');
            return;
        }

        const dto = new UpdateProfileCompletionStepDto({
            memberId: memberId,
            stepName: 'PersonalInfo',
            isCompleted: true
        });

        this.profileService.profileCompletion_UpdateStep(dto).subscribe({
            next: () => {
                console.log('[PersonalInfo] Step marked as complete');
                this.stepCompleteSubject.next();
            },
            error: (error: any) => {
                console.error('[PersonalInfo] Error marking step complete:', error);
                // Still emit completion even if marking fails
                this.stepCompleteSubject.next();
            }
        });
    }

    /**
     * Check if step is complete based on form validity
     */
    private checkCompletion() {
        const form = this.formGroup();
        if (form && form.valid) {
            const memberId = this.authService.getUserId();
            if (!memberId) {
                console.error('[PersonalInfo] Cannot check completion: memberId not found');
                return;
            }

            console.log('[PersonalInfo] Form is valid, marking as complete');
            // Don't auto-save, but mark as complete if valid
            const dto = new UpdateProfileCompletionStepDto({
                memberId: memberId,
                stepName: 'PersonalInfo',
                isCompleted: true
            });

            this.profileService.profileCompletion_UpdateStep(dto).subscribe({
                next: () => {
                    console.log('[PersonalInfo] Step auto-marked as complete');
                },
                error: (error: any) => {
                    console.error('[PersonalInfo] Error auto-marking step:', error);
                }
            });
        }
    }

    /**
     * Mark all controls as touched to show validation errors
     */
    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    /**
     * Get error message for a field
     */
    getFieldError(field: DynamicFormField): string {
        return this.dynamicFormService.getErrorMessage(field);
    }

    /**
     * Check if a field should show error
     */
    shouldShowError(field: DynamicFormField): boolean {
        const control = field.control;
        return control.invalid && (control.dirty || control.touched);
    }

    /**
     * Get options for select/radio fields
     */
    getFieldOptions(field: DynamicFormField): string[] {
        return field.options || [];
    }

    /**
     * Handle form submission
     */
    onSubmit() {
        this.saveData();
    }

    /**
     * Get category display name
     */
    getCategoryDisplayName(categoryName: string): string {
        const displayNames: { [key: string]: string } = {
            'PersonalInfo': 'Personal Information',
            'Employment': 'Employment Details',
            'EmergencyContact': 'Emergency Contact',
            'MedicalInfo': 'Medical Information',
            'Other': 'Additional Information'
        };
        return displayNames[categoryName] || categoryName;
    }

    /**
     * Check if field is required
     */
    isFieldRequired(field: DynamicFormField): boolean {
        return field.config.isRequired || false;
    }

    /**
     * Validate SA ID Number and extract information
     */
    validateIdNumber(idNumber: string | undefined) {
        if (!idNumber) {
            this.idInfo.set(null);
            this.parsedDateOfBirth.set(null);
            this.parsedGender.set(null);
            return;
        }

        const info = SAIdValidator.validate(idNumber);
        this.idInfo.set(info);

        if (info.isValid) {
            this.parsedDateOfBirth.set(info.dateOfBirth);
            this.parsedGender.set(info.gender);
            
            // Auto-populate date of birth in member data if available
            const member = this.memberData();
            if (member && info.dateOfBirth) {
                // Store as Date object, will be converted to ISO string on save
                member.dateOfBirth = info.dateOfBirth as any;
            }
        } else {
            this.parsedDateOfBirth.set(null);
            this.parsedGender.set(null);
        }
    }

    /**
     * Handle ID number change event
     */
    onIdNumberChange() {
        const member = this.memberData();
        if (member) {
            this.validateIdNumber(member.identificationNumber);
        }
    }

    // Document upload methods
    loadRequiredDocuments() {
        const memberId = this.memberId || this.authService.getUserId();
        if (!memberId) return;

        this.documentRequirementService.documentRequirement_GetRequiredDocuments(memberId).subscribe({
            next: (requirements: DocumentRequirement[]) => {
                this.requiredDocuments.set(requirements);
            },
            error: (error: any) => {
                console.error('Error loading required documents:', error);
            }
        });
    }

    loadMemberDocuments() {
        const memberId = this.memberId || this.authService.getUserId();
        if (!memberId) return;

        const filesObservable = this.memberId
            ? this.fileUploadService.file_GetFilesByMemberId(this.memberId)
            : this.fileUploadService.file_GetMyFiles();
        
        filesObservable.subscribe({
            next: (files) => {
                // Filter files for this member
                const memberFiles = files.filter(f => 
                    f.entityType === 'Member' && f.entityId === memberId
                );
                this.uploadedDocuments.set(memberFiles);
            },
            error: (error) => {
                console.error('Error loading member documents:', error);
            }
        });
    }

    onFileSelect(event: any) {
        if (event.files && event.files.length > 0) {
            this.selectedFile = event.files[0];
        }
    }

    uploadMemberDocument() {
        if (!this.selectedFile || !this.selectedDocumentType) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select a document type and file'
            });
            return;
        }

        const memberId = this.memberId || this.authService.getUserId();
        if (!memberId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Member ID not found'
            });
            return;
        }

        this.uploading.set(true);

        const fileParameter = {
            data: this.selectedFile,
            fileName: this.selectedFile.name
        };

        // Determine if this document type is required
        const requirement = this.requiredDocuments().find(r => r.documentType === this.selectedDocumentType);
        const isRequired = requirement?.isRequired || false;

        this.fileUploadService.file_UploadFile(
            "Member",  // entityType
            memberId,  // entityId (member ID)
            undefined,  // documentType (legacy)
            this.selectedDocumentType,  // memberDocumentType
            isRequired,  // isRequired flag
            fileParameter
        ).subscribe({
            next: (result) => {
                this.uploading.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Document uploaded successfully'
                });
                // Reload documents
                this.loadMemberDocuments();
                this.selectedFile = undefined;
                this.selectedDocumentType = undefined;
                
                // Emit step complete to refresh completion status
                this.stepCompleteSubject.next();
            },
            error: (error) => {
                this.uploading.set(false);
                console.error('Upload error:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.message || 'Failed to upload document'
                });
            }
        });
    }

    getDocumentTypeLabel(value: MemberDocumentType | number): string {
        const type = this.documentTypes.find(t => t.value === value);
        return type?.label || `Document Type ${value}`;
    }

    deleteMemberDocument(fileId: string) {
        if (confirm('Are you sure you want to delete this document?')) {
            this.fileUploadService.file_DeleteFile(fileId).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Document deleted successfully'
                    });
                    this.loadMemberDocuments();
                    // Emit step complete to refresh completion status
                    this.stepCompleteSubject.next();
                },
                error: (error) => {
                    console.error('Error deleting document:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to delete document'
                    });
                }
            });
        }
    }

    downloadDocument(fileUrl: string) {
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    }
    
    /**
     * Get calculator configuration from field config
     */
    getCalculatorConfig(field: DynamicFormField): CalculatorConfig {
        // Parse config from optionsJson if available
        let config: CalculatorConfig = {
            title: field.config.fieldLabel || 'Your Estimated Premium',
            showBreakdown: true,
            autoCalculate: true, // Enable auto-calculation by default
            watchFieldKeys: ['dependents'] // Watch dependents field
        };
        
        if (field.config.optionsJson) {
            try {
                const parsed = JSON.parse(field.config.optionsJson);
                config = { ...config, ...parsed };
            } catch (e) {
                console.error('Error parsing calculator config:', e);
            }
        }
        
        return config;
    }
    
    /**
     * Get current form data snapshot for calculator
     */
    getFormDataSnapshot(): any {
        const form = this.formGroup();
        if (!form) return {};
        
        const snapshot: any = {};
        
        // Get all form values
        Object.keys(form.controls).forEach(key => {
            const value = form.get(key)?.value;
            if (value) {
                snapshot[key] = value;
            }
        });
        
        // Include repeater values
        Object.keys(this.repeaterValues).forEach(key => {
            snapshot[key] = this.repeaterValues[key];
        });
        
        return snapshot;
    }
    
    /**
     * Handle calculator value changes
     */
    onCalculatorChange(field: DynamicFormField, result: CalculatorResult) {
        this.calculatorValues[field.config.fieldKey!] = result;
        
        // Store in form as JSON string for backend
        const form = this.formGroup();
        if (form && form.get(field.config.fieldKey!)) {
            form.get(field.config.fieldKey!)?.setValue(JSON.stringify(result));
        }
    }
    
    /**
     * Get repeater configuration from field config
     */
    getRepeaterConfig(field: DynamicFormField): RepeaterConfig {
        // Parse config from optionsJson
        let config: RepeaterConfig = {
            fields: [
                { fieldKey: 'name', fieldLabel: 'Name', fieldType: 'text', required: true },
                { fieldKey: 'relationship', fieldLabel: 'Relationship', fieldType: 'text', required: true }
            ],
            singularLabel: 'Item',
            pluralLabel: 'Items',
            allowAdd: true,
            allowEdit: true,
            allowDelete: true
        };
        
        if (field.config.optionsJson) {
            try {
                const parsed = JSON.parse(field.config.optionsJson);
                config = { ...config, ...parsed };
            } catch (e) {
                console.error('Error parsing repeater config:', e);
            }
        }
        
        return config;
    }
    
    /**
     * Handle repeater value changes
     */
    onRepeaterChange(field: DynamicFormField, items: any[]) {
        this.repeaterValues[field.config.fieldKey!] = items;
        
        // Store in form as JSON string for backend
        const form = this.formGroup();
        if (form && form.get(field.config.fieldKey!)) {
            form.get(field.config.fieldKey!)?.setValue(JSON.stringify(items));
        }
        
        // Trigger change detection to update calculator if present
        // The calculator will pick up the changes via formData binding
    }
    /**
     * Get file upload configuration from field config
     */
    getFileUploadConfig(field: DynamicFormField): FileUploadConfig {
        let config: FileUploadConfig = {
            label: field.config.fieldLabel || 'File Upload',
            helpText: field.config.helpText || undefined,
            allowMultiple: true,
            maxFiles: 5,
            maxSizeMB: 5,
            acceptedTypes: ['image/*', 'application/pdf'],
            required: field.config.isRequired || false
        };
        
        if (field.config.optionsJson) {
            try {
                const parsed = JSON.parse(field.config.optionsJson);
                config = { ...config, ...parsed };
            } catch (e) {
                console.error('Error parsing file upload config:', e);
            }
        }
        
        return config;
    }
    
    /**
     * Handle file upload value changes
     */
    onFileUploadChange(field: DynamicFormField, files: UploadedFile[]) {
        this.fileUploadValues[field.config.fieldKey!] = files;
        
        // Store in form as JSON string for backend
        const form = this.formGroup();
        if (form && form.get(field.config.fieldKey!)) {
            form.get(field.config.fieldKey!)?.setValue(JSON.stringify(files));
        }
    }
    
    /**
     * Clear all form data after successful submission
     */
    clearForm() {
        console.log('[PersonalInfoStep] Clearing form data...');
        
        // Reset the form group
        const form = this.formGroup();
        if (form) {
            form.reset();
        }
        
        // Clear calculator values
        this.calculatorValues = {};
        
        // Clear repeater values
        this.repeaterValues = {};
        
        // Clear file upload values
        this.fileUploadValues = {};
        
        // Clear uploaded documents
        this.uploadedDocuments.set([]);
        
        // Clear member data
        this.memberData.set(null);
        
        // Clear SA ID info
        this.idInfo.set(null);
        this.parsedDateOfBirth.set(null);
        this.parsedGender.set(null);
        
        console.log('[PersonalInfoStep] Form cleared successfully');
    }
}

