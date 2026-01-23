import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { FormDto, FormServiceProxy, CreateFormSubmissionDto, TermsAndConditionsDto, TermsServiceProxy, FormSubmissionDto } from '../../core/services/service-proxies';
import { AuthService } from '../../auth/auth-service';

interface StepConfig {
    id: string;
    type: 'form' | 'terms';
    title: string;
    formId?: string;
}

interface DynamicFormField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    order: number;
}

interface StepRuntime {
    config: StepConfig;
    formDefinition?: FormDto | null;
    fields?: DynamicFormField[];
    formGroup?: FormGroup;
    loading?: boolean;
    loadError?: string;
    submitting?: boolean;
    submitted?: boolean;
    terms?: TermsAndConditionsDto | null;
    acceptedTerms?: boolean;
    readonlyPrefilled?: boolean;
}

@Component({
    selector: 'app-stepper-form-widget',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './stepper-form-widget.component.html',
    styleUrls: ['./stepper-form-widget.component.scss'],
    providers: [FormServiceProxy, TermsServiceProxy]
})
export class StepperFormWidgetComponent implements OnInit {
    @Input() config!: WidgetConfig;

    steps: StepRuntime[] = [];
    currentStepIndex = 0;

    overallSubmitting = false;
    completed = false;
    globalError = '';
    globalSuccess = '';

    // Optional completion PDF & signature
    enableCompletionPdf = false;
    completionPdfMode: 'system' | 'custom' = 'system';
    requireSignature = false;
    signatureDataUrl: string | null = null;
    isDrawing = false;
    completionPdfUrl: string | null = null;

    constructor(
        private fb: FormBuilder,
        private formService: FormServiceProxy,
        private termsService: TermsServiceProxy,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        const settings = this.config?.settings || {};
        const rawSteps = (settings.steps || []) as StepConfig[];

        this.enableCompletionPdf = settings.enableCompletionPdf === true;
        this.completionPdfMode = (settings.completionPdfMode as 'system' | 'custom') || 'system';
        this.requireSignature = settings.requireSignature === true;
        this.completionPdfUrl = settings.completionPdfUrl || null;

        this.steps = (rawSteps || []).map((s, index) => ({
            config: {
                id: s.id || this.generateId(index),
                type: s.type,
                title: s.title || `Step ${index + 1}`,
                formId: s.formId
            },
            loading: false,
            loadError: '',
            submitted: false,
            submitting: false,
            terms: null,
            acceptedTerms: false,
            readonlyPrefilled: false
        }));

        if (this.steps.length > 0) {
            this.ensureStepInitialized(0);
        }
    }

    get hasSteps(): boolean {
        return this.steps && this.steps.length > 0;
    }

    get currentStep(): StepRuntime | null {
        if (!this.hasSteps) return null;
        return this.steps[this.currentStepIndex] ?? null;
    }

    get isLastStep(): boolean {
        return this.hasSteps && this.currentStepIndex === this.steps.length - 1;
    }

    private generateId(index: number): string {
        return 'step-' + index + '-' + Math.random().toString(36).substring(2, 9);
    }

    private ensureStepInitialized(index: number): void {
        const step = this.steps[index];
        if (!step) return;

        if (step.config.type === 'form') {
            if (!step.formDefinition && step.config.formId) {
                this.loadFormForStep(step, step.config.formId);
            }
        } else if (step.config.type === 'terms') {
            if (!step.terms) {
                this.loadTermsForStep(step);
            }
        }
    }

    private loadFormForStep(step: StepRuntime, formId: string): void {
        step.loading = true;
        step.loadError = '';

        this.formService.form_GetById(formId).subscribe({
            next: (response) => {
                const form = response.result as FormDto | undefined;
                if (!form) {
                    step.loadError = 'Form not found.';
                    step.loading = false;
                    return;
                }

                step.formDefinition = form;
                step.fields = this.parseFields(form.fields);
                step.formGroup = this.buildForm(step.fields);
                this.tryPrefillFromLatestSubmission(step);
                step.loading = false;
            },
            error: () => {
                step.loadError = 'Failed to load form.';
                step.loading = false;
            }
        });
    }

