import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';

export interface CalculatorPreprocessingRule {
    targetCollectionKey: string;
    targetField: string;
    operation: 'ageFromDate' | 'ageFromId' | 'copy';
    sourceField: string;
}

export interface CalculatorAggregation {
    label: string;
    collectionKey: string; // e.g., 'items' or 'dependents'
    fieldKey: string; // e.g., 'age'
    operation: 'sum' | 'count' | 'average';
    multiplier?: number;
}

/**
 * Pre-variable aggregations that compute collection stats (count, sum, max, min, average)
 * into named global variables BEFORE the variables/cases derivation phase.
 * These are NOT added to totalMonthlyPremium — purely for use in variables.cases conditions.
 */
export interface GlobalAggregation {
    key: string;          // variable name written into global context, e.g. 'dependentCount'
    collectionKey: string; // e.g. 'dependents'
    fieldKey?: string;     // required for sum/max/min/average; omit for count
    operation: 'count' | 'sum' | 'average' | 'max' | 'min';
}

export interface CalculatorCondition {
    field: string;
    operator: 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'contains';
    value: any;
    value2?: any; // For 'between'
}

export interface CalculatorLookupRule {
    conditions: CalculatorCondition[];
    result: number;
}

export interface CalculatorIterativeVariableConfig {
    variableKey: string; // The Result Key (e.g., 'dependentPremium')
    label: string;
    sourceCollectionKey: string; // Field in form data (e.g., 'dependents')
    itemAlias: string; // Alias for the item (e.g., 'dep') - allows referencing dep.age
    lookupRules: CalculatorLookupRule[];
    defaultResult?: number;
    aggregationMode: 'sum' | 'count'; // typically sum of premiums
    showDetailedBreakdown?: boolean;
    rowLabelTemplate?: string; // e.g., "{{firstName}} {{lastName}}"
    rowQuantityTemplate?: string; // e.g., "Age {{age}}"
}

export interface CalculatorVariableDerivation {
    key: string; // e.g., "v_grade" or "eggCount"
    sourceField?: string; // reads from context
    operation?: 'copy' | 'toNumber' | 'booleanToNumber' | 'stringLength';
    defaultValue?: number;
    cases?: Array<{
        when: CalculatorCondition[];
        value: number;
    }>;
}

export interface CalculatorFormula {
    key: string; // variable name to write into
    label?: string; // used in breakdown when no template
    expression: string; // e.g., "eggCount * eggUnitPrice"
    includeInTotal?: boolean; // defaults true
    breakdownTemplate?: string; // plain text, supports {{tokens}}
}

export interface CalculatorRowModeConfig {
    enabled?: boolean;
    sourceCollectionKey?: string;
    itemAlias?: string; // optional; if set, templates can use {{alias.field}}
    variables?: CalculatorVariableDerivation[];
    formulas?: CalculatorFormula[];
    rowResultTemplate?: string; // e.g., "The price for {{eggCount}} egg/s is {{eggPriceResult}}"
}

export interface CalculatorDisplayConfig {
    headerText?: string;
    autoCalculateText?: string;
    basePremiumLabel?: string;
    basePremiumPlaceholder?: string;
    estimatedPremiumLabel?: string;
    breakdownTitle?: string;
    emptyStateText?: string;
    rowResultsTitle?: string;
    finalResultTitle?: string;
    showRowResults?: boolean;
    showFinalResult?: boolean;
    showCalculationSteps?: boolean;
    finalResultTemplate?: string; // e.g., "Total price is {{totalPrice}}"
}

export interface CalculatorConfig {
    title?: string;
    showBreakdown?: boolean;
    autoCalculate?: boolean;
    basePremiumOptions?: { label: string; value: number; coverAmount: number }[];
    preprocessingRules?: CalculatorPreprocessingRule[];
    aggregations?: CalculatorAggregation[];
    /**
     * Pre-variable global aggregations — computed before variables/cases, available as
     * named context keys in variables.when conditions and formula expressions.
     * Do NOT add to totalMonthlyPremium.
     */
    globalAggregations?: GlobalAggregation[];
    iterativeVariables?: CalculatorIterativeVariableConfig[];

    // New generic calculation model
    display?: CalculatorDisplayConfig;
    variables?: CalculatorVariableDerivation[];
    formulas?: CalculatorFormula[];
    postRowVariables?: CalculatorVariableDerivation[];
    postRowFormulas?: CalculatorFormula[];
    rowMode?: CalculatorRowModeConfig;
}

export interface CalculatorResult {
    totalMonthlyPremium: number;
    basePremium: number;
    coverAmount: number;
    variableTotals: Record<string, number>;
    breakdownItems: any[];

    // New optional breakdown outputs
    rowResultLines?: string[];
    finalResultLine?: string;
    steps?: Array<{ scope: 'global' | 'row'; rowIndex?: number; key: string; kind: 'variable' | 'formula'; expression?: string; value: number }>;
}

