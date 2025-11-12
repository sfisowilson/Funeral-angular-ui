import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
    OnboardingFieldConfigurationServiceProxy,
    OnboardingFieldConfigurationDto,
    CreateOnboardingFieldConfigurationDto,
    UpdateOnboardingFieldConfigurationDto
} from '../../../core/services/service-proxies';

interface FieldTypeOption {
    label: string;
    value: string;
}

interface CategoryOption {
    label: string;
    value: string;
}

@Component({
    selector: 'app-field-configuration',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        CheckboxModule,
        DropdownModule,
        InputTextarea,
        InputNumberModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        TooltipModule
    ],
    providers: [MessageService, ConfirmationService, OnboardingFieldConfigurationServiceProxy],
    templateUrl: './field-configuration.component.html',
    styleUrl: './field-configuration.component.scss'
})
export class FieldConfigurationComponent implements OnInit {
    fields = signal<OnboardingFieldConfigurationDto[]>([]);
    loading = signal(false);
    showDialog = signal(false);
    showInitializeDialog = signal(false);
    isEditMode = signal(false);

    currentField: Partial<OnboardingFieldConfigurationDto> = {};
    
    fieldTypes: FieldTypeOption[] = [
        { label: 'Text Input', value: 'text' },
        { label: 'Email', value: 'email' },
        { label: 'Phone Number', value: 'tel' },
        { label: 'Date', value: 'date' },
        { label: 'Select Dropdown', value: 'select' },
        { label: 'Radio Buttons', value: 'radio' },
        { label: 'Checkbox', value: 'checkbox' },
        { label: 'Text Area', value: 'textarea' }
    ];

    categories: CategoryOption[] = [
        { label: 'Personal Information', value: 'PersonalInfo' },
        { label: 'Employment', value: 'Employment' },
        { label: 'Emergency Contact', value: 'EmergencyContact' },
        { label: 'Medical Information', value: 'MedicalInfo' }
    ];

    constructor(
        private fieldService: OnboardingFieldConfigurationServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadFields();
    }