    private loadTermsForStep(step: StepRuntime): void {
        step.loading = true;
        step.loadError = '';

        this.termsService.terms_GetActive().subscribe({
            next: (response) => {
                step.terms = (response.result as TermsAndConditionsDto) || null;
                step.loading = false;
            },
            error: () => {
                step.loadError = 'Failed to load terms and conditions.';
                step.loading = false;
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

    private buildForm(fields: DynamicFormField[]): FormGroup {
        const group: { [key: string]: any } = {};

        for (const field of fields) {
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

        return this.fb.group(group);
    }

    getCheckboxOptions(field: DynamicFormField): string[] {
        return field.options || [];
    }

    getCheckboxControl(step: StepRuntime, field: DynamicFormField): FormArray | null {
        if (!step.formGroup) return null;
        return step.formGroup.get(field.name) as FormArray;
    }

    private atLeastOneCheckedValidator(control: FormArray): { [key: string]: any } | null {
        return control.controls.some((c) => c.value) ? null : { required: true };
    }

    private tryPrefillFromLatestSubmission(step: StepRuntime): void {
        if (!step.formDefinition || !step.formDefinition.id || !step.formGroup) {
            return;
        }

        // Only attempt prefill when submissions are linked to users and the
        // form is configured to prefill, and the user is authenticated.
        if (!step.formDefinition.linkSubmissionsToUser || !step.formDefinition.prefillLastSubmissionForUser) {
            return;
        }

        if (!this.authService.isAuthenticated()) {
            return;
        }

        this.formService.formSubmission_GetLatestForCurrentUser(step.formDefinition.id).subscribe({
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

                    for (const field of step.fields || []) {
                        const value = (data as any)[field.name];
                        if (value === undefined) {
                            continue;
                        }

                        if (field.type === 'checkbox' && field.options && Array.isArray(value)) {
                            const formArray = this.getCheckboxControl(step, field);
                            if (!formArray) continue;
                            field.options.forEach((opt, idx) => {
                                const checked = (value as any[]).includes(opt);
                                if (formArray.at(idx)) {
                                    formArray.at(idx).setValue(checked);
                                }
                            });
                        } else if (step.formGroup.get(field.name)) {
                            step.formGroup.get(field.name)!.setValue(value);
                        }
                    }

                    // If this form is configured as single-submission and
                    // not editable, treat this step as already completed
                    // and make the form read-only so the user can move on
                    // without resubmitting.
                    if (!step.formDefinition.allowMultipleSubmissionsPerUser && !step.formDefinition.allowUserToEditSubmission) {
                        step.submitted = true;
                        step.readonlyPrefilled = true;
                        step.formGroup.disable({ emitEvent: false });
                    }
                } catch {
                    // Ignore prefill errors and leave form as-is
                }
            },
            error: () => {
                // Ignore errors when attempting to prefill (e.g. no submission yet)
            }
        });
    }

    // Basic signature drawing support for optional completion signature
    startDrawing(event: MouseEvent): void {
        if (!this.requireSignature || !this.completed) return;

        const canvas = event.target as HTMLCanvasElement | null;
        if (!canvas) return;

        this.isDrawing = true;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    draw(event: MouseEvent): void {
        if (!this.isDrawing || !this.requireSignature || !this.completed) return;

        const canvas = event.target as HTMLCanvasElement | null;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        ctx.lineTo(x, y);
        ctx.stroke();
    }

    stopDrawing(event?: MouseEvent): void {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        const canvas = event ? (event.target as HTMLCanvasElement | null) : null;
        if (canvas) {
            this.signatureDataUrl = canvas.toDataURL('image/png');
        }
    }

    clearSignature(canvas: HTMLCanvasElement): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.signatureDataUrl = null;
    }

    goToStep(index: number): void {
        if (index < 0 || index >= this.steps.length) return;
        this.currentStepIndex = index;
        this.ensureStepInitialized(index);
    }

    prev(): void {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.ensureStepInitialized(this.currentStepIndex);
        }
    }

    next(): void {
        this.globalError = '';

        const step = this.currentStep;
        if (!step) return;

        if (step.config.type === 'form') {
            this.handleFormStepNext(step);
        } else if (step.config.type === 'terms') {
            this.handleTermsStepNext(step);
        }
    }

    private handleFormStepNext(step: StepRuntime): void {
        if (!step.formGroup || !step.formDefinition) {
            this.globalError = 'Form step is not ready yet. Please try again.';
            return;
        }

        if (step.formGroup.invalid) {
            step.formGroup.markAllAsTouched();
            this.globalError = 'Please complete the required fields before continuing.';
            return;
        }

        if (step.submitted) {
            this.advanceFromCurrentStep();
            return;
        }

        const rawValue = step.formGroup.value as any;
        const submissionPayload: any = {};

        for (const field of step.fields || []) {
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
        dto.formId = step.formDefinition.id!;
        dto.submissionData = JSON.stringify(submissionPayload);
        dto.ipAddress = undefined;
        dto.userAgent = window.navigator.userAgent;

        step.submitting = true;

        this.formService.formSubmission_Create(dto).subscribe({
            next: () => {
                step.submitting = false;
                step.submitted = true;
                this.advanceFromCurrentStep();
            },
            error: (error) => {
                step.submitting = false;
                const message = error?.error?.message || 'Failed to submit this step. Please try again.';
                this.globalError = message;
            }
        });
    }

    private handleTermsStepNext(step: StepRuntime): void {
        if (!step.acceptedTerms) {
            this.globalError = 'You must accept the terms and conditions to continue.';
            return;
        }

        this.advanceFromCurrentStep();
    }

    private advanceFromCurrentStep(): void {
        if (this.isLastStep) {
            this.completed = true;
            this.globalSuccess = this.config?.settings?.successMessage || 'Thank you for completing all steps.';
        } else {
            this.currentStepIndex++;
            this.ensureStepInitialized(this.currentStepIndex);
        }
    }
}
