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

    // Calculator configuration and state
    calculatorEnabled = false;
    calculatorLabel = 'Calculated Result';
    calculatorDisplayMode: 'inline' | 'side-panel' = 'side-panel';
    calculatorAudience: 'public' | 'authenticated' = 'public';
    calculatorStoreMode: 'none' | 'attach-to-submission' = 'none';
    calculatorResultKey = 'calculatorResult';
    calculatorValue: number | null = null;
    calculatorError: string = '';
    private calculatorConfig: any | null = null;

    // Snapshot of last calculator variables so additional widgets can use them
    calculatorVars: Record<string, any> = {};

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
                this.setupCalculatorFromConfig(form);
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

    private setupCalculatorFromConfig(formWithConfig: FormDto): void {
        const configJson: string | undefined = formWithConfig.calculatorConfig;
        if (!configJson) {
            this.calculatorEnabled = false;
            this.calculatorConfig = null;
            return;
        }

        try {
            const cfg = JSON.parse(configJson);
            if (!cfg || typeof cfg !== 'object' || !cfg.enabled || !cfg.formula) {
                this.calculatorEnabled = false;
                this.calculatorConfig = null;
                return;
            }

            this.calculatorConfig = cfg;
            this.calculatorEnabled = true;
            this.calculatorLabel = cfg.expressionLabel || 'Calculated Result';
            this.calculatorDisplayMode = cfg.displayMode === 'inline' ? 'inline' : 'side-panel';
            this.calculatorAudience = cfg.audience === 'authenticated' ? 'authenticated' : 'public';
            this.calculatorStoreMode = cfg.storeMode === 'attach-to-submission' ? 'attach-to-submission' : 'none';
            this.calculatorResultKey = cfg.resultKey || 'calculatorResult';

            // Respect audience visibility
            if (this.calculatorAudience === 'authenticated' && !this.authService.isAuthenticated()) {
                this.calculatorEnabled = false;
                this.calculatorConfig = null;
                return;
            }

            // Evaluate on initial state and whenever the form changes
            this.formGroup.valueChanges.subscribe(() => {
                this.evaluateCalculator();
            });
            this.evaluateCalculator();
        } catch {
            this.calculatorEnabled = false;
            this.calculatorConfig = null;
        }
    }

    private evaluateCalculator(): void {
        if (!this.formGroup || !this.calculatorConfig || !this.calculatorConfig.formula) {
            return;
        }

        const values = this.formGroup.value as Record<string, any>;
        try {
            const vars = this.buildCalculatorVariables(values, this.calculatorConfig);
            this.calculatorVars = vars;
            const result = this.evaluateExpression(this.calculatorConfig.formula as string, vars);
            this.calculatorValue = result;
            this.calculatorError = '';
        } catch {
            this.calculatorValue = null;
            this.calculatorError = 'Unable to calculate result. Please check the formula and field values.';
        }
    }

    // Helper getters for additional calculator-driven widgets

    getBreakdownItems(): { name: string; label: string; value: any }[] {
        if (!this.calculatorConfig || !Array.isArray(this.calculatorConfig.variables)) {
            return [];
        }

        return (this.calculatorConfig.variables as any[])
            .filter((v) => !!v && !!v.name)
            .map((v) => {
                const name = v.name as string;
                const label = (v.label as string) || name;
                const value = this.calculatorVars ? this.calculatorVars[name] : undefined;
                return { name, label, value };
            })
            .filter((item) => item.value !== undefined && item.value !== null && item.value !== '');
    }

    getEligibilityDisplay(): { status: string; isOk: boolean } | null {
        if (!this.calculatorConfig || !this.calculatorConfig.eligibilityVariableName) {
            return null;
        }

        const key = this.calculatorConfig.eligibilityVariableName as string;
        const raw = this.calculatorVars ? this.calculatorVars[key] : undefined;
        if (raw === undefined || raw === null || raw === '') {
            return null;
        }

        // Interpret booleans and simple strings/numbers
        if (typeof raw === 'boolean') {
            return {
                status: raw ? 'Eligible' : 'Not eligible',
                isOk: !!raw
            };
        }

        const text = String(raw);
        const lowered = text.toLowerCase();
        const isOk = lowered === 'eligible' || lowered === 'ok' || lowered === 'approved' || lowered === 'low';
        return {
            status: text,
            isOk
        };
    }

    getSavingsDisplay(): { full: number; discounted: number; savings: number; percent: number } | null {
        if (!this.calculatorConfig || !this.calculatorConfig.fullPriceVariableName || !this.calculatorConfig.discountedPriceVariableName) {
            return null;
        }

        const fullRaw = this.calculatorVars ? this.calculatorVars[this.calculatorConfig.fullPriceVariableName] : undefined;
        const discRaw = this.calculatorVars ? this.calculatorVars[this.calculatorConfig.discountedPriceVariableName] : undefined;

        const full = typeof fullRaw === 'number' ? fullRaw : parseFloat(fullRaw);
        const discounted = typeof discRaw === 'number' ? discRaw : parseFloat(discRaw);

        if (!isFinite(full) || !isFinite(discounted) || full <= 0) {
            return null;
        }

        const savings = full - discounted;
        const percent = (savings / full) * 100;
        if (!isFinite(savings)) {
            return null;
        }

        return { full, discounted, savings, percent };
    }

    getChecklistDisplay(): { label: string; done: boolean }[] {
        if (!this.calculatorConfig || !Array.isArray(this.calculatorConfig.checklistItems)) {
            return [];
        }

        return (this.calculatorConfig.checklistItems as any[])
            .filter((c) => !!c && !!c.label && !!c.variableName)
            .map((c) => {
                const value = this.calculatorVars ? this.calculatorVars[c.variableName] : undefined;
                const done = !!value;
                return { label: c.label as string, done };
            });
    }

    private buildCalculatorVariables(values: Record<string, any>, config: any): Record<string, any> {
        // Start with raw form values so formulas can still reference field names directly
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
                // If a variable cannot be evaluated, leave it undefined and let the main evaluator handle it
            }
        }

        return vars;
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
                while (
                    ops.length &&
                    ops[ops.length - 1] in precedence &&
                    precedence[ops[ops.length - 1]] >= precedence[token]
                ) {
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

    private evaluateAggregateVariable(variable: any, rawValue: any): number {
        const mode: string = variable.aggregateMode || 'sum';

        if (Array.isArray(rawValue)) {
            if (mode === 'count') {
                // For checkbox groups this will count items that are truthy
                return rawValue.filter((x) => !!x).length;
            }

            const numbers: number[] = rawValue
                .map((x) => (typeof x === 'number' ? x : parseFloat(x)))
                .filter((n) => !isNaN(n));

            if (!numbers.length) {
                return 0;
            }

            const sum = numbers.reduce((acc, n) => acc + n, 0);
            if (mode === 'avg') {
                return sum / numbers.length;
            }
            return sum;
        }

        // Scalar value: count treats non-null as 1, others try numeric
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

        // For eq and comparison operators, attempt numeric comparison when both sides look numeric
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

        // Attach calculator result to submission payload if configured
        if (this.calculatorEnabled && this.calculatorStoreMode === 'attach-to-submission' && this.calculatorResultKey) {
            submissionPayload[this.calculatorResultKey] = this.calculatorValue;
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
