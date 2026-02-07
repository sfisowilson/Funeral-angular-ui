import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService, ConfirmationService } from 'primeng/api';
import { OnboardingFieldDefinitionServiceProxy, CreateOnboardingFieldDefinitionDto, UpdateOnboardingFieldDefinitionDto } from '@app/core/services/service-proxies';

interface BasePremiumOption {
    planId: string;
    amount: number;
}

interface AggregationRule {
    targetFieldKey: string;
    multiplier: number;
    label: string;
}

interface CalculatorConfig {
    basePremiums: BasePremiumOption[];
    aggregations: AggregationRule[];
}

interface FieldTypeOption {
    label: string;
    value: string;
    icon: string;
}

interface FieldOption {
    value: string;
    label: string;
}

@Component({
    selector: 'app-field-definition-builder',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, TableModule, ButtonModule, DialogModule, InputTextModule, DropdownModule, InputTextarea, CheckboxModule, ToastModule, ConfirmDialogModule, InputNumberModule],
    providers: [MessageService, ConfirmationService, OnboardingFieldDefinitionServiceProxy],
    templateUrl: './field-definition-builder.component.html',
    styleUrls: ['./field-definition-builder.component.scss']
})
export class FieldDefinitionBuilderComponent implements OnInit {
    fields = signal<any[]>([]);
    loading = signal(false);

    showDialog = signal(false);
    dialogMode: 'create' | 'edit' = 'create';
    fieldForm!: FormGroup;

    fieldOptions: FieldOption[] = [];
    showOptionsEditor = signal(false);

    calculatorConfig = signal<CalculatorConfig>({ basePremiums: [], aggregations: [] });
    currentFieldType = signal<string>('text');

    repeaterFields = computed(() =>
        this.fields()
            .filter((f) => f.fieldType === 'repeater')
            .map((f) => ({
                label: f.fieldLabel,
                value: f.fieldKey
            }))
    );

    showCalculatorEditor = computed(() => this.currentFieldType() === 'calculator');

    fieldTypes: FieldTypeOption[] = [
        { label: 'Text Input', value: 'text', icon: 'pi pi-pencil' },
        { label: 'Email', value: 'email', icon: 'pi pi-envelope' },
        { label: 'Phone', value: 'tel', icon: 'pi pi-phone' },
        { label: 'Number', value: 'number', icon: 'pi pi-hashtag' },
        { label: 'Date', value: 'date', icon: 'pi pi-calendar' },
        { label: 'Dropdown', value: 'select', icon: 'pi pi-list' },
        { label: 'Radio Buttons', value: 'radio', icon: 'pi pi-circle' },
        { label: 'Checkbox', value: 'checkbox', icon: 'pi pi-check-square' },
        { label: 'Text Area', value: 'textarea', icon: 'pi pi-align-left' },
        { label: 'File Upload', value: 'file', icon: 'pi pi-upload' },
        { label: 'Premium Calculator', value: 'calculator', icon: 'pi pi-calculator' },
        { label: 'Repeater (Multiple Items)', value: 'repeater', icon: 'pi pi-th-large' }
    ];

    constructor(
        private fieldClient: OnboardingFieldDefinitionServiceProxy,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.loadFields();
    }

    initForm(): void {
        this.fieldForm = this.fb.group({
            id: [null],
            fieldKey: ['', [Validators.required, Validators.pattern(/^[a-z_]+$/)]],
            fieldLabel: ['', [Validators.required, Validators.maxLength(200)]],
            fieldType: ['text', Validators.required],
            placeholder: ['', Validators.maxLength(500)],
            helpText: ['', Validators.maxLength(1000)],
            defaultValue: ['', Validators.maxLength(200)],
            isRequired: [false],
            isEnabled: [true],
            minLength: [null],
            maxLength: [null],
            minValue: [null],
            maxValue: [null],
            pattern: [''],
            cssClass: ['', Validators.maxLength(100)],
            displayOrder: [0]
        });

        // Watch field type changes to show/hide options editor
        this.fieldForm.get('fieldType')?.valueChanges.subscribe((type) => {
            this.currentFieldType.set(type);
            this.showOptionsEditor.set(['select', 'radio'].includes(type));
            if (this.showOptionsEditor()) {
                this.loadOptionsFromForm();
            }
        });
    }