@Component({
    selector: 'app-embedded-calculator',
    standalone: true,
    imports: [CommonModule, FormsModule, CardModule, InputNumberModule, ButtonModule, TableModule, DropdownModule],
    template: `
        <div class="embedded-calculator">
            <p-card [header]="config().display?.headerText || config().title || 'Your Estimated Premium'">
                <div *ngIf="config().autoCalculate" class="auto-calc-notice">
                    <i class="pi pi-info-circle"></i>
                    <span>{{ config().display?.autoCalculateText || 'Premium automatically calculated based on your selections' }}</span>
                </div>

                <!-- Base Premium Selection (Only if options exist) -->
                <div *ngIf="basePremiumOptions().length > 0" class="calculator-inputs mb-3">
                    <label class="field-label">{{ config().display?.basePremiumLabel || 'Choose Cover Amount' }}</label>
                    <p-dropdown 
                        [options]="basePremiumOptions()" 
                        [(ngModel)]="selectedBasePremium" 
                        optionLabel="label" 
                        optionValue="value" 
                        (onChange)="calculate()"
                        [placeholder]="config().display?.basePremiumPlaceholder || 'Select a plan'">
                    </p-dropdown>
                </div>

                <!-- Results Section -->
                <div *ngIf="result()" class="calculator-results mt-4">
                    <div class="total-premium-display">
                        <div class="premium-label">{{ config().display?.estimatedPremiumLabel || 'Estimated Monthly Premium' }}</div>
                        <div class="premium-amount">R{{ result()!.totalMonthlyPremium | number: '1.2-2' }}</div>
                    </div>

                    <!-- Calculation Steps (Trace) -->
                    <div *ngIf="(config().display?.showCalculationSteps ?? false) && (result()!.steps?.length || 0) > 0" class="breakdown-section mt-3">
                        <h6>Calculation Steps</h6>
                        <ul class="m-0 ps-3">
                            <li *ngFor="let s of result()!.steps">
                                <span *ngIf="s.scope === 'row'">Row {{ (s.rowIndex ?? 0) + 1 }}: </span>
                                <span *ngIf="s.scope === 'global'">Global: </span>
                                <span>{{ s.key }}</span>
                                <span *ngIf="s.kind === 'formula' && s.expression"> = {{ s.expression }}</span>
                                <span> → {{ s.value }}</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Row Results (Text) -->
                    <div *ngIf="(config().display?.showRowResults ?? true) && (result()!.rowResultLines?.length || 0) > 0" class="breakdown-section mt-3">
                        <h6>{{ config().display?.rowResultsTitle || 'Row Results' }}</h6>
                        <ul class="m-0 ps-3">
                            <li *ngFor="let line of result()!.rowResultLines">{{ line }}</li>
                        </ul>
                    </div>

                    <!-- Final Result (Text) -->
                    <div *ngIf="(config().display?.showFinalResult ?? true) && !!result()!.finalResultLine" class="breakdown-section mt-3">
                        <h6>{{ config().display?.finalResultTitle || 'Result' }}</h6>
                        <div>{{ result()!.finalResultLine }}</div>
                    </div>

                    <!-- Breakdown Table -->
                    <div *ngIf="config().showBreakdown !== false && result()!.breakdownItems.length > 0" class="breakdown-section mt-3">
                        <h6>{{ config().display?.breakdownTitle || 'Premium Breakdown' }}</h6>
                        <p-table [value]="result()!.breakdownItems" styleClass="p-datatable-sm">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th class="text-end">Amount</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td>{{ item.label }}</td>
                                    <td>{{ item.quantity }}</td>
                                    <td class="text-end">R{{ item.amount | number: '1.2-2' }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="footer">
                                <tr>
                                    <td colspan="2"><strong>Total Monthly Premium</strong></td>
                                    <td class="text-end">
                                        <strong>R{{ result()!.totalMonthlyPremium | number: '1.2-2' }}</strong>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="!result()" class="empty-state text-center py-4">
                    <i class="pi pi-calculator" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="mt-2 text-muted">{{ config().display?.emptyStateText || 'Configure your coverage and click "Calculate Premium"' }}</p>
                </div>
            </p-card>
        </div>
    `,
    styles: [
        `
            .embedded-calculator {
                width: 100%;
            }

            .auto-calc-notice {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                background-color: #e3f2fd;
                border-left: 4px solid #2196f3;
                border-radius: 4px;
                margin-bottom: 1rem;
                font-size: 0.9rem;
                color: #0d47a1;
            }

            .calculator-inputs {
                padding: 1rem;
                background-color: #f8f9fa;
                border-radius: 8px;
            }

            .field-label {
                display: block;
                font-weight: 500;
                margin-bottom: 0.5rem;
                color: #333;
            }

            .form-text {
                display: block;
                margin-top: 0.25rem;
                font-size: 0.875rem;
            }

            .calculator-results {
                border-top: 1px solid #e0e0e0;
                padding-top: 1rem;
            }

            .total-premium-display {
                text-align: center;
                padding: 1.5rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .premium-label {
                font-size: 0.95rem;
                opacity: 0.95;
                margin-bottom: 0.5rem;
            }

            .premium-amount {
                font-size: 2.5rem;
                font-weight: 700;
            }

            .breakdown-section h6 {
                font-weight: 600;
                margin-bottom: 1rem;
                color: #333;
            }

            .empty-state {
                padding: 2rem;
            }

            :host ::ng-deep .p-inputnumber {
                width: 100%;
            }

            :host ::ng-deep .p-inputnumber-input {
                width: 100%;
            }

            :host ::ng-deep .p-dropdown {
                width: 100%;
            }
        `
    ]
})
export class EmbeddedCalculatorComponent implements OnInit, OnChanges {
    config = input<CalculatorConfig>({
        title: 'Premium Calculator',
        showBreakdown: true,
        autoCalculate: true,
        basePremiumOptions: []
    });

