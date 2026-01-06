import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
    OnboardingFieldConfigurationServiceProxy,
    OnboardingFieldConfigurationDto
} from './service-proxies';

export interface DynamicFormField {
    config: OnboardingFieldConfigurationDto;
    control: FormControl;
    options?: string[];
    validationRules?: any;
}

export interface DynamicFormCategory {
    name: string;
    displayName: string;
    fields: DynamicFormField[];
}

@Injectable({
    providedIn: 'root'
})
export class DynamicFormService {
    private categoriesSubject = new BehaviorSubject<DynamicFormCategory[]>([]);
    public categories$ = this.categoriesSubject.asObservable();

    private categoryDisplayNames: { [key: string]: string } = {
        'PersonalInfo': 'Personal Information',
        'Employment': 'Employment Details',
        'EmergencyContact': 'Emergency Contact',
        'MedicalInfo': 'Medical Information'
    };

    constructor(
        private fieldService: OnboardingFieldConfigurationServiceProxy,
        private fb: FormBuilder
    ) {}

    /**
     * Load enabled field configurations and create form structure
     */
    loadFormConfiguration(): Observable<DynamicFormCategory[]> {
        return this.fieldService.onboardingFieldConfiguration_GetEnabled().pipe(
            map((fields: OnboardingFieldConfigurationDto[]) => this.buildFormStructure(fields)),
            tap((categories: DynamicFormCategory[]) => this.categoriesSubject.next(categories))
        );
    }

    /**
     * Load field configurations by category
     */
    loadCategoryConfiguration(category: string): Observable<DynamicFormCategory> {
        return this.fieldService.onboardingFieldConfiguration_GetByCategory().pipe(
            map((categoryMap: { [key: string]: OnboardingFieldConfigurationDto[] }) => {
                const fields = categoryMap[category] || [];
                const enabledFields = fields.filter((f: OnboardingFieldConfigurationDto) => f.isEnabled);
                return this.buildCategory(category, enabledFields);
            })
        );
    }

    /**
     * Build form structure from field configurations
     */
    private buildFormStructure(fields: OnboardingFieldConfigurationDto[]): DynamicFormCategory[] {
        // Group fields by category
        const grouped = fields.reduce((acc: { [key: string]: OnboardingFieldConfigurationDto[] }, field: OnboardingFieldConfigurationDto) => {
            const category = field.category || 'Other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(field);
            return acc;
        }, {} as { [key: string]: OnboardingFieldConfigurationDto[] });

        // Create categories with form controls
        const categories: DynamicFormCategory[] = [];
        for (const categoryName in grouped) {
            categories.push(this.buildCategory(categoryName, grouped[categoryName]));
        }

        return categories;
    }

    /**
     * Build a single category with its fields
     */
    private buildCategory(categoryName: string, fields: OnboardingFieldConfigurationDto[]): DynamicFormCategory {
        // Sort by display order
        const sortedFields = fields.sort((a, b) => a.displayOrder - b.displayOrder);

        const dynamicFields: DynamicFormField[] = sortedFields.map(config => {
            const validators = this.buildValidators(config);
            const control = new FormControl(config.defaultValue || '', validators);

            let options: string[] | undefined;
            if (config.optionsJson) {
                try {
                    options = JSON.parse(config.optionsJson);
                } catch (e) {
                    console.error(`Invalid options JSON for field ${config.fieldKey}:`, e);
                    options = [];
                }
            }

            let validationRules: any = {};
            if (config.validationRulesJson) {
                try {
                    validationRules = JSON.parse(config.validationRulesJson);
                } catch (e) {
                    console.error(`Invalid validation rules JSON for field ${config.fieldKey}:`, e);
                }
            }

            return {
                config,
                control,
                options,
                validationRules
            };
        });

        return {
            name: categoryName,
            displayName: this.categoryDisplayNames[categoryName] || categoryName,
            fields: dynamicFields
        };
    }

