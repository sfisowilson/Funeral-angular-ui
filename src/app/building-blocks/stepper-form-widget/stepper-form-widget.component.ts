import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { FormDto, FormServiceProxy, CreateFormSubmissionDto, TermsAndConditionsDto, TermsServiceProxy, FormSubmissionDto } from '../../core/services/service-proxies';
import { PublicFormService } from '../../core/services/public-form.service';
import { AuthService } from '../../auth/auth-service';
import { saIdNumberValidator } from '../../shared/validators/sa-id-number.validator';

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

    // Calculator configuration and state for this step's form (if any)
    calculatorEnabled?: boolean;
    calculatorLabel?: string;
    calculatorDisplayMode?: 'inline' | 'side-panel';
    calculatorAudience?: 'public' | 'authenticated';
    calculatorStoreMode?: 'none' | 'attach-to-submission';
    calculatorResultKey?: string;
    calculatorValue?: number | null;
    calculatorError?: string;
    calculatorConfig?: any | null;
    calculatorVars?: Record<string, any>;
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

    @Output() currentStepChanged = new EventEmitter<{ index: number; stepId: string }>();
    @Output() stepCompleted = new EventEmitter<{ index: number; stepId: string }>();
    @Output() flowCompleted = new EventEmitter<void>();
    @Output() signedAndCompleted = new EventEmitter<{ signatureDataUrl: string | null }>();

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

    // Final sign-off state for flows that require a completion signature
    isSigning = false;
    hasSigned = false;

    constructor(
        private fb: FormBuilder,
        private formService: FormServiceProxy,
        private publicFormService: PublicFormService,
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
            this.emitCurrentStepChanged();
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

    private emitCurrentStepChanged(): void {
        const step = this.currentStep;
        if (!step) return;
        this.currentStepChanged.emit({ index: this.currentStepIndex, stepId: step.config.id });
    }

    private emitStepCompleted(index: number): void {
        const step = this.steps[index];
        if (!step) return;
        this.stepCompleted.emit({ index, stepId: step.config.id });
    }

    private loadFormForStep(step: StepRuntime, formId: string): void {
        step.loading = true;
        step.loadError = '';

        this.publicFormService.getFormById(formId).subscribe({
            next: (form) => {
                if (!form) {
                    step.loadError = 'Form not found.';
                    step.loading = false;
                    return;
                }

                step.formDefinition = form;
                step.fields = this.parseFields(form.fields);
                step.formGroup = this.buildForm(step.fields);
                this.setupCalculatorFromConfig(step, form);
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
                          ? f.options
                                .split(',')
                                .map((o: string) => o.trim())
                                .filter((o: string) => !!o)
                          : undefined,
                    order: typeof f.order === 'number' ? f.order : index
                }))
                .sort((a, b) => a.order - b.order);
        } catch {
            return [];
        }
    }

    private setupCalculatorFromConfig(step: StepRuntime, formWithConfig: FormDto): void {
        const configJson: string | undefined = formWithConfig.calculatorConfig;
        step.calculatorEnabled = false;
        step.calculatorConfig = null;
        step.calculatorValue = null;
        step.calculatorError = '';
        step.calculatorVars = {};

        if (!step.formGroup || !configJson) {
            return;
        }

        try {
            const cfg = JSON.parse(configJson);
            if (!cfg || typeof cfg !== 'object' || !cfg.enabled || !cfg.formula) {
                return;
            }

            step.calculatorConfig = cfg;
            step.calculatorEnabled = true;
            step.calculatorLabel = cfg.expressionLabel || 'Calculated Result';
            step.calculatorDisplayMode = cfg.displayMode === 'inline' ? 'inline' : 'side-panel';
            step.calculatorAudience = cfg.audience === 'authenticated' ? 'authenticated' : 'public';
            step.calculatorStoreMode = cfg.storeMode === 'attach-to-submission' ? 'attach-to-submission' : 'none';
            step.calculatorResultKey = cfg.resultKey || 'calculatorResult';

            // Respect audience visibility
            if (step.calculatorAudience === 'authenticated' && !this.authService.isAuthenticated()) {
                step.calculatorEnabled = false;
                step.calculatorConfig = null;
                return;
            }

            step.formGroup.valueChanges.subscribe(() => {
                this.evaluateCalculatorForStep(step);
            });
            this.evaluateCalculatorForStep(step);
        } catch {
            step.calculatorEnabled = false;
            step.calculatorConfig = null;
        }
    }

    private evaluateCalculatorForStep(step: StepRuntime): void {
        if (!step.formGroup || !step.calculatorConfig || !step.calculatorConfig.formula) {
            return;
        }

        const values = step.formGroup.value as Record<string, any>;
        try {
            const vars = this.buildCalculatorVariables(values, step.calculatorConfig);
            step.calculatorVars = vars;
            const result = this.evaluateExpression(step.calculatorConfig.formula as string, vars);
            step.calculatorValue = result;
            step.calculatorError = '';
        } catch {
            step.calculatorValue = null;
            step.calculatorError = 'Unable to calculate result. Please check the formula and field values.';
        }
    }

    private buildCalculatorVariables(values: Record<string, any>, config: any): Record<string, any> {
        const vars: Record<string, any> = { ...values };

        if (!Array.isArray(config.variables)) {
            return vars;
        }

        for (const v of config.variables as any[]) {
            if (!v || !v.name) {
                continue;
            }

            try {
                if (v.type === 'field' && v.fieldName) {
                    vars[v.name] = values[v.fieldName];
                } else if (v.type === 'aggregate' && v.fieldName) {
                    vars[v.name] = this.evaluateAggregateVariable(v, values[v.fieldName]);
                } else if (v.type === 'lookup') {
                    vars[v.name] = this.evaluateLookupVariable(v, values);
                }
            } catch {
                // Leave variable undefined if it cannot be evaluated
            }
        }

        return vars;
    }

    private evaluateAggregateVariable(variable: any, rawValue: any): number {
        const mode: string = variable.aggregateMode || 'sum';

        if (Array.isArray(rawValue)) {
            if (mode === 'count') {
                return rawValue.filter((x) => !!x).length;
            }

            const numbers: number[] = rawValue.map((x) => (typeof x === 'number' ? x : parseFloat(x))).filter((n) => !isNaN(n));

            if (!numbers.length) {
                return 0;
            }

            const sum = numbers.reduce((acc, n) => acc + n, 0);
            if (mode === 'avg') {
                return sum / numbers.length;
            }
            return sum;
        }

        if (mode === 'count') {
            return rawValue == null ? 0 : 1;
        }

        const num = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
        return isNaN(num) ? 0 : num;
    }

    private evaluateLookupVariable(variable: any, values: Record<string, any>): number {
        const rules: any[] | undefined = variable.lookupRules;
        if (!Array.isArray(rules) || !rules.length) {
            throw new Error('No lookup rules');
        }

        for (const rule of rules) {
            const conditions: any[] = Array.isArray(rule.conditions) ? rule.conditions : [];
            let matches = true;

            for (const c of conditions) {
                const fieldName: string | undefined = c.field;
                if (!fieldName) {
                    continue;
                }
                const raw = values[fieldName];
                if (!this.lookupConditionMatches(c, raw)) {
                    matches = false;
                    break;
                }
            }

            if (matches) {
                const res = typeof rule.result === 'number' ? rule.result : parseFloat(rule.result);
                if (!isNaN(res)) {
                    return res;
                }
            }
        }

        throw new Error('No matching lookup rule');
    }

    private lookupConditionMatches(cond: any, raw: any): boolean {
        const op: string = cond.operator || 'eq';

        if (op === 'between') {
            const min = parseFloat(cond.min);
            const max = parseFloat(cond.max);
            const val = typeof raw === 'number' ? raw : parseFloat(raw);
            if (isNaN(val) || isNaN(min) || isNaN(max)) {
                return false;
            }
            return val >= min && val <= max;
        }

        const valueStr: string = cond.value ?? '';
        const rawNum = typeof raw === 'number' ? raw : parseFloat(raw);
        const valNum = parseFloat(valueStr);
        const bothNumeric = !isNaN(rawNum) && !isNaN(valNum);

        const left: any = bothNumeric ? rawNum : raw;
        const right: any = bothNumeric ? valNum : valueStr;

        switch (op) {
            case 'lt':
                return left < right;
            case 'lte':
                return left <= right;
            case 'gt':
                return left > right;
            case 'gte':
                return left >= right;
            case 'eq':
            default:
                return left === right;
        }
    }

    // Very small expression evaluator supporting numbers, identifiers, + - * / and parentheses
    private evaluateExpression(formula: string, vars: Record<string, any>): number {
        const tokens = this.tokenize(formula);
        const rpn = this.toRpn(tokens);
        return this.evalRpn(rpn, vars);
    }

    private tokenize(formula: string): string[] {
        const tokens: string[] = [];
        const pattern = /\s*([A-Za-z_][A-Za-z0-9_]*|\d*\.?\d+|[()+\-*/])\s*/g;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(formula)) !== null) {
            tokens.push(match[1]);
        }
        return tokens;
    }

    private toRpn(tokens: string[]): string[] {
        const output: string[] = [];
        const ops: string[] = [];
        const precedence: { [op: string]: number } = { '+': 1, '-': 1, '*': 2, '/': 2 };

        for (const token of tokens) {
            if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token) || /^\d*\.?\d+$/.test(token)) {
                output.push(token);
            } else if (token in precedence) {
                while (ops.length && ops[ops.length - 1] in precedence && precedence[ops[ops.length - 1]] >= precedence[token]) {
                    output.push(ops.pop() as string);
                }
                ops.push(token);
            } else if (token === '(') {
                ops.push(token);
            } else if (token === ')') {
                while (ops.length && ops[ops.length - 1] !== '(') {
                    output.push(ops.pop() as string);
                }
                if (!ops.length || ops.pop() !== '(') {
                    throw new Error('Mismatched parentheses');
                }
            } else {
                throw new Error('Invalid token');
            }
        }

        while (ops.length) {
            const op = ops.pop() as string;
            if (op === '(' || op === ')') {
                throw new Error('Mismatched parentheses');
            }
            output.push(op);
        }

        return output;
    }

    private evalRpn(tokens: string[], vars: Record<string, any>): number {
        const stack: number[] = [];

        for (const token of tokens) {
            if (/^\d*\.?\d+$/.test(token)) {
                stack.push(parseFloat(token));
            } else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token)) {
                const raw = vars[token];
                const num = typeof raw === 'number' ? raw : parseFloat(raw);
                if (isNaN(num)) {
                    throw new Error('Invalid variable value');
                }
                stack.push(num);
            } else if (['+', '-', '*', '/'].includes(token)) {
                const b = stack.pop();
                const a = stack.pop();
                if (a === undefined || b === undefined) {
                    throw new Error('Invalid expression');
                }
                let res: number;
                switch (token) {
                    case '+':
                        res = a + b;
                        break;
                    case '-':
                        res = a - b;
                        break;
                    case '*':
                        res = a * b;
                        break;
                    case '/':
                        res = b === 0 ? NaN : a / b;
                        break;
                    default:
                        throw new Error('Unknown operator');
                }
                if (!isFinite(res)) {
                    throw new Error('Invalid result');
                }
                stack.push(res);
            } else {
                throw new Error('Invalid token');
            }
        }

        if (stack.length !== 1) {
            throw new Error('Invalid expression');
        }

        return stack[0];
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
            if (field.type === 'idNumber') {
                validators.push(saIdNumberValidator());
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
        this.hasSigned = false;
    }

    goToStep(index: number): void {
        if (index < 0 || index >= this.steps.length) return;
        this.currentStepIndex = index;
        this.ensureStepInitialized(index);
        this.emitCurrentStepChanged();
    }

    prev(): void {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
            this.ensureStepInitialized(this.currentStepIndex);
            this.emitCurrentStepChanged();
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

    /**
     * Optional final sign-off for flows that enable completion PDF + signature.
     * This is UI-level only; callers can listen for completion externally if needed.
     */
    signAndComplete(): void {
        if (!this.requireSignature) {
            return;
        }

        if (!this.signatureDataUrl) {
            this.globalError = 'Please provide your signature before completing.';
            return;
        }

        // Simple client-side confirmation; backend flows can hook into this pattern if needed.
        this.isSigning = true;

        // Small timeout to allow any loading indicator to show; no API call here by default.
        setTimeout(() => {
            this.isSigning = false;
            this.hasSigned = true;
            // If a custom success message is configured, keep it; otherwise, set a clearer one.
            if (!this.globalSuccess) {
                this.globalSuccess = this.config?.settings?.successMessage || 'Thank you for completing and signing all steps.';
            }
            this.signedAndCompleted.emit({ signatureDataUrl: this.signatureDataUrl });
        }, 300);
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

        // Attach calculator result to submission payload if configured for this step
        if (step.calculatorEnabled && step.calculatorStoreMode === 'attach-to-submission' && step.calculatorResultKey) {
            submissionPayload[step.calculatorResultKey] = step.calculatorValue;
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
        const justCompletedIndex = this.currentStepIndex;
        this.emitStepCompleted(justCompletedIndex);

        if (this.isLastStep) {
            this.completed = true;
            this.globalSuccess = this.config?.settings?.successMessage || 'Thank you for completing all steps.';
            this.flowCompleted.emit();
        } else {
            this.currentStepIndex++;
            this.ensureStepInitialized(this.currentStepIndex);
            this.emitCurrentStepChanged();
        }
    }
}