    loadFields(): void {
        this.loading.set(true);
        this.fieldClient.onboardingFieldDefinition_GetAll().subscribe({
            next: (response: any) => {
                const fields = response.result || [];
                this.fields.set(fields);
                this.loading.set(false);
            },
            error: (error: any) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load field definitions'
                });
                this.loading.set(false);
            }
        });
    }

    openCreateDialog(): void {
        this.dialogMode = 'create';
        this.fieldForm.reset({
            fieldType: 'text',
            isRequired: false,
            isEnabled: true,
            displayOrder: 0
        });
        this.fieldOptions = [];
        this.calculatorConfig.set({ basePremiums: [], aggregations: [] });
        this.currentFieldType.set('text');
        this.showDialog.set(true);
    }

    openEditDialog(field: any): void {
        this.dialogMode = 'edit';

        // Parse validation rules JSON
        const validationRules = this.parseValidationRules(field.validationRules);

        this.fieldForm.patchValue({
            id: field.id,
            fieldKey: field.fieldKey,
            fieldLabel: field.fieldLabel,
            fieldType: field.fieldType,
            placeholder: field.placeholder,
            helpText: field.helpText,
            defaultValue: field.defaultValue,
            isRequired: field.isRequired,
            isEnabled: field.isEnabled,
            minLength: validationRules.minLength,
            maxLength: validationRules.maxLength,
            minValue: validationRules.minValue,
            maxValue: validationRules.maxValue,
            pattern: validationRules.pattern,
            cssClass: field.cssClass,
            displayOrder: field.displayOrder
        });

        // Parse options JSON based on type
        this.parseFieldOptions(field.options);

        // Ensure current field type is set (in case patchValue didn't trigger properly or order matters)
        this.currentFieldType.set(field.fieldType);

        this.showDialog.set(true);
    }

    saveField(): void {
        if (this.fieldForm.invalid) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields correctly'
            });
            return;
        }

        const formValue = this.fieldForm.value;

        // Build validation rules JSON
        const validationRules = this.buildValidationRules(formValue);

        // Build options JSON
        let options: string | undefined;
        if (this.showCalculatorEditor()) {
            const config = this.calculatorConfig();
            const widgetConfig = {
                title: 'Premium Calculator',
                autoCalculate: true,
                showBreakdown: true,
                basePremiumOptions: config.basePremiums.map((p) => ({
                    planId: p.planId,
                    label: p.planId,
                    value: p.amount,
                    coverAmount: 0 // Optional default
                })),
                aggregations: config.aggregations.map((a) => ({
                    collectionKey: a.targetFieldKey, // Map targetFieldKey to collectionKey
                    targetFieldKey: a.targetFieldKey, // Keep for reference if needed
                    fieldKey: 'id', // Default for counting objects
                    operation: 'count',
                    multiplier: a.multiplier,
                    label: a.label
                }))
            };
            options = JSON.stringify(widgetConfig);
        } else if (this.showOptionsEditor() && this.fieldOptions.length > 0) {
            options = JSON.stringify(this.fieldOptions);
        }

        if (this.dialogMode === 'create') {
            const dto = new CreateOnboardingFieldDefinitionDto({
                tenantId: '00000000-0000-0000-0000-000000000000', // Will be set by backend
                fieldKey: formValue.fieldKey,
                fieldLabel: formValue.fieldLabel,
                fieldType: formValue.fieldType,
                placeholder: formValue.placeholder,
                helpText: formValue.helpText,
                defaultValue: formValue.defaultValue,
                isRequired: formValue.isRequired,
                isEnabled: formValue.isEnabled,
                validationRules: validationRules || undefined,
                options: options,
                cssClass: formValue.cssClass,
                displayOrder: formValue.displayOrder,
                icon: undefined,
                minValue: undefined,
                maxValue: undefined,
                maxLength: undefined,
                isUnique: false,
                conditionalDisplay: formValue.conditionalDisplay
            });

            this.fieldClient.onboardingFieldDefinition_Create(dto).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Field definition created successfully'
                    });
                    this.showDialog.set(false);
                    this.loadFields();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to create field definition'
                    });
                }
            });
        } else {
            const dto = new UpdateOnboardingFieldDefinitionDto({
                id: formValue.id,
                fieldKey: formValue.fieldKey,
                fieldLabel: formValue.fieldLabel,
                fieldType: formValue.fieldType,
                placeholder: formValue.placeholder,
                helpText: formValue.helpText,
                defaultValue: formValue.defaultValue,
                isRequired: formValue.isRequired,
                isEnabled: formValue.isEnabled,
                validationRules: validationRules || undefined,
                options: options,
                cssClass: formValue.cssClass,
                displayOrder: formValue.displayOrder,
                icon: undefined,
                minValue: undefined,
                maxValue: undefined,
                maxLength: undefined,
                isUnique: false,
                conditionalDisplay: formValue.conditionalDisplay
            });

            this.fieldClient.onboardingFieldDefinition_Update(dto).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Field definition updated successfully'
                    });
                    this.showDialog.set(false);
                    this.loadFields();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to update field definition'
                    });
                }
            });
        }
    }

    deleteField(field: any): void {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete the field "${field.fieldLabel}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.fieldClient.onboardingFieldDefinition_Delete(field.id!).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Field definition deleted successfully'
                        });
                        this.loadFields();
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete field definition'
                        });
                    }
                });
            }
        });
    }

    parseFieldOptions(optionsJson: string | undefined): void {
        if (!optionsJson) {
            this.fieldOptions = [];
            this.calculatorConfig.set({ basePremiums: [], aggregations: [] });
            return;
        }

        try {
            const parsed = JSON.parse(optionsJson);
            const fieldType = this.fieldForm?.get('fieldType')?.value;

            if (fieldType === 'calculator') {
                let config: CalculatorConfig = { basePremiums: [], aggregations: [] };

                // Check if using Widget structure (has basePremiumOptions or collectionKey in aggregations)
                const isWidgetFormat = Array.isArray(parsed.basePremiumOptions) || (Array.isArray(parsed.aggregations) && parsed.aggregations.length > 0 && 'collectionKey' in parsed.aggregations[0]);

                if (isWidgetFormat) {
                    config = {
                        basePremiums: Array.isArray(parsed.basePremiumOptions)
                            ? parsed.basePremiumOptions.map((p: any) => ({
                                  planId: p.planId || p.label,
                                  amount: p.value
                              }))
                            : [],
                        aggregations: Array.isArray(parsed.aggregations)
                            ? parsed.aggregations.map((a: any) => ({
                                  targetFieldKey: a.collectionKey || a.targetFieldKey,
                                  multiplier: a.multiplier,
                                  label: a.label
                              }))
                            : []
                    };
                } else {
                    // Fallback to direct mapping for legacy config
                    config = {
                        basePremiums: Array.isArray(parsed.basePremiums) ? parsed.basePremiums : [],
                        aggregations: Array.isArray(parsed.aggregations) ? parsed.aggregations : []
                    };
                }

                this.calculatorConfig.set(config);
                this.fieldOptions = [];
            } else {
                this.fieldOptions = Array.isArray(parsed) ? parsed : [];
                this.calculatorConfig.set({ basePremiums: [], aggregations: [] });
            }
        } catch {
            this.fieldOptions = [];
            this.calculatorConfig.set({ basePremiums: [], aggregations: [] });
        }
    }

    addBaseOption(): void {
        this.calculatorConfig.update((config) => ({
            ...config,
            basePremiums: [...config.basePremiums, { planId: '', amount: 0 }]
        }));
    }

    removeBaseOption(index: number): void {
        this.calculatorConfig.update((config) => ({
            ...config,
            basePremiums: config.basePremiums.filter((_, i) => i !== index)
        }));
    }

    addAggregation(): void {
        this.calculatorConfig.update((config) => ({
            ...config,
            aggregations: [...config.aggregations, { targetFieldKey: '', multiplier: 0, label: '' }]
        }));
    }

    removeAggregation(index: number): void {
        this.calculatorConfig.update((config) => ({
            ...config,
            aggregations: config.aggregations.filter((_, i) => i !== index)
        }));
    }

    // Options Management
    addOption(): void {
        this.fieldOptions.push({ value: '', label: '' });
    }

    removeOption(index: number): void {
        this.fieldOptions.splice(index, 1);
    }

    private loadOptionsFromForm(): void {
        // Keep existing options when switching to select/radio
    }

    private parseValidationRules(rulesJson?: string | null): any {
        if (!rulesJson) return {};
        try {
            return JSON.parse(rulesJson);
        } catch {
            return {};
        }
    }

    private buildValidationRules(formValue: any): string | null {
        const rules: any = {};

        if (formValue.minLength) rules.minLength = formValue.minLength;
        if (formValue.maxLength) rules.maxLength = formValue.maxLength;
        if (formValue.minValue) rules.minValue = formValue.minValue;
        if (formValue.maxValue) rules.maxValue = formValue.maxValue;
        if (formValue.pattern) rules.pattern = formValue.pattern;

        return Object.keys(rules).length > 0 ? JSON.stringify(rules) : null;
    }

    getFieldTypeLabel(type: string): string {
        return this.fieldTypes.find((t) => t.value === type)?.label || type;
    }

    getFieldTypeIcon(type: string): string {
        return this.fieldTypes.find((t) => t.value === type)?.icon || 'pi pi-question';
    }
}