    @Input() value: CalculatorResult | null = null;
    @Input() formData: any = {}; // Watch form data for auto-calculation
    @Output() valueChange = new EventEmitter<CalculatorResult>();
    @Output() calculated = new EventEmitter<CalculatorResult>();

    result = signal<CalculatorResult | null>(null);

    // Calculation inputs
    selectedBasePremium: number = 0;

    // Store processed collections for aggregations and detailed iterators
    collections: Record<string, any[]> = {};
    
    basePremiumOptions = signal<{ label: string; value: number; coverAmount: number }[]>([]);

    ngOnInit() {
        // Use provided config or defaults
        if (this.config().basePremiumOptions) {
            this.basePremiumOptions.set(this.config().basePremiumOptions!);
        }

        // Initialize selection if options exist and no previous value
        if (this.basePremiumOptions().length > 0 && this.selectedBasePremium === 0) {
            this.selectedBasePremium = this.basePremiumOptions()[0].value;
        }

        // Load from value if provided
        if (this.value) {
            this.result.set(this.value);
            this.selectedBasePremium = this.value.basePremium;
        }

        // Auto-calculate on init if form data is present
        if (this.config().autoCalculate && this.formData) {
            this.extractFormDataAndCalculate();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        // When form data changes, recalculate
        if (changes['formData'] && !changes['formData'].firstChange && this.config().autoCalculate) {
            this.extractFormDataAndCalculate();
        }
    }

    extractFormDataAndCalculate() {
        // Store all arrays found in this.formData into collections
        this.collections = {};
        if (this.formData) {
            Object.keys(this.formData).forEach((key) => {
                let value = this.formData[key];

                // Try to parse if string
                if (typeof value === 'string') {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Not JSON, ignore
                    }
                }

                if (Array.isArray(value)) {
                    // Start with basic items
                    let processedItems = [...value];
                    
                    // Apply preprocessing rules from config if they target this key
                    const rules = this.config().preprocessingRules;
                    if (rules) {
                        rules.filter(r => r.targetCollectionKey === key).forEach(rule => {
                             processedItems = processedItems.map(item => this.applyPreprocessingRule(item, rule));
                        });
                    }

                    this.collections[key] = processedItems;
                }
            });
        }

        // Auto-calculate
        this.calculate();
    }

    applyPreprocessingRule(item: any, rule: CalculatorPreprocessingRule): any {
        const newItem = { ...item };
        const sourceVal = newItem[rule.sourceField];

        if (rule.operation === 'ageFromDate') {
            newItem[rule.targetField] = this.calculateAge(sourceVal);
        } else if (rule.operation === 'ageFromId') {
            // Simple generic ID parser, can be expanded or made pluggable
            newItem[rule.targetField] = this.calculateAgeFromId(sourceVal);
        } else if (rule.operation === 'copy') {
             newItem[rule.targetField] = sourceVal;
        }

        return newItem;
    }

