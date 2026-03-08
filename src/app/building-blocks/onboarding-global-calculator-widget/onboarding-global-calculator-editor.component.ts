import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { DynamicEntityServiceProxy, DynamicEntityTypeDto } from '../../core/services/service-proxies';

// ─── Internal model types ──────────────────────────────────────────────────
interface AggRow {
    key: string; collectionKey: string; fieldKey: string;
    operation: 'count' | 'sum' | 'max' | 'min' | 'average';
}

interface Condition {
    field: string;
    operator: 'equals' | 'gt' | 'lt' | 'gte' | 'lte' | 'between' | 'contains';
    value: number; value2?: number;
}

interface VarCase { conditions: Condition[]; value: number; }

interface VarRow { key: string; defaultValue: number; cases: VarCase[]; expanded: boolean; }

interface FormulaRow {
    key: string; label: string; expression: string; includeInTotal: boolean;
}

interface PreprocRule {
    targetCollectionKey: string; sourceField: string; targetField: string;
    operation: 'ageFromDate' | 'ageFromId' | 'copy';
}

interface DisplayModel {
    finalResultTemplate: string;
    breakdownTitle: string;
    showCalculationSteps: boolean;
    emptyStateText: string;
    rowResultsTitle: string;
}

interface RowModeModel {
    enabled: boolean; sourceCollectionKey: string; itemAlias: string;
    variables: VarRow[]; formulas: FormulaRow[]; postRowFormulas: FormulaRow[];
    rowResultTemplate: string;
}