    /**
     * Build validators for a field configuration
     */
    private buildValidators(config: OnboardingFieldConfigurationDto): ValidatorFn[] {
        const validators: ValidatorFn[] = [];

        // Required validator
        if (config.isRequired) {
            validators.push(Validators.required);
        }

        // Length validators
        if (config.minLength !== undefined && config.minLength > 0) {
            validators.push(Validators.minLength(config.minLength));
        }
        if (config.maxLength !== undefined && config.maxLength > 0) {
            validators.push(Validators.maxLength(config.maxLength));
        }

        // Type-specific validators
        switch (config.fieldType) {
            case 'email':
                validators.push(Validators.email);
                break;
            case 'tel':
                validators.push(this.phoneValidator());
                break;
            case 'calculator':
            case 'repeater':
                // Calculator and repeater fields store JSON strings
                // Optional: Add custom validator for valid JSON if needed
                break;
        }

        // Custom validation rules from JSON
        if (config.validationRulesJson) {
            try {
                const rules = JSON.parse(config.validationRulesJson);
                if (rules.pattern) {
                    validators.push(Validators.pattern(rules.pattern));
                }
                if (rules.min !== undefined) {
                    validators.push(Validators.min(rules.min));
                }
                if (rules.max !== undefined) {
                    validators.push(Validators.max(rules.max));
                }
            } catch (e) {
                console.error(`Error parsing validation rules for ${config.fieldKey}:`, e);
            }
        }

        return validators;
    }

    /**
     * Phone number validator
     */
    private phoneValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }
            // Basic phone validation - adjust regex as needed for your region
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            const valid = phoneRegex.test(control.value);
            return valid ? null : { phone: { value: control.value } };
        };
    }

    /**
     * Create a FormGroup from categories
     */
    createFormGroup(categories: DynamicFormCategory[]): FormGroup {
        const group: any = {};
        
        categories.forEach(category => {
            category.fields.forEach(field => {
                const key = field.config.fieldKey || 'unknown';
                group[key] = field.control;
            });
        });

        return this.fb.group(group);
    }

    /**
     * Get error message for a field
     */
    getErrorMessage(field: DynamicFormField): string {
        const control = field.control;
        const config = field.config;

        if (control.hasError('required')) {
            return `${config.fieldLabel} is required`;
        }
        if (control.hasError('email')) {
            return 'Please enter a valid email address';
        }
        if (control.hasError('minlength')) {
            const minLength = control.getError('minlength').requiredLength;
            return `${config.fieldLabel} must be at least ${minLength} characters`;
        }
        if (control.hasError('maxlength')) {
            const maxLength = control.getError('maxlength').requiredLength;
            return `${config.fieldLabel} must not exceed ${maxLength} characters`;
        }
        if (control.hasError('pattern')) {
            // Try to get custom message from validation rules
            if (config.validationRulesJson) {
                try {
                    const rules = JSON.parse(config.validationRulesJson);
                    if (rules.message) {
                        return rules.message;
                    }
                } catch (e) {
                    // Ignore
                }
            }
            return `${config.fieldLabel} format is invalid`;
        }
        if (control.hasError('phone')) {
            return 'Please enter a valid phone number';
        }
        if (control.hasError('min')) {
            const min = control.getError('min').min;
            return `${config.fieldLabel} must be at least ${min}`;
        }
        if (control.hasError('max')) {
            const max = control.getError('max').max;
            return `${config.fieldLabel} must not exceed ${max}`;
        }

        return `${config.fieldLabel} is invalid`;
    }

    /**
     * Extract form values as key-value pairs for saving
     */
    extractFormData(formGroup: FormGroup): Array<{ fieldKey: string; fieldValue: string }> {
        const data: Array<{ fieldKey: string; fieldValue: string }> = [];
        
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            if (control && control.value !== null && control.value !== undefined && control.value !== '') {
                data.push({
                    fieldKey: key,
                    fieldValue: String(control.value)
                });
            }
        });

        return data;
    }

    /**
     * Populate form with existing data
     */
    populateForm(formGroup: FormGroup, data: Array<{ fieldKey: string; fieldValue: string }>): void {
        data.forEach(item => {
            const control = formGroup.get(item.fieldKey);
            if (control) {
                control.setValue(item.fieldValue);
            }
        });
    }
}