    calculateAge(dateOrString: string | Date | undefined): number {
        if (!dateOrString) return 0;
        
        let birthDate: Date | null = null;
        if (dateOrString instanceof Date) {
            birthDate = dateOrString;
        } else if (typeof dateOrString === 'string') {
             birthDate = new Date(dateOrString);
        }

        if (!birthDate || isNaN(birthDate.getTime())) {
            return 0;
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return Math.max(0, age);
    }
    
    calculateAgeFromId(idNumber: string): number {
         if (!idNumber || typeof idNumber !== 'string' || idNumber.length !== 13 || !/^\d+$/.test(idNumber)) {
             return 0;
         }
         
         const year = parseInt(idNumber.substring(0, 2), 10);
         const month = parseInt(idNumber.substring(2, 4), 10) - 1;
         const day = parseInt(idNumber.substring(4, 6), 10);

         let fullYear = year < 50 ? 2000 + year : 1900 + year;
         const birthDate = new Date(fullYear, month, day);
         
         return this.calculateAge(birthDate);
    }

    private toFiniteNumber(value: any, defaultValue: number = 0): number {
        if (typeof value === 'number') {
            return isFinite(value) ? value : defaultValue;
        }
        if (typeof value === 'boolean') {
            return value ? 1 : 0;
        }
        if (value == null) {
            return defaultValue;
        }
        const n = parseFloat(String(value));
        return isFinite(n) ? n : defaultValue;
    }

    private buildGlobalBuiltIns(): Record<string, any> {
        return {
            basePremium: this.selectedBasePremium,
            coverAmount: this.getSelectedCoverAmount()
        };
    }

    private buildMergedContext(parts: Array<Record<string, any> | undefined | null>): Record<string, any> {
        const out: Record<string, any> = {};
        for (const p of parts) {
            if (p && typeof p === 'object') {
                Object.assign(out, p);
            }
        }
        return out;
    }

    /** Normalize all keys of a plain object to lowercase so field lookups are case-insensitive. */
    private normalizeKeys(obj: Record<string, any>): Record<string, any> {
        const out: Record<string, any> = {};
        for (const k of Object.keys(obj)) {
            out[k.toLowerCase()] = obj[k];
        }
        return out;
    }

    private evaluateVariableDerivations(
        derivations: CalculatorVariableDerivation[] | undefined,
        context: Record<string, any>,
        steps: CalculatorResult['steps'] | undefined,
        stepScope: 'global' | 'row',
        rowIndex?: number
    ): Record<string, number> {
        const vars: Record<string, number> = {};
        if (!Array.isArray(derivations) || derivations.length === 0) {
            return vars;
        }

        for (const d of derivations) {
            if (!d?.key) {
                continue;
            }

            let resolved: number | undefined;
            if (Array.isArray(d.cases) && d.cases.length > 0) {
                let caseMatched = false;
                for (let ci = 0; ci < d.cases.length; ci++) {
                    const c = d.cases[ci];
                    const when = Array.isArray(c.when) ? c.when : [];
                    const matches = when.length === 0 ? true : when.every((cond) => this.evaluateCondition(cond, context));
                    if (matches) {
                        resolved = this.toFiniteNumber(c.value, this.toFiniteNumber(d.defaultValue, 0));
                        console.log(`  [var:${d.key}][${stepScope}${rowIndex != null ? ':row' + rowIndex : ''}] case[${ci}] MATCHED → ${resolved}`);
                        caseMatched = true;
                        break;
                    } else {
                        const failDetail = when.map((cond) => {
                            const ctxVal = context[cond.field] ?? context[(cond.field || '').toLowerCase()];
                            return `${cond.field}(ctx=${ctxVal})${cond.operator}${cond.value}${cond.value2 != null ? '...' + cond.value2 : ''}=FAIL`;
                        }).join(', ');
                        console.log(`  [var:${d.key}][${stepScope}${rowIndex != null ? ':row' + rowIndex : ''}] case[${ci}] NO MATCH: ${failDetail}`);
                    }
                }
                if (!caseMatched) {
                    console.log(`  [var:${d.key}][${stepScope}${rowIndex != null ? ':row' + rowIndex : ''}] no case matched → default ${d.defaultValue ?? 0}`);
                }
            }

            if (resolved === undefined) {
                const sourceRaw = d.sourceField ? this.resolveValue(d.sourceField, context) : undefined;
                const op = d.operation || (d.sourceField ? 'copy' : undefined);
                switch (op) {
                    case 'copy':
                        resolved = this.toFiniteNumber(sourceRaw, this.toFiniteNumber(d.defaultValue, 0));
                        break;
                    case 'toNumber':
                        resolved = this.toFiniteNumber(sourceRaw, this.toFiniteNumber(d.defaultValue, 0));
                        break;
                    case 'booleanToNumber':
                        resolved = typeof sourceRaw === 'boolean' ? (sourceRaw ? 1 : 0) : this.toFiniteNumber(sourceRaw, this.toFiniteNumber(d.defaultValue, 0));
                        break;
                    case 'stringLength':
                        resolved = sourceRaw == null ? this.toFiniteNumber(d.defaultValue, 0) : String(sourceRaw).length;
                        break;
                    default:
                        resolved = this.toFiniteNumber(d.defaultValue, 0);
                        break;
                }
            }

            vars[d.key] = this.toFiniteNumber(resolved, 0);
            if (steps) {
                steps.push({ scope: stepScope, rowIndex, key: d.key, kind: 'variable', value: vars[d.key] });
            }
        }

        return vars;
    }

    // Very small expression evaluator supporting numbers, identifiers (including dotted paths), + - * / and parentheses.
    private evaluateExpression(formula: string, context: Record<string, any>): number {
        const tokens = this.tokenizeExpression(formula);
        const rpn = this.toRpn(tokens);
        return this.evalRpn(rpn, context);
    }

    private tokenizeExpression(formula: string): string[] {
        const tokens: string[] = [];
        const s = String(formula || '');
        let i = 0;

        const isWhitespace = (ch: string) => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
        const isDigit = (ch: string) => ch >= '0' && ch <= '9';
        const isIdentStart = (ch: string) => (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') || ch === '_';
        const isIdent = (ch: string) => isIdentStart(ch) || isDigit(ch) || ch === '.';

        while (i < s.length) {
            const ch = s[i];
            if (isWhitespace(ch)) {
                i++;
                continue;
            }

            if (ch === '(' || ch === ')' || ch === '+' || ch === '-' || ch === '*' || ch === '/') {
                tokens.push(ch);
                i++;
                continue;
            }

            if (isDigit(ch) || ch === '.') {
                let j = i + 1;
                while (j < s.length && (isDigit(s[j]) || s[j] === '.')) {
                    j++;
                }
                tokens.push(s.substring(i, j));
                i = j;
                continue;
            }

            if (isIdentStart(ch)) {
                let j = i + 1;
                while (j < s.length && isIdent(s[j])) {
                    j++;
                }
                tokens.push(s.substring(i, j));
                i = j;
                continue;
            }

            throw new Error('Invalid token');
        }

        // Rewrite unary minus to u-
        const out: string[] = [];
        const isOperator = (t: string) => t === '+' || t === '-' || t === '*' || t === '/' || t === 'u-';
        for (let k = 0; k < tokens.length; k++) {
            const t = tokens[k];
            if (t === '-') {
                const prev = out[out.length - 1];
                if (!prev || prev === '(' || isOperator(prev)) {
                    out.push('u-');
                    continue;
                }
            }
            out.push(t);
        }

        return out;
    }

    private toRpn(tokens: string[]): string[] {
        const output: string[] = [];
        const ops: string[] = [];
        const precedence: { [op: string]: number } = { '+': 1, '-': 1, '*': 2, '/': 2, 'u-': 3 };
        const isNumber = (t: string) => /^\d*\.?\d+$/.test(t);
        const isIdent = (t: string) => /^[A-Za-z_][A-Za-z0-9_.]*$/.test(t);

        for (const token of tokens) {
            if (isIdent(token) || isNumber(token)) {
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

    private evalRpn(tokens: string[], context: Record<string, any>): number {
        const stack: number[] = [];
        const isNumber = (t: string) => /^\d*\.?\d+$/.test(t);
        const isIdent = (t: string) => /^[A-Za-z_][A-Za-z0-9_.]*$/.test(t);

        for (const token of tokens) {
            if (isNumber(token)) {
                stack.push(parseFloat(token));
                continue;
            }
            if (isIdent(token)) {
                const raw = this.resolveValue(token, context);
                stack.push(this.toFiniteNumber(raw, 0));
                continue;
            }
            if (token === 'u-') {
                const a = stack.pop();
                if (a === undefined) {
                    throw new Error('Invalid expression');
                }
                stack.push(-a);
                continue;
            }
            if (token === '+' || token === '-' || token === '*' || token === '/') {
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
                        res = NaN;
                        break;
                }
                if (!isFinite(res)) {
                    throw new Error('Invalid result');
                }
                stack.push(res);
                continue;
            }

            throw new Error('Invalid token');
        }

        if (stack.length !== 1) {
            throw new Error('Invalid expression');
        }
        return stack[0];
    }

    calculate() {
        const basePremium = this.selectedBasePremium;

        let totalMonthlyPremium = 0;
        const variableTotals: Record<string, number> = {};
        const breakdownItems: any[] = [];
        const rowResultLines: string[] = [];
        const steps: CalculatorResult['steps'] = this.config().display?.showCalculationSteps ? [] : undefined;

        const globalBuiltIns = this.buildGlobalBuiltIns();
        const rowModeCfg = this.config().rowMode;
        const inferredFirstCollectionKey = Object.keys(this.collections || {}).find((k) => Array.isArray(this.collections[k]));
        const rowCollectionKey = rowModeCfg?.enabled ? (rowModeCfg.sourceCollectionKey || inferredFirstCollectionKey) : undefined;
        const recordCount = rowCollectionKey ? (this.collections[rowCollectionKey] || []).length : 0;
        const globalBuiltInsWithCounts = { ...globalBuiltIns, recordCount };

        const globalVars: Record<string, number> = {};

        // 0-pre. Global aggregations evaluated BEFORE variable derivations so their results
        // are available as context in variables.when conditions (e.g. dependentCount, maxDependentAge).
        console.group('[Calculator] Global Aggregations');
        console.log('Collections available:', Object.keys(this.collections), this.collections);
        for (const ga of (this.config().globalAggregations || [])) {
            if (!ga?.key || !ga?.collectionKey) {
                console.warn('  Skipping aggregation (missing key or collectionKey):', ga);
                continue;
            }
            const coll = (this.collections[ga.collectionKey] || []).map((c: any) => this.normalizeKeys(c));
            const fieldKeyNorm = (ga.fieldKey || '').toLowerCase();
            console.log(`  [${ga.key}] collection="${ga.collectionKey}" (${coll.length} records) field="${fieldKeyNorm}" op="${ga.operation}"`);
            if (coll.length > 0) {
                console.log(`    raw field values:`, coll.map((c: any) => c[fieldKeyNorm]));
            } else {
                console.warn(`    collection "${ga.collectionKey}" is EMPTY — check collection key spelling`);
            }
            let gaVal = 0;
            switch (ga.operation) {
                case 'count':
                    gaVal = coll.length;
                    break;
                case 'sum':
                    gaVal = coll.reduce((a: number, c: any) => a + (Number(c[fieldKeyNorm]) || 0), 0);
                    break;
                case 'average':
                    gaVal = coll.length > 0
                        ? coll.reduce((a: number, c: any) => a + (Number(c[fieldKeyNorm]) || 0), 0) / coll.length
                        : 0;
                    break;
                case 'max':
                    gaVal = coll.length > 0
                        ? Math.max(...coll.map((c: any) => Number(c[fieldKeyNorm]) || 0))
                        : 0;
                    break;
                case 'min':
                    gaVal = coll.length > 0
                        ? Math.min(...coll.map((c: any) => Number(c[fieldKeyNorm]) || 0))
                        : 0;
                    break;
            }
            console.log(`    => ${ga.key} = ${gaVal}`);
            globalVars[ga.key] = gaVal;
        }
        console.groupEnd();

        // Add Base Premium to breakdown ONLY if options exist and a selection is made
        if (this.basePremiumOptions().length > 0) {
            totalMonthlyPremium += basePremium;
            breakdownItems.push({
                label: 'Base Premium',
                quantity: `R${this.getSelectedCoverAmount().toLocaleString()} cover`,
                amount: basePremium
            });
        }

        // 0. New global variables + formulas
        // Include globalVars so globalAggregation results (e.g. dependentCount, maxDependentAge)
        // are visible to variables.cases conditions.
        const globalContextForVars = this.buildMergedContext([
            globalBuiltInsWithCounts,
            this.formData,
            globalVars
        ]);
        Object.assign(globalVars, this.evaluateVariableDerivations(this.config().variables, globalContextForVars, steps, 'global'));
        console.log('[Calculator] globalVars after aggregations + variable derivations:', { ...globalVars });
        console.log('[Calculator] globalContextForVars:', { ...globalContextForVars });

        // Rebuild context including newly derived globals
        let globalContext = this.buildMergedContext([
            globalBuiltInsWithCounts,
            this.formData,
            globalVars
        ]);

        const globalFormulas = Array.isArray(this.config().formulas) ? this.config().formulas! : [];
        for (const f of globalFormulas) {
            if (!f?.key || !f.expression) {
                continue;
            }
            const value = this.toFiniteNumber(this.evaluateExpression(f.expression, globalContext), 0);
            globalVars[f.key] = value;
            globalContext = this.buildMergedContext([globalBuiltInsWithCounts, this.formData, globalVars]);

            if (steps) {
                steps.push({ scope: 'global', key: f.key, kind: 'formula', expression: f.expression, value });
            }

            const includeInTotal = f.includeInTotal !== false;
            if (includeInTotal) {
                totalMonthlyPremium += value;
                variableTotals[f.key] = (variableTotals[f.key] || 0) + value;
                breakdownItems.push({
                    label: f.label || f.key,
                    quantity: 'formula',
                    amount: value
                });
            }
        }

        // 0b. Row mode evaluation (multi-submit style)
        if (rowModeCfg?.enabled && rowCollectionKey) {
            const rows = this.collections[rowCollectionKey] || [];
            console.group('[Calculator] Row Mode');
            console.log('sourceCollectionKey (config):', rowModeCfg.sourceCollectionKey);
            console.log('rowCollectionKey (resolved):', rowCollectionKey);
            console.log('Collections available:', Object.keys(this.collections));
            if (rows.length === 0) {
                console.warn(`  Collection "${rowCollectionKey}" is EMPTY or not found — check config sourceCollectionKey matches one of the available collections above`);
            } else {
                console.log(`  ${rows.length} row(s) to process`);
                rows.forEach((row, i) => {
                    const norm = this.normalizeKeys(typeof row === 'object' && row ? row : { value: row });
                    console.log(`  Row[${i}] normalized keys:`, norm);
                });
            }
            console.groupEnd();
            const alias = rowModeCfg.itemAlias;

            rows.forEach((row, index) => {
                const rowFields = this.normalizeKeys(typeof row === 'object' && row ? row : { value: row });
                const rowBuiltIns = { ...globalBuiltInsWithCounts, rowIndex: index };

                const rowBaseContext = this.buildMergedContext([
                    rowBuiltIns,
                    this.formData,
                    globalVars,
                    rowFields,
                    alias ? { [alias]: rowFields } : undefined
                ]);

                const rowVars = this.evaluateVariableDerivations(rowModeCfg.variables, rowBaseContext, steps, 'row', index);
                console.log(`  Row[${index}] vars:`, { ...rowVars }, '| context keys:', Object.keys(rowBaseContext));
                let rowContext = this.buildMergedContext([
                    rowBuiltIns,
                    this.formData,
                    globalVars,
                    rowVars,
                    rowFields,
                    alias ? { [alias]: rowFields } : undefined
                ]);

                const rowFormulas = Array.isArray(rowModeCfg.formulas) ? rowModeCfg.formulas : [];
                for (const rf of rowFormulas) {
                    if (!rf?.key || !rf.expression) {
                        continue;
                    }
                    const value = this.toFiniteNumber(this.evaluateExpression(rf.expression, rowContext), 0);
                    rowVars[rf.key] = value;
                    rowContext = this.buildMergedContext([
                        rowBuiltIns,
                        this.formData,
                        globalVars,
                        rowVars,
                        rowFields,
                        alias ? { [alias]: rowFields } : undefined
                    ]);

                    if (steps) {
                        steps.push({ scope: 'row', rowIndex: index, key: rf.key, kind: 'formula', expression: rf.expression, value });
                    }

                    const includeInTotal = rf.includeInTotal !== false;
                    if (includeInTotal) {
                        totalMonthlyPremium += value;
                        variableTotals[rf.key] = (variableTotals[rf.key] || 0) + value;
                    }

                    if (rowModeCfg?.rowResultTemplate) {
                        // Template line comes after row formulas so it can reference computed values
                    }
                }

                if (rowModeCfg.rowResultTemplate) {
                    const line = this.resolveTemplate(rowModeCfg.rowResultTemplate, rowContext);
                    if (line && line.trim().length > 0) {
                        rowResultLines.push(line);
                    }
                }
            });

            // Refresh global context after row-mode accumulated variableTotals
            Object.assign(globalVars, variableTotals);
            globalContext = this.buildMergedContext([globalBuiltInsWithCounts, this.formData, globalVars]);
        }

        // 0c. Post-row global variables + formulas (enables category/price adjustments based on submitted rows)
        Object.assign(globalVars, this.evaluateVariableDerivations(this.config().postRowVariables, globalContext, steps, 'global'));
        globalContext = this.buildMergedContext([globalBuiltInsWithCounts, this.formData, globalVars]);

        const postRowFormulas = Array.isArray(this.config().postRowFormulas) ? this.config().postRowFormulas! : [];
        for (const f of postRowFormulas) {
            if (!f?.key || !f.expression) {
                continue;
            }
            const value = this.toFiniteNumber(this.evaluateExpression(f.expression, globalContext), 0);
            globalVars[f.key] = value;
            globalContext = this.buildMergedContext([globalBuiltInsWithCounts, this.formData, globalVars]);

            if (steps) {
                steps.push({ scope: 'global', key: f.key, kind: 'formula', expression: f.expression, value });
            }

            const includeInTotal = f.includeInTotal !== false;
            if (includeInTotal) {
                totalMonthlyPremium += value;
                variableTotals[f.key] = (variableTotals[f.key] || 0) + value;
                breakdownItems.push({
                    label: f.label || f.key,
                    quantity: 'formula',
                    amount: value
                });
            }
        }

        // 1. Iterative Variables (e.g. Iterative Items, Dependents)
        const iterativeVariables = this.config().iterativeVariables || [];

        iterativeVariables.forEach((variable) => {
            const collection = this.collections[variable.sourceCollectionKey] || [];
            let variableTotal = 0;
            const detailedItems: any[] = [];

            collection.forEach((item) => {
                // Determine value for this item based on rules
                let itemValue = Number(variable.defaultResult) || 0;

                // Create context merging global form data and local item alias
                const ruleContext = { ...this.formData, [variable.itemAlias]: item };

                if (variable.lookupRules && variable.lookupRules.length > 0) {
                    for (const rule of variable.lookupRules) {
                        if (this.evaluateRule(rule, ruleContext)) {
                            itemValue = Number(rule.result);
                            break; // Stop at first matching rule
                        }
                    }
                }

                variableTotal += itemValue;
                
                // Track detail for breakdown if enabled
                if (variable.showDetailedBreakdown) {
                    detailedItems.push({
                        label: this.resolveTemplate(variable.rowLabelTemplate, ruleContext) || variable.label,
                        quantity: this.resolveTemplate(variable.rowQuantityTemplate, ruleContext) || '1',
                        amount: itemValue
                    });
                }
            });

            variableTotals[variable.variableKey] = variableTotal;
            totalMonthlyPremium += variableTotal;
            
            // Add to breakdown
            if (variable.showDetailedBreakdown) {
                // Add individual items
                breakdownItems.push(...detailedItems);
            } else {
                // Summary line only
                breakdownItems.push({
                    label: variable.label,
                    quantity: `${collection.length} items`,
                    amount: variableTotal
                });
            }
        });
        
        // 2. Aggregations (e.g. Admin Fees, Counts)
        const aggregations = this.config().aggregations || [];
        aggregations.forEach((agg) => {
             const collection = this.collections[agg.collectionKey] || [];
            let resultValue = 0;
            let displayQuantity = '';

            if (agg.operation === 'count') {
                resultValue = collection.length;
                displayQuantity = `${resultValue}`;
            } else if (agg.operation === 'sum') {
                resultValue = collection.reduce((acc, curr) => acc + (Number(curr[agg.fieldKey]) || 0), 0);
                displayQuantity = `${resultValue}`;
            } else if (agg.operation === 'average') {
                if (collection.length > 0) {
                    const sum = collection.reduce((acc, curr) => acc + (Number(curr[agg.fieldKey]) || 0), 0);
                    resultValue = sum / collection.length;
                }
                displayQuantity = resultValue.toFixed(2);
            }

            const multiplier = !isNaN(Number(agg.multiplier)) ? Number(agg.multiplier) : 1;
            const amount = resultValue * multiplier;
            
            totalMonthlyPremium += amount;
            
             breakdownItems.push({
                label: agg.label,
                quantity: `${agg.operation} (${displayQuantity})`,
                amount: amount
            });
        });

        // Final result template (global)
        let finalResultLine: string | undefined;
        const finalTemplate = this.config().display?.finalResultTemplate;
        if (finalTemplate) {
            const finalContext = this.buildMergedContext([
                globalBuiltInsWithCounts,
                this.formData,
                globalVars,
                variableTotals,
                { totalMonthlyPremium }
            ]);
            finalResultLine = this.resolveTemplate(finalTemplate, finalContext);
        }

        const calculatorResult: CalculatorResult = {
            totalMonthlyPremium,
            basePremium,
            coverAmount: this.getSelectedCoverAmount(),
            variableTotals,
            breakdownItems,
            rowResultLines: rowResultLines.length ? rowResultLines : undefined,
            finalResultLine: finalResultLine && finalResultLine.trim().length ? finalResultLine : undefined,
            steps
        };

        this.result.set(calculatorResult);
        this.valueChange.emit(calculatorResult);
        this.calculated.emit(calculatorResult);
    }

    resolveTemplate(template: string | undefined, context: any): string {
        if (!template) return '';
        
        // Simple mustache-style replacement {{key}}
        return template.replace(/{{\s*([\w.]+)\s*}}/g, (match, path) => {
            const val = this.resolveValue(path, context);
            return val !== undefined && val !== null ? String(val) : '';
        });
    }

    evaluateRule(rule: CalculatorLookupRule, context: any): boolean {
        // All conditions must match (AND logic)
        return rule.conditions.every((condition) => this.evaluateCondition(condition, context));
    }

    evaluateCondition(condition: CalculatorCondition, context: any): boolean {
        const value = this.resolveValue(condition.field, context);
        const target = condition.value;

        switch (condition.operator) {
            case 'equals':
                return value == target; // Lax equality for number/string matching
            case 'gt':
                return Number(value) > Number(target);
            case 'lt':
                return Number(value) < Number(target);
            case 'gte':
                return Number(value) >= Number(target);
            case 'lte':
                return Number(value) <= Number(target);
            case 'between':
                return Number(value) >= Number(target) && Number(value) <= Number(condition.value2);
            case 'contains':
                return String(value).toLowerCase().includes(String(target).toLowerCase());
            default:
                return false;
        }
    }

    resolveValue(path: string, context: any): any {
        // Primary: exact path traversal (supports dot notation)
        const exact = path.split('.').reduce((prev, curr) => (prev ? prev[curr] : undefined), context);
        if (exact !== undefined) return exact;

        // Fallback 1: lowercase key (handles mixed-case mismatches e.g. idnumber_Age vs idnumber_age)
        const lower = path.toLowerCase();
        if (context[lower] !== undefined) return context[lower];

        // Fallback 2: lowercase + strip underscores (handles idnumber_age vs idnumberage)
        const stripped = lower.replace(/_/g, '');
        if (context[stripped] !== undefined) return context[stripped];

        // Fallback 3: scan all context keys with stripped comparison
        const strippedKey = stripped;
        for (const k of Object.keys(context)) {
            if (k.toLowerCase().replace(/_/g, '') === strippedKey) {
                return context[k];
            }
        }

        return undefined;
    }

    getSelectedCoverAmount(): number {
        const option = this.basePremiumOptions().find((opt) => opt.value === this.selectedBasePremium);
        return option?.coverAmount || 0;
    }
}