@Component({
    selector: 'app-onboarding-global-calculator-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './onboarding-global-calculator-editor.component.html'
})
export class OnboardingGlobalCalculatorEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    localTitle = 'Onboarding Price Summary';
    activeTab: 'configure' | 'json' = 'configure';
    jsonError = '';

    // Entity type data
    entityTypes: DynamicEntityTypeDto[] = [];
    entityTypeOptions: { label: string; value: string }[] = [];
    entityFieldMap: Record<string, { label: string; value: string }[]> = {};
    loadingEntities = false;

    // Root toggles
    showBreakdown = true;
    autoCalculate = true;

    // Structured model
    aggRows: AggRow[] = [];
    preprocRules: PreprocRule[] = [];
    globalVars: VarRow[] = [];
    globalFormulas: FormulaRow[] = [];
    displayConfig: DisplayModel = {
        finalResultTemplate: '', breakdownTitle: '', showCalculationSteps: false,
        emptyStateText: '', rowResultsTitle: ''
    };
    rowMode: RowModeModel = {
        enabled: false, sourceCollectionKey: '', itemAlias: '',
        variables: [], formulas: [], postRowFormulas: [], rowResultTemplate: ''
    };

    // JSON tab
    rawJson = '';

    readonly operators: string[] = ['equals', 'lte', 'gte', 'lt', 'gt', 'between', 'contains'];
    readonly aggOperations: string[] = ['count', 'sum', 'max', 'min', 'average'];
    readonly preprocOps: string[] = ['ageFromId', 'ageFromDate', 'copy'];

    constructor(private dynamicEntityService: DynamicEntityServiceProxy) {}

    ngOnInit(): void {
        const settings = JSON.parse(JSON.stringify(this.config.settings || {}));
        this.localTitle = settings.title || 'Onboarding Price Summary';
        this.rawJson = settings.calculatorConfigJson || '';
        if (this.rawJson.trim()) {
            try { this.jsonToStructured(this.rawJson); } catch { /* will show error on first edit */ }
        }
        this.loadEntityTypes();
    }

    private normalizeKey(v: string | null | undefined): string {
        return (v || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private loadEntityTypes(): void {
        this.loadingEntities = true;
        this.dynamicEntityService.entityType_GetAll().subscribe({
            next: (resp) => {
                this.entityTypes = resp?.result || [];
                this.entityTypeOptions = this.entityTypes.map(e => ({
                    label: e.name || e.key || '(unnamed)',
                    value: this.normalizeKey(e.key)
                }));
                this.entityFieldMap = {};
                for (const et of this.entityTypes) {
                    const key = this.normalizeKey(et.key);
                    try {
                        const fields = JSON.parse((et as any).fieldsJson || '[]');
                        if (Array.isArray(fields)) {
                            this.entityFieldMap[key] = fields.map((f: any) => ({ label: f.label || f.name, value: f.name }));
                        }
                    } catch { this.entityFieldMap[key] = []; }
                }
                this.loadingEntities = false;
            },
            error: () => { this.loadingEntities = false; }
        });
    }

    getFieldsForEntity(collectionKey: string): { label: string; value: string }[] {
        return this.entityFieldMap[collectionKey] || [];
    }

    get allContextFields(): string[] {
        const fields = new Set<string>(['coverAmount']);
        for (const agg of this.aggRows) { if (agg.key) fields.add(agg.key); }
        for (const v of this.globalVars) { if (v.key) fields.add(v.key); }
        for (const entityFields of Object.values(this.entityFieldMap)) {
            for (const f of entityFields) fields.add(f.value);
        }
        return Array.from(fields);
    }

    get rowModeContextFields(): string[] {
        const base = [...this.allContextFields];
        const rmFields = this.entityFieldMap[this.rowMode.sourceCollectionKey] || [];
        for (const f of rmFields) { if (!base.includes(f.value)) base.push(f.value); }
        return base;
    }

    // ─── Add / Remove helpers ──────────────────────────────────────────────
    addAgg()                             { this.aggRows.push({ key: '', collectionKey: '', fieldKey: '', operation: 'count' }); this.onStructuredChange(); }
    removeAgg(i: number)                 { this.aggRows.splice(i, 1); this.onStructuredChange(); }

    addPreproc()                         { this.preprocRules.push({ targetCollectionKey: '', sourceField: '', targetField: '', operation: 'ageFromId' }); this.onStructuredChange(); }
    removePreproc(i: number)             { this.preprocRules.splice(i, 1); this.onStructuredChange(); }

    addVar()                             { this.globalVars.push({ key: '', defaultValue: 0, cases: [], expanded: true }); this.onStructuredChange(); }
    removeVar(i: number)                 { this.globalVars.splice(i, 1); this.onStructuredChange(); }
    addCase(v: VarRow)                   { v.cases.push({ conditions: [], value: 0 }); this.onStructuredChange(); }
    removeCase(v: VarRow, i: number)     { v.cases.splice(i, 1); this.onStructuredChange(); }
    addCond(c: VarCase)                  { c.conditions.push({ field: '', operator: 'equals', value: 0 }); this.onStructuredChange(); }
    removeCond(c: VarCase, i: number)    { c.conditions.splice(i, 1); this.onStructuredChange(); }

    addFormula()                         { this.globalFormulas.push({ key: '', label: '', expression: '', includeInTotal: true }); this.onStructuredChange(); }
    removeFormula(i: number)             { this.globalFormulas.splice(i, 1); this.onStructuredChange(); }

    addRowVar()                          { this.rowMode.variables.push({ key: '', defaultValue: 0, cases: [], expanded: true }); this.onStructuredChange(); }
    removeRowVar(i: number)              { this.rowMode.variables.splice(i, 1); this.onStructuredChange(); }
    addRowCase(v: VarRow)                { v.cases.push({ conditions: [], value: 0 }); this.onStructuredChange(); }
    removeRowCase(v: VarRow, i: number)  { v.cases.splice(i, 1); this.onStructuredChange(); }
    addRowCond(c: VarCase)               { c.conditions.push({ field: '', operator: 'equals', value: 0 }); this.onStructuredChange(); }
    removeRowCond(c: VarCase, i: number) { c.conditions.splice(i, 1); this.onStructuredChange(); }
    addRowFormula()                      { this.rowMode.formulas.push({ key: '', label: '', expression: '', includeInTotal: true }); this.onStructuredChange(); }
    removeRowFormula(i: number)          { this.rowMode.formulas.splice(i, 1); this.onStructuredChange(); }
    addPostRowFormula()                  { this.rowMode.postRowFormulas.push({ key: '', label: '', expression: '', includeInTotal: true }); this.onStructuredChange(); }
    removePostRowFormula(i: number)      { this.rowMode.postRowFormulas.splice(i, 1); this.onStructuredChange(); }

    // ─── Sync: structured → JSON ───────────────────────────────────────────
    onStructuredChange(): void {
        try {
            this.rawJson = JSON.stringify(this.buildConfig(), null, 2);
            this.jsonError = '';
        } catch (e: any) { this.jsonError = e.message; }
    }

    private buildConfig(): any {
        const cfg: any = {
            showBreakdown: this.showBreakdown,
            autoCalculate: this.autoCalculate
        };

        const prp = this.preprocRules.filter(r => r.targetCollectionKey && r.sourceField && r.targetField);
        if (prp.length) cfg.preprocessingRules = prp.map(r => ({ ...r }));

        const aggs = this.aggRows.filter(a => a.key && a.collectionKey && a.operation);
        if (aggs.length) {
            cfg.globalAggregations = aggs.map(a => {
                const o: any = { key: a.key, collectionKey: a.collectionKey, operation: a.operation };
                if (a.operation !== 'count' && a.fieldKey) o.fieldKey = a.fieldKey;
                return o;
            });
        }

        const vrs = this.serializeVars(this.globalVars);
        if (vrs.length) cfg.variables = vrs;
        const fms = this.serializeFormulas(this.globalFormulas);
        if (fms.length) cfg.formulas = fms;

        const d = this.displayConfig;
        const dispOut: any = {};
        if (d.finalResultTemplate)  dispOut.finalResultTemplate = d.finalResultTemplate;
        if (d.breakdownTitle)       dispOut.breakdownTitle = d.breakdownTitle;
        if (d.rowResultsTitle)      dispOut.rowResultsTitle = d.rowResultsTitle;
        if (d.emptyStateText)       dispOut.emptyStateText = d.emptyStateText;
        if (d.showCalculationSteps) dispOut.showCalculationSteps = true;
        if (Object.keys(dispOut).length) cfg.display = dispOut;

        if (this.rowMode.enabled && this.rowMode.sourceCollectionKey) {
            cfg.rowMode = {
                enabled: true,
                sourceCollectionKey: this.rowMode.sourceCollectionKey,
                variables: this.serializeVars(this.rowMode.variables),
                formulas: this.serializeFormulas(this.rowMode.formulas)
            };
            if (this.rowMode.itemAlias)         cfg.rowMode.itemAlias = this.rowMode.itemAlias;
            if (this.rowMode.rowResultTemplate) cfg.rowMode.rowResultTemplate = this.rowMode.rowResultTemplate;
            const prf = this.serializeFormulas(this.rowMode.postRowFormulas);
            if (prf.length) cfg.postRowFormulas = prf;
        }
        return cfg;
    }

    private serializeVars(vars: VarRow[]): any[] {
        return vars.filter(v => v.key).map(v => {
            const o: any = { key: v.key, defaultValue: v.defaultValue ?? 0 };
            if (v.cases.length) {
                o.cases = v.cases.map(c => ({
                    when: c.conditions.map(cond => {
                        const w: any = { field: cond.field, operator: cond.operator, value: cond.value };
                        if (cond.operator === 'between' && cond.value2 != null) w.value2 = cond.value2;
                        return w;
                    }),
                    value: c.value
                }));
            }
            return o;
        });
    }

    private serializeFormulas(formulas: FormulaRow[]): any[] {
        return formulas.filter(f => f.key && f.expression).map(f => {
            const o: any = { key: f.key, expression: f.expression, includeInTotal: f.includeInTotal };
            if (f.label) o.label = f.label;
            return o;
        });
    }

    // ─── Sync: JSON → structured ───────────────────────────────────────────
    onJsonChange(): void {
        if (!this.rawJson.trim()) { this.jsonError = ''; return; }
        try {
            this.jsonToStructured(this.rawJson);
            this.jsonError = '';
        } catch (e: any) { this.jsonError = 'Invalid JSON: ' + e.message; }
    }

    private jsonToStructured(json: string): void {
        const cfg = JSON.parse(json);
        this.showBreakdown = cfg.showBreakdown !== false;
        this.autoCalculate = cfg.autoCalculate !== false;

        this.preprocRules = (cfg.preprocessingRules || []).map((r: any) => ({
            targetCollectionKey: r.targetCollectionKey || '',
            sourceField: r.sourceField || '',
            targetField: r.targetField || '',
            operation: r.operation || 'ageFromId'
        }));

        this.aggRows = (cfg.globalAggregations || []).map((a: any) => ({
            key: a.key || '', collectionKey: a.collectionKey || '',
            fieldKey: a.fieldKey || '', operation: a.operation || 'count'
        }));
        this.globalVars = this.deserializeVars(cfg.variables || []);
        this.globalFormulas = this.deserializeFormulas(cfg.formulas || []);

        const d = cfg.display || {};
        this.displayConfig = {
            finalResultTemplate:  d.finalResultTemplate  || '',
            breakdownTitle:       d.breakdownTitle       || '',
            rowResultsTitle:      d.rowResultsTitle      || '',
            emptyStateText:       d.emptyStateText       || '',
            showCalculationSteps: !!d.showCalculationSteps
        };

        const rm = cfg.rowMode;
        this.rowMode = rm ? {
            enabled: rm.enabled !== false,
            sourceCollectionKey:  rm.sourceCollectionKey || '',
            itemAlias:            rm.itemAlias || '',
            variables:            this.deserializeVars(rm.variables || []),
            formulas:             this.deserializeFormulas(rm.formulas || []),
            postRowFormulas:      this.deserializeFormulas(cfg.postRowFormulas || []),
            rowResultTemplate:    rm.rowResultTemplate || ''
        } : { enabled: false, sourceCollectionKey: '', itemAlias: '', variables: [], formulas: [], postRowFormulas: [], rowResultTemplate: '' };
    }

    private deserializeVars(vars: any[]): VarRow[] {
        return vars.map(v => ({
            key: v.key || '', defaultValue: v.defaultValue ?? 0, expanded: true,
            cases: (v.cases || []).map((c: any) => ({
                value: c.value ?? 0,
                conditions: (c.when || []).map((w: any) => ({
                    field: w.field || '', operator: w.operator || 'equals',
                    value: w.value ?? 0, value2: w.value2
                }))
            }))
        }));
    }

    private deserializeFormulas(formulas: any[]): FormulaRow[] {
        return formulas.map(f => ({
            key: f.key || '', label: f.label || '',
            expression: f.expression || '', includeInTotal: f.includeInTotal !== false
        }));
    }

    // ─── Tab switching ─────────────────────────────────────────────────────
    switchTab(tab: 'configure' | 'json'): void {
        if (tab === 'json') {
            this.onStructuredChange();
        } else if (this.rawJson.trim()) {
            try { this.jsonToStructured(this.rawJson); this.jsonError = ''; }
            catch (e: any) { this.jsonError = 'Invalid JSON: ' + e.message; }
        }
        this.activeTab = tab;
    }

    // ─── Save ──────────────────────────────────────────────────────────────
    save(): void {
        if (this.jsonError) return;
        this.onStructuredChange();
        this.update.emit({ settings: { title: this.localTitle, calculatorConfigJson: this.rawJson } });
    }
}
