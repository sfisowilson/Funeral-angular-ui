import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
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

interface ValidationRule {
    type: string;
    value?: any;
    message?: string;
}

@Component({
    selector: 'app-registration-fields',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ToastModule,
        ButtonModule,
        TableModule,
        DialogModule,
        InputTextModule,
        DropdownModule,
        CheckboxModule,
        InputNumberModule
    ],
    providers: [MessageService, OnboardingFieldConfigurationServiceProxy],
    templateUrl: './registration-fields.component.html',
    styleUrl: './registration-fields.component.scss'
})
export class RegistrationFieldsComponent implements OnInit {
    fields: OnboardingFieldConfigurationDto[] = [];
    loading: boolean = false;
    
    // Dialog state
    displayDialog: boolean = false;
    isEditMode: boolean = false;
    selectedField: OnboardingFieldConfigurationDto | null = null;
    
    // Form data - using any to avoid class instantiation issues
    fieldForm: any = {
        fieldKey: '',
        fieldLabel: '',
        fieldType: 'text',
        category: undefined,
        isRequired: false,
        isEnabled: true,
        displayOrder: 0,
        fieldContext: 'Registration',
        placeholder: undefined,
        helpText: undefined,
        optionsJson: undefined,
        validationRulesJson: undefined,
        defaultValue: undefined,
        maxLength: undefined,
        minLength: undefined
    };
    
    // Field type options
    fieldTypes: FieldTypeOption[] = [
        { label: 'Text', value: 'text' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'tel' },
        { label: 'Number', value: 'number' },
        { label: 'Date', value: 'date' },
        { label: 'Dropdown', value: 'dropdown' },
        { label: 'Radio', value: 'radio' },
        { label: 'Checkbox', value: 'checkbox' },
        { label: 'Textarea', value: 'textarea' },
        { label: 'File', value: 'file' },
        { label: 'Premium Calculator', value: 'calculator' },
        { label: 'Repeater (Multiple Items)', value: 'repeater' },
        { label: 'File Upload (Multiple)', value: 'fileupload' }
    ];

    constructor(
        private fieldService: OnboardingFieldConfigurationServiceProxy,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadFields();
    }

