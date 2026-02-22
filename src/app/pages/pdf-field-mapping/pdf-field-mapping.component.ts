import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
    PdfFieldMappingServiceProxy,
    PdfFieldMappingDto,
    PdfTemplateAnalysisResult,
    PdfTemplateFieldInfo,
    FileUploadServiceProxy,
    FileParameter,
    PdfMappingProfileDto,
    CreatePdfMappingProfileRequest,
    UpdatePdfMappingProfileRequest,
    CreatePdfFieldMappingRequest,
    UpdatePdfFieldMappingRequest
} from '../../core/services/service-proxies';

interface ConditionalRule {
    condition: string;
    pdfField: string;
    setValue: string;
}

interface FieldGroup {
    label: string;
    value: string; // 'standard', 'custom', or dynamic type key
    type: 'standard' | 'custom' | 'dynamic';
    items: { label: string; value: string; isCount?: boolean }[];
}

@Component({
    selector: 'app-pdf-field-mapping',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [PdfFieldMappingServiceProxy, FileUploadServiceProxy],
    templateUrl: './pdf-field-mapping.component.html',
    styleUrl: './pdf-field-mapping.component.scss'
})
export class PdfFieldMappingComponent implements OnInit {
    profiles: PdfMappingProfileDto[] = [];
    selectedProfileId: string | null = null;