    loadFields() {
        this.loading.set(true);
        this.fieldService.onboardingFieldConfiguration_GetAll().subscribe({
            next: (result: OnboardingFieldConfigurationDto[]) => {
                // Sort by display order
                const sorted = result.sort((a, b) => a.displayOrder - b.displayOrder);
                this.fields.set(sorted);
                this.loading.set(false);
            },
            error: (error: any) => {
                console.error('Error loading field configurations:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load field configurations'
                });
                this.loading.set(false);
            }
        });
    }

    openNewDialog() {
        const maxOrder = this.fields().reduce((max, f) => Math.max(max, f.displayOrder), 0);
        this.currentField = {
            id: '00000000-0000-0000-0000-000000000000',
            fieldKey: '',
            fieldLabel: '',
            fieldType: 'text',
            category: 'PersonalInfo',
            isRequired: false,
            isEnabled: true,
            displayOrder: maxOrder + 1,
            placeholder: '',
            helpText: '',
            optionsJson: '',
            validationRulesJson: '',
            defaultValue: '',
            maxLength: undefined,
            minLength: undefined
        };
        this.isEditMode.set(false);
        this.showDialog.set(true);
    }

    editField(field: OnboardingFieldConfigurationDto) {
        this.currentField = { ...field };
        this.isEditMode.set(true);
        this.showDialog.set(true);
    }

    saveField() {
        // Validation
        if (!this.currentField.fieldKey || !this.currentField.fieldLabel || !this.currentField.fieldType || !this.currentField.category) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields'
            });
            return;
        }

        // Validate field key format (no spaces, alphanumeric + underscore)
        const fieldKeyRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
        if (!fieldKeyRegex.test(this.currentField.fieldKey!)) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Field key must start with a letter and contain only letters, numbers, and underscores'
            });
            return;
        }

        // Validate options JSON if field type is select or radio
        if ((this.currentField.fieldType === 'select' || this.currentField.fieldType === 'radio') && this.currentField.optionsJson) {
            try {
                JSON.parse(this.currentField.optionsJson);
            } catch (e) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Validation Error',
                    detail: 'Options JSON is not valid JSON format. Example: ["Option 1", "Option 2"]'
                });
                return;
            }
        }

        // Validate validation rules JSON if provided
        if (this.currentField.validationRulesJson) {
            try {
                JSON.parse(this.currentField.validationRulesJson);
            } catch (e) {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Validation Error',
                    detail: 'Validation rules JSON is not valid JSON format. Example: {"pattern": "^[A-Za-z]+$", "message": "Letters only"}'
                });
                return;
            }
        }

        this.loading.set(true);

        if (this.isEditMode()) {
            // Update existing field
            const updateDto = new UpdateOnboardingFieldConfigurationDto({
                id: this.currentField.id!,
                fieldKey: this.currentField.fieldKey!,
                fieldLabel: this.currentField.fieldLabel!,
                fieldType: this.currentField.fieldType!,
                category: this.currentField.category,
                isRequired: this.currentField.isRequired!,
                isEnabled: this.currentField.isEnabled!,
                displayOrder: this.currentField.displayOrder!,
                placeholder: this.currentField.placeholder,
                helpText: this.currentField.helpText,
                optionsJson: this.currentField.optionsJson,
                validationRulesJson: this.currentField.validationRulesJson,
                defaultValue: this.currentField.defaultValue,
                maxLength: this.currentField.maxLength,
                minLength: this.currentField.minLength
            });

            this.fieldService.onboardingFieldConfiguration_Update(updateDto).subscribe({
                next: (result: OnboardingFieldConfigurationDto) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Field configuration updated successfully'
                    });
                    this.showDialog.set(false);
                    this.loadFields();
                },
                error: (error: any) => {
                    console.error('Error updating field:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to update field configuration'
                    });
                    this.loading.set(false);
                }
            });
        } else {
            // Create new field
            const createDto = new CreateOnboardingFieldConfigurationDto({
                fieldKey: this.currentField.fieldKey!,
                fieldLabel: this.currentField.fieldLabel!,
                fieldType: this.currentField.fieldType!,
                category: this.currentField.category!,
                isRequired: this.currentField.isRequired!,
                isEnabled: this.currentField.isEnabled!,
                displayOrder: this.currentField.displayOrder!,
                placeholder: this.currentField.placeholder,
                helpText: this.currentField.helpText,
                optionsJson: this.currentField.optionsJson,
                validationRulesJson: this.currentField.validationRulesJson,
                defaultValue: this.currentField.defaultValue,
                maxLength: this.currentField.maxLength,
                minLength: this.currentField.minLength
            });

            this.fieldService.onboardingFieldConfiguration_Create(createDto).subscribe({
                next: (result: OnboardingFieldConfigurationDto) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Field configuration created successfully'
                    });
                    this.showDialog.set(false);
                    this.loadFields();
                },
                error: (error: any) => {
                    console.error('Error creating field:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: error?.error?.message || 'Failed to create field configuration'
                    });
                    this.loading.set(false);
                }
            });
        }
    }

    deleteField(field: OnboardingFieldConfigurationDto) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the field "${field.fieldLabel}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loading.set(true);
                this.fieldService.onboardingFieldConfiguration_Delete(field.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Field configuration deleted successfully'
                        });
                        this.loadFields();
                    },
                    error: (error: any) => {
                        console.error('Error deleting field:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete field configuration'
                        });
                        this.loading.set(false);
                    }
                });
            }
        });
    }

    toggleFieldEnabled(field: OnboardingFieldConfigurationDto) {
        const updateDto = new UpdateOnboardingFieldConfigurationDto({
            id: field.id,
            fieldKey: field.fieldKey || '',
            fieldLabel: field.fieldLabel || '',
            fieldType: field.fieldType || '',
            category: field.category,
            isRequired: field.isRequired,
            isEnabled: !field.isEnabled,
            displayOrder: field.displayOrder,
            placeholder: field.placeholder,
            helpText: field.helpText,
            optionsJson: field.optionsJson,
            validationRulesJson: field.validationRulesJson,
            defaultValue: field.defaultValue,
            maxLength: field.maxLength,
            minLength: field.minLength
        });

        this.fieldService.onboardingFieldConfiguration_Update(updateDto).subscribe({
            next: (result: OnboardingFieldConfigurationDto) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Field ${result.isEnabled ? 'enabled' : 'disabled'} successfully`
                });
                this.loadFields();
            },
            error: (error: any) => {
                console.error('Error toggling field:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update field status'
                });
            }
        });
    }

    toggleFieldRequired(field: OnboardingFieldConfigurationDto) {
        const updateDto = new UpdateOnboardingFieldConfigurationDto({
            id: field.id,
            fieldKey: field.fieldKey || '',
            fieldLabel: field.fieldLabel || '',
            fieldType: field.fieldType || '',
            category: field.category,
            isRequired: !field.isRequired,
            isEnabled: field.isEnabled,
            displayOrder: field.displayOrder,
            placeholder: field.placeholder,
            helpText: field.helpText,
            optionsJson: field.optionsJson,
            validationRulesJson: field.validationRulesJson,
            defaultValue: field.defaultValue,
            maxLength: field.maxLength,
            minLength: field.minLength
        });

        this.fieldService.onboardingFieldConfiguration_Update(updateDto).subscribe({
            next: (result: OnboardingFieldConfigurationDto) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Field ${result.isRequired ? 'marked as required' : 'marked as optional'}`
                });
                this.loadFields();
            },
            error: (error: any) => {
                console.error('Error toggling field required:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update field requirement'
                });
            }
        });
    }

    openInitializeDialog() {
        this.showInitializeDialog.set(true);
    }

    initializeDefaults() {
        this.loading.set(true);
        this.fieldService.onboardingFieldConfiguration_InitializeDefaults().subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Default field configurations initialized successfully'
                });
                this.showInitializeDialog.set(false);
                this.loadFields();
            },
            error: (error: any) => {
                console.error('Error initializing defaults:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error?.error?.message || 'Failed to initialize default configurations'
                });
                this.loading.set(false);
            }
        });
    }

    getFieldTypeName(fieldType: string): string {
        const type = this.fieldTypes.find(t => t.value === fieldType);
        return type ? type.label : fieldType;
    }

    getCategoryName(category: string): string {
        const cat = this.categories.find(c => c.value === category);
        return cat ? cat.label : category;
    }

    hideDialog() {
        this.showDialog.set(false);
        this.currentField = {};
    }

    hideInitializeDialog() {
        this.showInitializeDialog.set(false);
    }
}