    loadFields(): void {
        this.loading = true;
        this.fieldService.onboardingFieldConfiguration_GetEnabledByContext('Registration').subscribe({
            next: (fields) => {
                this.fields = fields.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
                this.loading = false;
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load registration fields: ' + (error?.error?.message || error?.message || 'Unknown error'),
                    life: 5000
                });
                this.loading = false;
            }
        });
    }

    openNewDialog(): void {
        this.isEditMode = false;
        this.selectedField = null;
        this.fieldForm = {
            fieldKey: '',
            fieldLabel: '',
            fieldType: 'text',
            category: undefined,
            isRequired: false,
            isEnabled: true,
            displayOrder: this.fields.length + 1,
            fieldContext: 'Registration',
            placeholder: undefined,
            helpText: undefined,
            optionsJson: undefined,
            validationRulesJson: undefined,
            defaultValue: undefined,
            maxLength: undefined,
            minLength: undefined
        };
        this.displayDialog = true;
    }

    openEditDialog(field: OnboardingFieldConfigurationDto): void {
        this.isEditMode = true;
        this.selectedField = field;
        this.fieldForm = {
            id: field.id,
            fieldKey: field.fieldKey || '',
            fieldLabel: field.fieldLabel || '',
            fieldType: field.fieldType || 'text',
            category: field.category,
            isRequired: field.isRequired || false,
            isEnabled: field.isEnabled || true,
            displayOrder: field.displayOrder || 0,
            fieldContext: field.fieldContext || 'Registration',
            placeholder: field.placeholder,
            helpText: field.helpText,
            optionsJson: field.optionsJson,
            validationRulesJson: field.validationRulesJson,
            defaultValue: field.defaultValue,
            maxLength: field.maxLength,
            minLength: field.minLength
        };
        this.displayDialog = true;
    }

    saveField(): void {
        if (!this.fieldForm.fieldKey || !this.fieldForm.fieldLabel) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Field key and label are required',
                life: 3000
            });
            return;
        }

        this.loading = true;

        if (this.isEditMode && (this.fieldForm as any).id) {
            // Update existing field
            const updateDto = new UpdateOnboardingFieldConfigurationDto(this.fieldForm as any);
            this.fieldService.onboardingFieldConfiguration_Update(updateDto).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Registration field updated successfully',
                        life: 3000
                    });
                    this.displayDialog = false;
                    this.loadFields();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to update field: ' + (error?.error?.message || error?.message || 'Unknown error'),
                        life: 5000
                    });
                    this.loading = false;
                }
            });
        } else {
            // Create new field
            const createDto = new CreateOnboardingFieldConfigurationDto(this.fieldForm as any);
            this.fieldService.onboardingFieldConfiguration_Create(createDto).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Registration field created successfully',
                        life: 3000
                    });
                    this.displayDialog = false;
                    this.loadFields();
                },
                error: (error) => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to create field: ' + (error?.error?.message || error?.message || 'Unknown error'),
                        life: 5000
                    });
                    this.loading = false;
                }
            });
        }
    }

    deleteField(field: OnboardingFieldConfigurationDto): void {
        if (!confirm(`Are you sure you want to delete the field "${field.fieldLabel}"?`)) {
            return;
        }

        this.loading = true;
        this.fieldService.onboardingFieldConfiguration_Delete(field.id!).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Registration field deleted successfully',
                    life: 3000
                });
                this.loadFields();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete field: ' + (error?.error?.message || error?.message || 'Unknown error'),
                    life: 5000
                });
                this.loading = false;
            }
        });
    }

    toggleFieldEnabled(field: OnboardingFieldConfigurationDto): void {
        const updateDto = new UpdateOnboardingFieldConfigurationDto({
            id: field.id,
            fieldKey: field.fieldKey || '',
            fieldLabel: field.fieldLabel || '',
            fieldType: field.fieldType || 'text',
            category: field.category,
            isRequired: field.isRequired || false,
            isEnabled: !field.isEnabled,
            displayOrder: field.displayOrder || 0,
            fieldContext: field.fieldContext || 'Registration',
            placeholder: field.placeholder,
            helpText: field.helpText,
            optionsJson: field.optionsJson,
            validationRulesJson: field.validationRulesJson,
            defaultValue: field.defaultValue,
            maxLength: field.maxLength,
            minLength: field.minLength
        });

        this.fieldService.onboardingFieldConfiguration_Update(updateDto).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Field ${updateDto.isEnabled ? 'enabled' : 'disabled'} successfully`,
                    life: 3000
                });
                this.loadFields();
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to update field: ' + (error?.error?.message || error?.message || 'Unknown error'),
                    life: 5000
                });
            }
        });
    }

    moveFieldUp(field: OnboardingFieldConfigurationDto): void {
        const currentIndex = this.fields.findIndex(f => f.id === field.id);
        if (currentIndex > 0) {
            const previousField = this.fields[currentIndex - 1];
            this.swapDisplayOrder(field, previousField);
        }
    }

    moveFieldDown(field: OnboardingFieldConfigurationDto): void {
        const currentIndex = this.fields.findIndex(f => f.id === field.id);
        if (currentIndex < this.fields.length - 1) {
            const nextField = this.fields[currentIndex + 1];
            this.swapDisplayOrder(field, nextField);
        }
    }

    private swapDisplayOrder(field1: OnboardingFieldConfigurationDto, field2: OnboardingFieldConfigurationDto): void {
        const temp = field1.displayOrder;
        
        // Update field1
        const updateDto1 = new UpdateOnboardingFieldConfigurationDto({
            id: field1.id,
            fieldKey: field1.fieldKey || '',
            fieldLabel: field1.fieldLabel || '',
            fieldType: field1.fieldType || 'text',
            category: field1.category,
            isRequired: field1.isRequired || false,
            isEnabled: field1.isEnabled || true,
            displayOrder: field2.displayOrder || 0,
            fieldContext: field1.fieldContext || 'Registration',
            placeholder: field1.placeholder,
            helpText: field1.helpText,
            optionsJson: field1.optionsJson,
            validationRulesJson: field1.validationRulesJson,
            defaultValue: field1.defaultValue,
            maxLength: field1.maxLength,
            minLength: field1.minLength
        });

        // Update field2
        const updateDto2 = new UpdateOnboardingFieldConfigurationDto({
            id: field2.id,
            fieldKey: field2.fieldKey || '',
            fieldLabel: field2.fieldLabel || '',
            fieldType: field2.fieldType || 'text',
            category: field2.category,
            isRequired: field2.isRequired || false,
            isEnabled: field2.isEnabled || true,
            displayOrder: temp || 0,
            fieldContext: field2.fieldContext || 'Registration',
            placeholder: field2.placeholder,
            helpText: field2.helpText,
            optionsJson: field2.optionsJson,
            validationRulesJson: field2.validationRulesJson,
            defaultValue: field2.defaultValue,
            maxLength: field2.maxLength,
            minLength: field2.minLength
        });

        this.loading = true;
        
        // Update both fields
        this.fieldService.onboardingFieldConfiguration_Update(updateDto1).subscribe({
            next: () => {
                this.fieldService.onboardingFieldConfiguration_Update(updateDto2).subscribe({
                    next: () => {
                        this.loadFields();
                    },
                    error: (error) => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to reorder fields',
                            life: 5000
                        });
                        this.loading = false;
                    }
                });
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to reorder fields',
                    life: 5000
                });
                this.loading = false;
            }
        });
    }

    hideDialog(): void {
        this.displayDialog = false;
        this.selectedField = null;
    }

    getFieldTypeLabel(type: string | undefined): string {
        const fieldType = this.fieldTypes.find(ft => ft.value === type);
        return fieldType ? fieldType.label : type || 'Unknown';
    }
}