    mappings: PdfFieldMappingDto[] = [];
    templateAnalysis: PdfTemplateAnalysisResult | null = null;
    currentTemplateFileId: string | null = null;
    currentTemplateFile: any | null = null;
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
        { label: 'Radio Button', value: 'RadioButton' },
        { label: 'Signature Image', value: 'Signature' }
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
        'Title',
        'FirstNames',
        'Surname',
        'Name',
        'DateOfBirth',
        'IdentificationNumber',
        'Age',
        'Gender',
        'MaritalStatus',
        'Email',
        'Phone1',
        'Phone2',
        'Address',
        'City',
        'Province',
        'PostalCode',
        'Occupation',
        'BankName',
        'AccountNumber',
        'AccountType',
        'TodayDate',
        'CurrentYear'
    ];

    fieldGroups: FieldGroup[] = [];
    selectedEntityGroup: FieldGroup | null = null;
    selectedFieldPart: string = '';
    selectedRowIndex: number = 1;
    availableFieldsForGroup: { label: string; value: string; isCount?: boolean }[] = [];

    alertMessage: string = '';
    alertType: 'success' | 'danger' | 'warning' | 'info' = 'success';
    showAlert: boolean = false;
    activeTab: string = 'basic-tab';

    constructor(
        private pdfFieldMappingService: PdfFieldMappingServiceProxy,
        private fileUploadService: FileUploadServiceProxy,
        private http: HttpClient
    ) {}

    ngOnInit(): void {
        this.loadProfiles();
        this.loadAvailableFields();
    }

    get selectedProfile(): PdfMappingProfileDto | null {
        if (!this.selectedProfileId) {
            return null;
        }

        return this.profiles.find((profile) => profile.id === this.selectedProfileId) || null;
    }

    loadAvailableFields(): void {
        this.http.get<string[]>(this.baseUrl + '/api/PdfFieldMapping/GetAvailableFields').subscribe({
            next: (fields) => {
                console.log('=== Available fields from API ===');
                console.log('Total fields received:', fields.length);
                if (fields && fields.length > 0) {
                    this.suggestedSourceFields = fields;
                    
                    // Debug: Show all DynamicEntity fields
                    const dynamicFields = fields.filter(f => f.startsWith('DynamicEntity:'));
                    console.log(`\nDynamic entity fields (${dynamicFields.length}):`, dynamicFields);
                    
                    // Group by type to see patterns
                    const byType = new Map<string, string[]>();
                    dynamicFields.forEach(f => {
                        const content = f.replace('DynamicEntity:', '');
                        const parts = content.split('_');
                        const typeGuess = parts[0] + (parts[1] && parts[1] !== '1' && isNaN(parseInt(parts[1])) ? '_' + parts[1] : '');
                        if (!byType.has(typeGuess)) byType.set(typeGuess, []);
                        byType.get(typeGuess)!.push(f);
                    });
                    console.log('\nGrouped by apparent type:');
                    byType.forEach((fields, type) => {
                        console.log(`  ${type}: ${fields.length} fields`, fields.slice(0, 3));
                    });
                    
                    this.organizeFields();
                }
            },
            error: (error) => {
                console.error('Error loading available fields:', error);
                // Fallback to the default static list initialized in the property
                this.organizeFields();
            }
        });
    }

    organizeFields(): void {
        console.log('=== Organizing Fields ===');
        console.log('Total fields to organize:', this.suggestedSourceFields.length);
        
        const standardGroup: FieldGroup = { label: 'Member (Standard)', value: 'standard', type: 'standard', items: [] };
        const customGroup: FieldGroup = { label: 'Member (Custom)', value: 'custom', type: 'custom', items: [] };
        const dynamicGroupsMap = new Map<string, FieldGroup>();

        // Pass 1: Identify standard, custom, and dynamic types (from _Count fields)
        this.suggestedSourceFields.forEach((field) => {
            if (field.startsWith('fieldKey:')) {
                const key = field.replace('fieldKey:', '');
                customGroup.items.push({ label: key, value: key });
            } else if (field.startsWith('DynamicEntity:')) {
                const content = field.replace('DynamicEntity:', '');
                if (content.endsWith('_Count')) {
                    const typeKey = content.replace('_Count', '');
                    if (!dynamicGroupsMap.has(typeKey)) {
                        const label = this.formatDynamicTypeLabel(typeKey);
                        dynamicGroupsMap.set(typeKey, {
                            label: label,
                            value: typeKey,
                            type: 'dynamic',
                            items: []
                        });
                        console.log(`Created dynamic group: "${label}" (typeKey: ${typeKey})`);
                    }
                    dynamicGroupsMap.get(typeKey)!.items.push({ label: 'Total Count', value: 'Count', isCount: true });
                }
            } else {
                standardGroup.items.push({ label: field, value: field });
            }
        });

        console.log(`Pass 1 complete: ${dynamicGroupsMap.size} dynamic entity types found`);
        console.log('Dynamic type keys:', Array.from(dynamicGroupsMap.keys()));

        // Pass 2: Handle Dynamic Entity Fields
        // Match fields like: DynamicEntity:{TypeKey}_{anyNumber}_{Field}
        const unmatchedFields: string[] = [];
        const matchedFields: string[] = [];
        
        this.suggestedSourceFields.forEach((field) => {
            if (field.startsWith('DynamicEntity:') && !field.endsWith('_Count')) {
                const content = field.replace('DynamicEntity:', '');
                let matched = false;

                // Sort by longest key first to avoid partial matches
                const sortedKeys = Array.from(dynamicGroupsMap.keys()).sort((a, b) => b.length - a.length);
                
                console.log(`\nTrying to match field: "${field}"`);
                console.log(`  Content after prefix: "${content}"`);
                
                for (const typeKey of sortedKeys) {
                    // Pattern: {TypeKey}_{Number}_{Field}
                    // Use regex to match any number, not just 1
                    const escapedKey = this.escapeRegex(typeKey);
                    const regex = new RegExp(`^${escapedKey}_(\\d+)_(.+)$`);
                    console.log(`  Testing against typeKey: "${typeKey}", regex: ^${escapedKey}_(\\d+)_(.+)$`);
                    
                    const match = content.match(regex);
                    
                    if (match) {
                        const rowIndex = match[1];
                        const fieldName = match[2];
                        const group = dynamicGroupsMap.get(typeKey)!;
                        
                        console.log(`  ✓ MATCH! Row: ${rowIndex}, Field: ${fieldName}`);
                        
                        // Only add if not already present
                        if (!group.items.some(item => item.value === fieldName)) {
                            group.items.push({ label: this.formatFieldLabel(fieldName), value: fieldName });
                            console.log(`  Added field "${fieldName}" to group "${group.label}"`);
                            matchedFields.push(field);
                        } else {
                            console.log(`  Field "${fieldName}" already exists in group`);
                        }
                        matched = true;
                        break;
                    } else {
                        console.log(`  ✗ No match`);
                    }
                }
                
                if (!matched) {
                    unmatchedFields.push(field);
                    console.log(`  ✗ UNMATCHED!`);
                }
            }
        });

        console.log(`\n=== Pass 2 Results ===`);
        console.log(`Matched fields: ${matchedFields.length}`);
        console.log(`Unmatched fields: ${unmatchedFields.length}`);

        if (unmatchedFields.length > 0) {
            console.warn(`${unmatchedFields.length} dynamic entity fields could not be matched:`, unmatchedFields.slice(0, 5));
        }

        // Sort items
        standardGroup.items.sort((a, b) => a.label.localeCompare(b.label));
        customGroup.items.sort((a, b) => a.label.localeCompare(b.label));

        this.fieldGroups = [standardGroup];
        if (customGroup.items.length > 0) this.fieldGroups.push(customGroup);

        // Convert map to array and add
        const dynamicGroups = Array.from(dynamicGroupsMap.values()).sort((a, b) => a.label.localeCompare(b.label));
        console.log(`Final dynamic groups (${dynamicGroups.length}):`, dynamicGroups.map(g => `${g.label} (${g.items.length} fields)`));
        
        dynamicGroups.forEach((g) => {
            g.items.sort((a, b) => {
                if (a.value === 'Count') return -1;
                if (b.value === 'Count') return 1;
                return a.label.localeCompare(b.label);
            });
            this.fieldGroups.push(g);
            console.log(`  Group "${g.label}" fields:`, g.items.map(i => i.label).join(', '));
        });

        console.log(`Total field groups: ${this.fieldGroups.length}`);
        console.log('=== Field Organization Complete ===');
    }

    /**
     * Escape special regex characters in a string
     */
    escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    formatDynamicTypeLabel(typeKey: string): string {
        // Convert Extended_Family_Members -> Extended Family Members
        // Convert Beneficiaries -> Beneficiaries
        return typeKey
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    formatFieldLabel(fieldName: string): string {
        // Convert FullName -> Full Name, dateOfBirth -> Date Of Birth, etc.
        // Handle camelCase and PascalCase
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Get user-friendly label for the currently selected field
     */
    getFieldLabel(): string {
        if (!this.selectedFieldPart) return '';
        const field = this.availableFieldsForGroup.find(f => f.value === this.selectedFieldPart);
        return field?.label || this.selectedFieldPart;
    }

    onEntityGroupChange(): void {
        console.log('Entity group changed:', this.selectedEntityGroup);
        if (this.selectedEntityGroup) {
            this.availableFieldsForGroup = this.selectedEntityGroup.items;
            console.log(`Available fields for ${this.selectedEntityGroup.label}:`, this.availableFieldsForGroup);
            this.selectedFieldPart = '';
            this.selectedRowIndex = 1;
            this.updateSourceField();
        } else {
            this.availableFieldsForGroup = [];
            this.selectedFieldPart = '';
            this.mappingForm.sourceField = '';
        }
    }

    onFieldChange(): void {
        console.log('Field changed:', this.selectedFieldPart);
        this.updateSourceField();
    }

    onRowIndexChange(): void {
        console.log('Row index changed:', this.selectedRowIndex);
        this.updateSourceField();
    }

    updateSourceField(): void {
        if (!this.selectedEntityGroup || !this.selectedFieldPart) {
            // If we are clearing or incomplete, don't wipe sourceField unless manually cleared?
            // Actually, if dropdowns change, we should sync sourceField.
            if (!this.selectedEntityGroup) this.mappingForm.sourceField = '';
            return;
        }

        const group = this.selectedEntityGroup;
        const field = this.selectedFieldPart;

        if (group.type === 'standard') {
            this.mappingForm.sourceField = field;
        } else if (group.type === 'custom') {
            this.mappingForm.sourceField = `fieldKey:${field}`;
        } else if (group.type === 'dynamic') {
            // If it's Count, no index
            if (field === 'Count') {
                this.mappingForm.sourceField = `DynamicEntity:${group.value}_Count`;
            } else {
                const index = Math.max(1, this.selectedRowIndex || 1);
                this.mappingForm.sourceField = `DynamicEntity:${group.value}_${index}_${field}`;
            }
        }
        
        console.log('Updated sourceField to:', this.mappingForm.sourceField);
    }

    initializeFormSelectors(): void {
        this.selectedEntityGroup = null;
        this.selectedFieldPart = '';
        this.selectedRowIndex = 1;

        const source = this.mappingForm.sourceField;
        if (!source) return;

        // Try to find the group and field
        // 1. Check Standard
        let group = this.fieldGroups.find((g) => g.type === 'standard' && g.items.some((i) => i.value === source));
        if (group) {
            this.selectedEntityGroup = group;
            this.availableFieldsForGroup = group.items;
            this.selectedFieldPart = source;
            return;
        }

        // 2. Check Custom
        if (source.startsWith('fieldKey:')) {
            const key = source.replace('fieldKey:', '');
            group = this.fieldGroups.find((g) => g.type === 'custom');
            if (group) {
                this.selectedEntityGroup = group;
                this.availableFieldsForGroup = group.items;
                this.selectedFieldPart = key;
                return;
            }
        }

        // 3. Check Dynamic
        if (source.startsWith('DynamicEntity:')) {
            const content = source.replace('DynamicEntity:', '');

            // Check for Count
            if (content.endsWith('_Count')) {
                const typeKey = content.replace('_Count', '');
                group = this.fieldGroups.find((g) => g.type === 'dynamic' && g.value === typeKey);
                if (group) {
                    this.selectedEntityGroup = group;
                    this.availableFieldsForGroup = group.items;
                    this.selectedFieldPart = 'Count';
                    return;
                }
            }

            // Check for Row item: {TypeKey}_{Index}_{Field}
            // This is harder because splitting by underscore is ambiguous if TypeKey has underscores.
            // But we have the list of dynamic groups!
            const dynamicGroups = this.fieldGroups.filter((g) => g.type === 'dynamic');
            for (const g of dynamicGroups) {
                // Regex for this group: ^{TypeKey}_(\d+)_(.+)$
                // TypeKey is g.value
                // Escape regex? Group value comes from backend key, likely safeish but simple escape is good.
                // Let's just use string parsing.
                if (content.startsWith(g.value + '_')) {
                    const rest = content.substring(g.value.length + 1); // after TypeKey_
                    // Expect: {Index}_{Field}
                    const match = rest.match(/^(\d+)_(.+)$/);
                    if (match) {
                        this.selectedEntityGroup = g;
                        this.availableFieldsForGroup = g.items;
                        this.selectedRowIndex = parseInt(match[1]);
                        this.selectedFieldPart = match[2];
                        return;
                    }
                }
            }
        }
    }

    showToast(severity: 'success' | 'danger' | 'warning' | 'info', summary: string, detail: string): void {
        this.alertType = severity;
        this.alertMessage = `${summary}: ${detail}`;
        this.showAlert = true;
        setTimeout(() => (this.showAlert = false), 5000);
    }

    loadProfiles(): void {
        this.pdfFieldMappingService.pdfFieldMapping_GetProfiles().subscribe({
            next: (response) => {
                const rows = response?.result || [];
                this.profiles = rows;

                const preferredProfile = this.profiles.find((p) => p.id === this.selectedProfileId)
                    || this.profiles.find((p) => p.isDefault)
                    || this.profiles[0]
                    || null;

                this.selectedProfileId = preferredProfile?.id || null;
                this.loadMappings();
                this.loadCurrentTemplate();
            },
            error: (error) => {
                this.showToast('danger', 'Error', 'Failed to load mapping profiles');
                console.error('Error loading mapping profiles:', error);
            }
        });
    }

    onProfileChange(): void {
        this.loadMappings();
        this.loadCurrentTemplate();
    }

    createProfile(): void {
        const name = prompt('Enter a name for the new PDF mapping');
        if (!name || !name.trim()) {
            return;
        }

        const payload = {
            name: name.trim(),
            templateFileId: undefined,
            isEnabled: true,
            isDefault: false,
            displayOrder: this.profiles.length
        };

        this.pdfFieldMappingService
            .pdfFieldMapping_CreateProfile(new CreatePdfMappingProfileRequest(payload))
            .subscribe({
            next: (response) => {
                const created = response?.result;
                if (created?.id) {
                    this.selectedProfileId = created.id;
                }

                this.showToast('success', 'Success', 'New PDF mapping created');
                this.loadProfiles();
            },
            error: (error) => {
                this.showToast('danger', 'Error', 'Failed to create PDF mapping profile');
                console.error('Error creating profile:', error);
            }
        });
    }

    loadMappings(): void {
        if (!this.selectedProfileId) {
            this.mappings = [];
            return;
        }

        this.pdfFieldMappingService.pdfFieldMapping_GetAll(this.selectedProfileId).subscribe({
            next: (response) => {
                this.mappings = response?.result || [];
            },
            error: (error) => {
                this.showToast('danger', 'Error', 'Failed to load mappings');
                console.error('Error loading mappings:', error);
            }
        });
    }

    loadCurrentTemplate(): void {
        const selected = this.selectedProfile;
        if (!selected?.templateFileId) {
            this.currentTemplateFileId = null;
            this.currentTemplateFile = null;
            return;
        }

        this.currentTemplateFileId = selected.templateFileId;
        this.loadFileMetadata(selected.templateFileId);
    }

    loadFileMetadata(fileId: string): void {
        console.log('Loading file metadata for fileId:', fileId);
        
        // Try direct HTTP call first to see raw response
        this.http.get(`${this.baseUrl}/api/FileUpload/File_GetByFileId/${fileId}`).subscribe({
            next: (directResponse: any) => {
                console.log('Direct HTTP response:', directResponse);
                this.currentTemplateFile = directResponse;
                
                if (!this.currentTemplateFile || !this.currentTemplateFile.fileName) {
                    console.warn('File metadata missing fileName property');
                    this.currentTemplateFile = null;
                }
            },
            error: (error) => {
                console.error('Error loading file metadata (direct):', error);
                console.error('Error status:', error.status);
                console.error('Error message:', error.message);
                this.currentTemplateFile = null;
                
                if (error.status === 404) {
                    this.showToast('warning', 'Template Not Found', 'The template file was not found. It may have been deleted.');
                } else {
                    this.showToast('warning', 'Template Info', 'Could not load template details.');
                }
            }
        });
    }

    downloadTemplate(): void {
        if (!this.currentTemplateFileId) return;
        const url = `${this.baseUrl}/api/FileUpload/File_DownloadFile/${this.currentTemplateFileId}`;
        window.open(url, '_blank');
    }

    formatFileSize(bytes: number): string {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    onTemplateUpload(event: any): void {
        const file = event.target.files[0];
        if (!file) return;

        if (!this.selectedProfileId) {
            this.showToast('warning', 'Select Mapping', 'Please select or create a PDF mapping first');
            event.target.value = '';
            return;
        }

        if (file.type !== 'application/pdf') {
            this.showToast('danger', 'Invalid File', 'Only PDF files are allowed for contract templates');
            event.target.value = '';
            return;
        }

        const fileParameter: FileParameter = {
            data: file,
            fileName: file.name
        };

        this.fileUploadService.file_UploadFile('PdfMappingTemplate', undefined, undefined, undefined, false, fileParameter).subscribe({
            next: (uploadResponse) => {
                const uploadedFileId = uploadResponse?.result?.id;
                if (!uploadedFileId) {
                    this.showToast('danger', 'Error', 'Template upload returned no file ID');
                    return;
                }

                this.pdfFieldMappingService
                    .pdfFieldMapping_UpdateProfile(
                        this.selectedProfileId,
                        new UpdatePdfMappingProfileRequest({
                            name: undefined,
                            templateFileId: uploadedFileId,
                            clearTemplateFileId: undefined,
                            isEnabled: undefined,
                            isDefault: undefined,
                            displayOrder: undefined
                        })
                    )
                    .subscribe({
                    next: () => {
                        this.showToast('success', 'Success', 'Template uploaded for selected PDF mapping');
                        this.loadProfiles();
                    },
                    error: (error: any) => {
                        this.showToast('danger', 'Error', 'Failed to assign template to mapping profile');
                        console.error('Profile template assignment error:', error);
                    }
                });
            },
            error: (error: any) => {
                this.showToast('danger', 'Error', 'Failed to upload template: ' + (error?.error?.message || error?.message || 'Unknown error'));
                console.error('Template upload error:', error);
            }
        });

        event.target.value = '';
    }

    removeTemplate(): void {
        if (!confirm('Are you sure you want to remove the contract template?')) {
            return;
        }

        if (!this.selectedProfileId) {
            return;
        }

        this.pdfFieldMappingService
            .pdfFieldMapping_UpdateProfile(
                this.selectedProfileId,
                new UpdatePdfMappingProfileRequest({
                    name: undefined,
                    templateFileId: undefined,
                    clearTemplateFileId: true,
                    isEnabled: undefined,
                    isDefault: undefined,
                    displayOrder: undefined
                })
            )
            .subscribe({
            next: () => {
                this.showToast('success', 'Success', 'Template removed from selected PDF mapping');
                this.currentTemplateFileId = null;
                this.currentTemplateFile = null;
                this.templateAnalysis = null;
                this.loadProfiles();
            },
            error: (error: any) => {
                this.showToast('danger', 'Error', 'Failed to remove template: ' + (error?.error?.message || error?.message || 'Unknown error'));
                console.error('Template removal error:', error);
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
            next: (response) => {
                this.templateAnalysis = response?.result || null;

                // Merge suggested fields from backend into the component's list
                if (response?.result?.suggestedSourceFields) {
                    const newFields = response.result.suggestedSourceFields;
                    // Use Set to ensure uniqueness and merge with existing hardcoded defaults
                    const combined = new Set([...this.suggestedSourceFields, ...newFields]);
                    this.suggestedSourceFields = Array.from(combined).sort();
                }

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

        // Initialize UI selectors from the sourceField value
        this.initializeFormSelectors();

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

        // Reset selectors
        this.selectedEntityGroup = null;
        this.selectedFieldPart = '';
        this.selectedRowIndex = 1;
        this.availableFieldsForGroup = [];
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
        if (!this.selectedProfileId) {
            this.showToast('warning', 'Select Mapping', 'Please select a PDF mapping first');
            return;
        }

        const request = new CreatePdfFieldMappingRequest({
            profileId: this.selectedProfileId,
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
            next: (response) => {
                if (response?.result) {
                    this.mappings.push(response.result);
                }
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
            profileId: this.selectedProfileId,
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
            next: (response) => {
                const mapping = response?.result;
                if (!mapping) {
                    return;
                }
                const index = this.mappings.findIndex((m) => m.id === this.selectedMapping!.id);
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
                this.mappings = this.mappings.filter((m) => m.id !== mapping.id);
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
            profileId: this.selectedProfileId,
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
        const option = this.mappingTypeOptions.find((o) => o.value === type);
        return option?.label || type;
    }

    getMappingCount(type: string): number {
        return this.mappings.filter((m) => m.mappingType === type).length;
    }

    getEnabledCount(): number {
        return this.mappings.filter((m) => m.isEnabled).length;
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }
}
