import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { FormServiceProxy, FormDto, CreateFormSubmissionDto, FormSubmissionDto } from '../../core/services/service-proxies';
import { AuthService } from '../../auth/auth-service';

interface DynamicFormField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    order: number;
}

@Component({
    selector: 'app-form-widget',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './form-widget.component.html',
    styleUrls: ['./form-widget.component.scss'],
    providers: [FormServiceProxy]
})
export class FormWidgetComponent implements OnInit {
    @Input() config!: WidgetConfig;

    formDefinition: FormDto | null = null;
    fields: DynamicFormField[] = [];
    formGroup!: FormGroup;

    loading = false;
    submitting = false;
    loadError = '';
    successMessage = '';
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private formService: FormServiceProxy,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        const formId = this.config?.settings?.formId as string | undefined;
        if (!formId) {
            this.loadError = 'Form not configured for this widget.';
            return;
        }

        this.loadForm(formId);
    }

    private loadForm(id: string): void {
        this.loading = true;
        this.loadError = '';

        this.formService.form_GetById(id).subscribe({
            next: (response) => {
                const form = response.result as FormDto | undefined;
                if (!form) {
                    this.loadError = 'Form not found.';
                    this.loading = false;
                    return;
                }

                this.formDefinition = form;
                this.fields = this.parseFields(form.fields);
                this.buildForm();
                this.tryPrefillFromLatestSubmission();
                this.loading = false;
            },
            error: () => {
                this.loadError = 'Failed to load form.';
                this.loading = false;
            }
        });
    }

    private parseFields(json: string | undefined | null): DynamicFormField[] {
        if (!json) return [];

        try {
            const parsed = JSON.parse(json);
            if (!Array.isArray(parsed)) return [];

            return parsed
                .map((f: any, index: number) => ({
                    name: f.name || `field_${index}`,
                    label: f.label || f.name || `Field ${index + 1}`,
                    type: f.type || 'text',
                    required: !!f.required,
                    placeholder: f.placeholder || '',
                    options: Array.isArray(f.options)
                        ? f.options
                        : typeof f.options === 'string'
                        ? f.options.split(',').map((o: string) => o.trim()).filter((o: string) => !!o)
                        : undefined,
                    order: typeof f.order === 'number' ? f.order : index
                }))
                .sort((a, b) => a.order - b.order);
        } catch {
            return [];
        }
    }

    private buildForm(): void {
        const group: { [key: string]: any } = {};

        for (const field of this.fields) {
            const validators = [];
            if (field.required) {
                validators.push(Validators.required);
            }
            if (field.type === 'email') {
                validators.push(Validators.email);
            }

            if (field.type === 'checkbox' && field.options && field.options.length) {
                const controls = field.options.map(() => this.fb.control(false));
                group[field.name] = this.fb.array(controls, field.required ? this.atLeastOneCheckedValidator : []);
            } else {
                group[field.name] = ['', validators];
            }
        }

        this.formGroup = this.fb.group(group);
    }

    getCheckboxOptions(field: DynamicFormField): string[] {
        return field.options || [];
    }

    getCheckboxControl(field: DynamicFormField): FormArray {
        return this.formGroup.get(field.name) as FormArray;
    }

    private atLeastOneCheckedValidator(control: FormArray): { [key: string]: any } | null {
        return control.controls.some((c) => c.value) ? null : { required: true };
    }

    private tryPrefillFromLatestSubmission(): void {
        if (!this.formDefinition || !this.formDefinition.id) {
            return;
        }

        // Only attempt prefill when submissions are linked to users and the
        // form is configured to prefill, and the user is authenticated.
        if (!this.formDefinition.linkSubmissionsToUser || !this.formDefinition.prefillLastSubmissionForUser) {
            return;
        }

        if (!this.authService.isAuthenticated()) {
            return;
        }

        this.formService.formSubmission_GetLatestForCurrentUser(this.formDefinition.id).subscribe({
            next: (response) => {
                const submission = response.result as FormSubmissionDto | undefined;
                if (!submission || !submission.submissionData) {
                    return;
                }

                try {
                    const data = JSON.parse(submission.submissionData);
                    if (!data || typeof data !== 'object') {
                        return;
                    }

                    for (const field of this.fields) {
                        const value = (data as any)[field.name];
                        if (value === undefined) {
                            continue;
                        }

                        if (field.type === 'checkbox' && field.options && Array.isArray(value)) {
                            const formArray = this.getCheckboxControl(field);
                            field.options.forEach((opt, idx) => {
                                const checked = (value as any[]).includes(opt);
                                if (formArray.at(idx)) {
                                    formArray.at(idx).setValue(checked);
                                }
                            });
                        } else if (this.formGroup.get(field.name)) {
                            this.formGroup.get(field.name)!.setValue(value);
                        }
                    }
                } catch {
                    // Ignore prefill errors and leave form empty
                }
            },
            error: () => {
                // Ignore errors when attempting to prefill (e.g. no submission yet)
            }
        });
    }

    onSubmit(): void {
        this.successMessage = '';
        this.errorMessage = '';

        if (!this.formGroup || !this.formDefinition) {
            return;
        }

        if (this.formGroup.invalid) {
            this.formGroup.markAllAsTouched();
            return;
        }

        const rawValue = this.formGroup.value as any;
        const submissionPayload: any = {};

        for (const field of this.fields) {
            const value = rawValue[field.name];
            if (field.type === 'checkbox' && field.options) {
                const selected: string[] = [];
                (value as boolean[]).forEach((checked, idx) => {
                    if (checked && field.options && field.options[idx]) {
                        selected.push(field.options[idx]);
                    }
                });
                submissionPayload[field.name] = selected;
            } else {
                submissionPayload[field.name] = value;
            }
        }

        const dto = new CreateFormSubmissionDto();
        dto.formId = this.formDefinition.id!;
        dto.submissionData = JSON.stringify(submissionPayload);
        dto.ipAddress = undefined;
        dto.userAgent = window.navigator.userAgent;

        this.submitting = true;

        this.formService.formSubmission_Create(dto).subscribe({
            next: () => {
                const overrideMessage = this.config?.settings?.successMessage as string | undefined;
                this.successMessage = overrideMessage || this.formDefinition?.successMessage || 'Thank you for your submission!';
                this.errorMessage = '';
                this.submitting = false;
                this.formGroup.reset();
            },
            error: (error) => {
                const message = error?.error?.message || 'Failed to submit form. Please try again.';
                this.errorMessage = message;
                this.submitting = false;
            }
        });
    }
}
