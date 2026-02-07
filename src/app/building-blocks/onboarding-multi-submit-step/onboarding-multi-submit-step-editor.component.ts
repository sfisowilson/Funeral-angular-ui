import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { DynamicFileUploadComponent, UploadedFile } from '../../shared/components/dynamic-file-upload/dynamic-file-upload.component';
import { OnboardingStepAdminService, OnboardingStepConfigurationDto, ListDisplayColumnConfig } from '../../core/services/onboarding-step-admin.service';
import { FormDto, FormServiceProxy, DynamicEntityServiceProxy, DynamicEntityTypeDto, FileUploadServiceProxy } from '../../core/services/service-proxies';
import type {
    CalculatorCondition,
    CalculatorConfig,
    CalculatorFormula,
    CalculatorVariableDerivation
} from '../../shared/components/embedded-calculator/embedded-calculator.component';

interface StepLimitRule {
    targetValue: string;
    minItems: number;
    maxItems: number;
}

interface DataValidationRule {
    type: 'uniqueInList' | 'notMatchMemberField';
    fieldKey: string;
    targetFieldKey?: string; // used for notMatchMemberField
    errorMessage: string;
}

interface EditorMultiSubmitStepConfig {
    id: string;
    title: string;
    type: 'form' | 'terms' | 'complete';
    isMultiSubmit: boolean;
    formId?: string;
    stepKey: string;
    columns: ListDisplayColumnConfig[];
    termsContent?: string;
    termsPdfPath?: string;
    termsPdfName?: string;

    validationRules?: DataValidationRule[];

    // Calculator configuration (stored as JSON string at runtime)
    calculatorEnabled?: boolean;
    calculatorRowResultTemplate?: string;
    calculatorFinalResultTemplate?: string;
    calculatorShowRowResults?: boolean;
    calculatorShowFinalResult?: boolean;
    calculatorShowSteps?: boolean;
    calculatorRowCollectionKey?: string;
    calculatorRowItemAlias?: string;

    // Structured calculator editing (preferred)
    calculatorGlobalVariables?: CalculatorVariableDerivation[];
    calculatorGlobalFormulas?: CalculatorFormula[];
    calculatorRowVariables?: CalculatorVariableDerivation[];
    calculatorRowFormulas?: CalculatorFormula[];
    calculatorPostRowVariables?: CalculatorVariableDerivation[];
    calculatorPostRowFormulas?: CalculatorFormula[];

    // Advanced override (optional)
    calculatorUseAdvancedJson?: boolean;
    calculatorConfigJson?: string;
}

@Component({
    selector: 'app-onboarding-multi-submit-step-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, DynamicFileUploadComponent],
    templateUrl: './onboarding-multi-submit-step-editor.component.html',
    styleUrls: ['./onboarding-multi-submit-step-editor.component.scss'],
    providers: [FormServiceProxy, DynamicEntityServiceProxy, FileUploadServiceProxy]
})
export class OnboardingMultiSubmitStepEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();

    settings: any = {};
    availableSteps: OnboardingStepConfigurationDto[] = [];
    forms: FormDto[] = [];
    dynamicEntityTypes: DynamicEntityTypeDto[] = [];
    loadingForms = false;
    loadingSteps = false;
    loadingEntityTypes = false;
    editorSteps: EditorMultiSubmitStepConfig[] = [];
    saveMessage = '';
    saveError = '';

    parentFields = [
        { label: 'ID Number', value: 'idNumber' },
        { label: 'Policy Number', value: 'policyNumber' },
        { label: 'Email', value: 'email' },
        { label: 'Cell Number', value: 'cellNumber' },
        { label: 'First Name', value: 'firstName' },
        { label: 'Last Name', value: 'lastName' }
    ];

    constructor(
        private onboardingStepAdminService: OnboardingStepAdminService,
        private formService: FormServiceProxy,
        private dynamicEntityService: DynamicEntityServiceProxy
    ) {}

    ngOnInit(): void {
        this.settings = {
            title: this.config.settings?.title || 'Multi-submit onboarding step',
            minItems: this.config.settings?.minItems || 0,
            maxItems: this.config.settings?.maxItems || 0,
            validationMode: this.config.settings?.validationMode || 'simple',
            limitSourceField: this.config.settings?.limitSourceField || '',
            limitRules: this.config.settings?.limitRules || [],
            nextUrl: this.config.settings?.nextUrl || '',
            enableCompletionPdf: this.config.settings?.enableCompletionPdf === true,
            completionPdfMode: this.config.settings?.completionPdfMode || 'system',
            requireSignature: this.config.settings?.requireSignature === true,
            completionPdfUrl: this.config.settings?.completionPdfUrl || ''
        };

        this.initializeEditorSteps();
        this.loadForms();
        this.loadDynamicEntityTypes();
    }

    getAvailableFormFields(step: EditorMultiSubmitStepConfig): { label: string; value: string }[] {
        if (!step.formId) return [];
        const form = this.forms.find(f => f.id === step.formId);
        if (!form) return [];

        // Try getting fields from Dynamic Entity
        const dynamicId = (form as any).dynamicEntityTypeId;
        if (dynamicId) {
            const entity = this.dynamicEntityTypes.find(e => e.id === dynamicId);
            if (entity && entity.fieldsJson) {
                try {
                    const fields = JSON.parse(entity.fieldsJson);
                    if (Array.isArray(fields)) {
                        return fields.map((f: any) => ({ label: f.label || f.name, value: f.name }));
                    }
                } catch { }
            }
        }

        // Fallback to form fields
        if (form.fields) {
            try {
                const fields = JSON.parse(form.fields);
                if (Array.isArray(fields)) {
                    return fields.map((f: any) => ({ label: f.label || f.name, value: f.name }));
                }
            } catch { }
        }

        return [];
    }

    private generateId(index: number): string {
        return 'multi-step-' + index + '-' + Math.random().toString(36).substring(2, 9);
    }

    private initializeEditorSteps(): void {
        const rawSteps = (this.config.settings?.steps || []) as any[];
        if (rawSteps && rawSteps.length > 0) {
            this.editorSteps = rawSteps.map((s, index) => ({
                id: s.id || this.generateId(index),
                title: s.title || `Multi-submit step ${index + 1}`,
                type: (s.type as any) || 'form',
                isMultiSubmit: s.isMultiSubmit !== false,
                formId: s.formId,
                stepKey: s.stepKey || '',
                termsContent: s.termsContent,
                validationRules: (s.validationRules || []).map((r: any) => ({
                    type: r.type,
                    fieldKey: r.fieldKey,
                    targetFieldKey: r.targetFieldKey,
                    errorMessage: r.errorMessage
                })),
                termsPdfPath: s.termsPdfPath,
                termsPdfName: s.termsPdfName,
                calculatorEnabled: !!s.calculatorConfig,
                calculatorUseAdvancedJson: false,
                calculatorConfigJson: this.prettyJsonOrEmpty(s.calculatorConfig),
                calculatorRowResultTemplate: this.readCalculatorTemplate(s.calculatorConfig, 'row'),
                calculatorFinalResultTemplate: this.readCalculatorTemplate(s.calculatorConfig, 'final'),
                calculatorShowRowResults: this.readCalculatorFlag(s.calculatorConfig, 'showRowResults', true),
                calculatorShowFinalResult: this.readCalculatorFlag(s.calculatorConfig, 'showFinalResult', true),
                calculatorShowSteps: this.readCalculatorFlag(s.calculatorConfig, 'showCalculationSteps', false),
                calculatorRowCollectionKey: this.readRowCollectionKey(s.calculatorConfig),
                calculatorRowItemAlias: this.readRowItemAlias(s.calculatorConfig),
                calculatorGlobalVariables: this.readArray<CalculatorVariableDerivation>(s.calculatorConfig, (cfg) => cfg.variables),
                calculatorGlobalFormulas: this.readArray<CalculatorFormula>(s.calculatorConfig, (cfg) => cfg.formulas),
                calculatorRowVariables: this.readArray<CalculatorVariableDerivation>(s.calculatorConfig, (cfg) => cfg.rowMode?.variables),
                calculatorRowFormulas: this.readArray<CalculatorFormula>(s.calculatorConfig, (cfg) => cfg.rowMode?.formulas),
                calculatorPostRowVariables: this.readArray<CalculatorVariableDerivation>(s.calculatorConfig, (cfg) => cfg.postRowVariables),
                calculatorPostRowFormulas: this.readArray<CalculatorFormula>(s.calculatorConfig, (cfg) => cfg.postRowFormulas),
                columns: (s.columns || []).map((c: any) => ({
                    fieldKey: c.fieldKey || '',
                    header: c.header || '',
                    width: c.width,
                    format: c.format
                })) as ListDisplayColumnConfig[]
            }));

            // If calculatorConfig exists but cannot be parsed, force advanced JSON mode so we don't overwrite it.
            for (const step of this.editorSteps) {
                if (step.calculatorEnabled && step.calculatorConfigJson && !this.parseCalculatorConfig(step.calculatorConfigJson)) {
                    step.calculatorUseAdvancedJson = true;
                }
            }
        } else {
            // Backwards compatibility: fall back to single stepKey on settings
            const existingStepKey = this.config.settings?.stepKey || '';
            this.editorSteps = [
                {
                    id: this.generateId(0),
                    title: 'Multi-submit step',
                    type: 'form',
                    isMultiSubmit: true,
                    validationRules: [],
                    formId: undefined,
                    stepKey: existingStepKey,
                    columns: [],
                    termsContent: '',
                    termsPdfPath: '',
                    termsPdfName: '',
                    calculatorEnabled: false,
                    calculatorUseAdvancedJson: false,
                    calculatorConfigJson: '',
                    calculatorGlobalVariables: [],
                    calculatorGlobalFormulas: [],
                    calculatorRowVariables: [],
                    calculatorRowFormulas: [],
                    calculatorPostRowVariables: [],
                    calculatorPostRowFormulas: []
                }
            ];
        }
    }

    private normalizeKeyLoose(input: string): string {
        return String(input || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    }

    private getSuggestedCollectionKey(step: EditorMultiSubmitStepConfig): string {
        const byStepKey = this.availableSteps.find((s) => s.stepKey === step.stepKey);
        if (byStepKey?.dynamicEntityTypeKey) {
            return this.normalizeKeyLoose(byStepKey.dynamicEntityTypeKey);
        }
        return 'items';
    }

    private parseCalculatorConfig(raw: any): CalculatorConfig | null {
        if (!raw) return null;
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            } catch {
                return null;
            }
        }
        if (typeof raw === 'object') {
            return raw as CalculatorConfig;
        }
        return null;
    }

    private prettyJsonOrEmpty(raw: any): string {
        const parsed = this.parseCalculatorConfig(raw);
        if (!parsed) return '';
        try {
            return JSON.stringify(parsed, null, 2);
        } catch {
            return '';
        }
    }

    private readCalculatorTemplate(raw: any, kind: 'row' | 'final'): string {
        const cfg = this.parseCalculatorConfig(raw);
        if (!cfg) return '';
        if (kind === 'row') {
            return cfg?.rowMode?.rowResultTemplate || '';
        }
        return cfg?.display?.finalResultTemplate || '';
    }

    private readCalculatorFlag(raw: any, key: 'showRowResults' | 'showFinalResult' | 'showCalculationSteps', fallback: boolean): boolean {
        const cfg = this.parseCalculatorConfig(raw);
        if (!cfg) return fallback;
        const val = cfg?.display?.[key];
        return typeof val === 'boolean' ? val : fallback;
    }

    private readRowCollectionKey(raw: any): string {
        const cfg = this.parseCalculatorConfig(raw);
        return cfg?.rowMode?.sourceCollectionKey || '';
    }

    private readRowItemAlias(raw: any): string {
        const cfg = this.parseCalculatorConfig(raw);
        return cfg?.rowMode?.itemAlias || '';
    }

    private readArray<T>(raw: any, getter: (cfg: CalculatorConfig) => any): T[] {
        const cfg = this.parseCalculatorConfig(raw);
        if (!cfg) return [];
        const arr = getter(cfg);
        return Array.isArray(arr) ? (arr as T[]) : [];
    }

    private ensureArrays(step: EditorMultiSubmitStepConfig): void {
        step.calculatorGlobalVariables = Array.isArray(step.calculatorGlobalVariables) ? step.calculatorGlobalVariables : [];
        step.calculatorGlobalFormulas = Array.isArray(step.calculatorGlobalFormulas) ? step.calculatorGlobalFormulas : [];
        step.calculatorRowVariables = Array.isArray(step.calculatorRowVariables) ? step.calculatorRowVariables : [];
        step.calculatorRowFormulas = Array.isArray(step.calculatorRowFormulas) ? step.calculatorRowFormulas : [];
        step.calculatorPostRowVariables = Array.isArray(step.calculatorPostRowVariables) ? step.calculatorPostRowVariables : [];
        step.calculatorPostRowFormulas = Array.isArray(step.calculatorPostRowFormulas) ? step.calculatorPostRowFormulas : [];

        const normalizeDerivations = (list: CalculatorVariableDerivation[]) => {
            for (const d of list) {
                d.cases = Array.isArray(d.cases) ? d.cases : [];
                for (const c of d.cases) {
                    (c as any).when = Array.isArray((c as any).when) ? (c as any).when : [];
                    if (!(c as any).when.length) {
                        (c as any).when = [this.createDefaultCondition()];
                    }
                }
            }
        };

        normalizeDerivations(step.calculatorGlobalVariables);
        normalizeDerivations(step.calculatorRowVariables);
        normalizeDerivations(step.calculatorPostRowVariables);
    }

    private buildCalculatorConfigFromEditor(step: EditorMultiSubmitStepConfig): CalculatorConfig {
        this.ensureArrays(step);

        const cfg: CalculatorConfig = {
            autoCalculate: true,
            showBreakdown: true,
            display: {
                showRowResults: step.calculatorShowRowResults !== false,
                showFinalResult: step.calculatorShowFinalResult !== false,
                showCalculationSteps: step.calculatorShowSteps === true,
                finalResultTemplate: step.calculatorFinalResultTemplate || ''
            },
            variables: step.calculatorGlobalVariables,
            formulas: step.calculatorGlobalFormulas,
            postRowVariables: step.calculatorPostRowVariables,
            postRowFormulas: step.calculatorPostRowFormulas,
            rowMode: {
                enabled: true,
                sourceCollectionKey: step.calculatorRowCollectionKey || undefined,
                itemAlias: step.calculatorRowItemAlias || undefined,
                variables: step.calculatorRowVariables,
                formulas: step.calculatorRowFormulas,
                rowResultTemplate: step.calculatorRowResultTemplate || ''
            }
        };

        return cfg;
    }

    private syncEditorToCalculatorJson(step: EditorMultiSubmitStepConfig): void {
        if (!step.calculatorEnabled) {
            step.calculatorConfigJson = '';
            return;
        }

        if (step.calculatorUseAdvancedJson) {
            // Leave JSON as-is
            return;
        }

        try {
            const cfg = this.buildCalculatorConfigFromEditor(step);
            step.calculatorConfigJson = JSON.stringify(cfg, null, 2);
        } catch {
            this.saveError = 'Failed to generate calculator config JSON.';
        }
    }

    onCalculatorFieldChanged(step: EditorMultiSubmitStepConfig): void {
        this.saveMessage = '';
        this.saveError = '';
        this.syncEditorToCalculatorJson(step);
    }

    private createDefaultCondition(): CalculatorCondition {
        return { field: '', operator: 'equals', value: '' };
    }

    addDerivation(list: CalculatorVariableDerivation[] | undefined): void {
        if (!Array.isArray(list)) return;
        list.push({
            key: '',
            sourceField: '',
            operation: 'toNumber',
            defaultValue: 0,
            cases: []
        });
    }

    removeDerivation(list: CalculatorVariableDerivation[] | undefined, index: number): void {
        if (!Array.isArray(list)) return;
        list.splice(index, 1);
    }

    addDerivationCase(derivation: CalculatorVariableDerivation): void {
        derivation.cases = Array.isArray(derivation.cases) ? derivation.cases : [];
        derivation.cases.push({
            when: [this.createDefaultCondition()],
            value: 0
        });
    }

    removeDerivationCase(derivation: CalculatorVariableDerivation, index: number): void {
        if (!Array.isArray(derivation.cases)) return;
        derivation.cases.splice(index, 1);
    }

    addFormula(list: CalculatorFormula[] | undefined): void {
        if (!Array.isArray(list)) return;
        list.push({
            key: '',
            label: '',
            expression: '',
            includeInTotal: true
        });
    }

    removeFormula(list: CalculatorFormula[] | undefined, index: number): void {
        if (!Array.isArray(list)) return;
        list.splice(index, 1);
    }

    applyCalculatorQuickSetup(step: EditorMultiSubmitStepConfig): void {
        const suggestedCollectionKey = this.getSuggestedCollectionKey(step);

        step.calculatorEnabled = true;
        step.calculatorUseAdvancedJson = false;
        step.calculatorRowCollectionKey = step.calculatorRowCollectionKey || suggestedCollectionKey;
        step.calculatorShowRowResults = step.calculatorShowRowResults !== false;
        step.calculatorShowFinalResult = step.calculatorShowFinalResult !== false;
        step.calculatorShowSteps = step.calculatorShowSteps === true;
        this.ensureArrays(step);
        this.syncEditorToCalculatorJson(step);
    }

    private loadSteps(): void {
        this.loadingSteps = true;
        this.onboardingStepAdminService.getAllSteps().subscribe({
            next: (steps) => {
                // Only show steps that are bound to a dynamic entity (multi-submit capable)
                this.availableSteps = (steps || []).filter((s) => !!s.dynamicEntityTypeKey);
                this.loadingSteps = false;
            },
            error: () => {
                this.loadingSteps = false;
                this.saveError = 'Failed to load onboarding steps.';
            }
        });
    }

    private loadForms(): void {
        this.loadingForms = true;
        this.formService.form_GetAll(1, 100, true).subscribe({
            next: (response) => {
                const result = response.result;
                this.forms = (result?.forms || []) as FormDto[];
                this.loadingForms = false;
                // After forms are loaded, load onboarding steps for mapping form -> stepKey
                this.loadSteps();
            },
            error: () => {
                this.loadingForms = false;
                this.saveError = 'Failed to load forms.';
            }
        });
    }

    private loadDynamicEntityTypes(): void {
        this.loadingEntityTypes = true;
        this.dynamicEntityService.entityType_GetAll().subscribe({
            next: (resp) => {
                this.dynamicEntityTypes = resp?.result || [];
                this.loadingEntityTypes = false;
            },
            error: () => {
                // Non-fatal for this editor; fall back to form fields if needed
                this.dynamicEntityTypes = [];
                this.loadingEntityTypes = false;
            }
        });
    }

    private getDynamicEntityTypeById(id: string | null | undefined): DynamicEntityTypeDto | null {
        if (!id) {
            return null;
        }

        return this.dynamicEntityTypes.find((et) => et.id === id) || null;
    }

    addStep(): void {
        const index = this.editorSteps.length;
        this.editorSteps.push({
            id: this.generateId(index),
            title: `Multi-submit step ${index + 1}`,
            type: 'form',
            isMultiSubmit: true,
            stepKey: '',
            columns: []
        });
    }

    removeStep(index: number): void {
        this.editorSteps.splice(index, 1);
    }

    moveStepUp(index: number): void {
        if (index <= 0) return;
        const temp = this.editorSteps[index - 1];
        this.editorSteps[index - 1] = this.editorSteps[index];
        this.editorSteps[index] = temp;
    }

    moveStepDown(index: number): void {
        if (index >= this.editorSteps.length - 1) return;
        const temp = this.editorSteps[index + 1];
        this.editorSteps[index + 1] = this.editorSteps[index];
        this.editorSteps[index] = temp;
    }

    onFormChange(step: EditorMultiSubmitStepConfig): void {
        this.saveMessage = '';
        this.saveError = '';

        if (step.type !== 'form') {
            return;
        }

        if (!step.formId) {
            step.stepKey = '';
            step.columns = [];
            return;
        }

        const selectedForm = this.forms.find((f) => f.id === step.formId) || null;
        if (!selectedForm) {
            step.stepKey = '';
            step.columns = [];
            return;
        }

        // Try to find an onboarding step that is bound to the same form
        // OR to the same dynamic entity key as the selected form.
        const matchingStep = this.availableSteps.find((s) => {
            if (s.formId && s.formId === step.formId && !!s.dynamicEntityTypeKey) {
                return true;
            }

            const formDynamicKey = (selectedForm as any).dynamicEntityTypeKey as string | null | undefined;
            if (formDynamicKey && s.dynamicEntityTypeKey && s.dynamicEntityTypeKey === formDynamicKey) {
                return true;
            }

            return false;
        });
        // Auto-assign stepKey when we can infer it from the selected form.
        // The runtime widget can also infer stepKey from the current onboarding context,
        // so this mapping is a best-effort convenience (not required).
        step.stepKey = matchingStep ? matchingStep.stepKey : '';

        // Always refresh suggested columns when the form changes.
        step.columns = [];

        // Prefer columns from the linked dynamic entity type (if any)
        const dynamicEntityTypeId = (selectedForm as any).dynamicEntityTypeId as string | null | undefined;
        const entityType = this.getDynamicEntityTypeById(dynamicEntityTypeId);

        if (entityType && entityType.fieldsJson) {
            try {
                const parsed = JSON.parse(entityType.fieldsJson as any);
                if (Array.isArray(parsed)) {
                    step.columns = parsed.map((f: any) => ({
                        fieldKey: f.name || '',
                        header: f.label || f.name || '',
                        width: '',
                        format: ''
                    }));
                    return;
                }
            } catch {
                // Fall back to form fields if dynamic entity fields cannot be parsed
            }
        }

        // Fall back to suggesting columns from the form fields JSON
        if (selectedForm.fields) {
            try {
                const parsed = JSON.parse(selectedForm.fields as any);
                if (Array.isArray(parsed)) {
                    step.columns = parsed.map((f: any) => ({
                        fieldKey: f.name || '',
                        header: f.label || f.name || '',
                        width: '',
                        format: ''
                    }));
                }
            } catch {
                // Ignore invalid JSON; user can configure columns manually
            }
        }
    }

    addColumn(stepIndex: number): void {
        this.editorSteps[stepIndex].columns.push({
            fieldKey: '',
            header: '',
            width: '',
            format: ''
        });
    }

    removeColumn(stepIndex: number, columnIndex: number): void {
        this.editorSteps[stepIndex].columns.splice(columnIndex, 1);
    }

    onTermsFileUploaded(step: EditorMultiSubmitStepConfig, files: UploadedFile[]): void {
        if (files && files.length > 0) {
            step.termsPdfPath = files[0].filePath;
            step.termsPdfName = files[0].fileName;
            this.saveMessage = ''; // Clear prior messages
        }
    }

    addLimitRule(): void {
        this.settings.limitRules.push({
            targetValue: '',
            minItems: 1,
            maxItems: 1
        });
    }

    addValidationRule(step: EditorMultiSubmitStepConfig): void {
        if (!step.validationRules) {
            step.validationRules = [];
        }
        step.validationRules.push({
            type: 'uniqueInList',
            fieldKey: '',
            errorMessage: 'Duplicate value found.'
        });
    }

    removeValidationRule(step: EditorMultiSubmitStepConfig, index: number): void {
        if (step.validationRules) {
            step.validationRules.splice(index, 1);
        }
    }

    removeLimitRule(index: number): void {
        this.settings.limitRules.splice(index, 1);
    }

    save(): void {
        this.saveMessage = '';
        this.saveError = '';

        if (!this.editorSteps.length) {
            this.saveError = 'Please add at least one step.';
            return;
        }

        const multiSteps = this.editorSteps.filter((s) => s.type === 'form' && s.isMultiSubmit);
        if (!multiSteps.length) {
            this.saveError = 'Please mark at least one form step as multi-submit.';
            return;
        }

        const cleanedSteps = this.editorSteps.map((s, index) => {
            this.ensureArrays(s);
            // Always refresh generated JSON unless advanced override is enabled.
            this.syncEditorToCalculatorJson(s);

            let calculatorConfig: string | undefined;
            if (s.type === 'form' && s.calculatorEnabled) {
                if (s.calculatorUseAdvancedJson && s.calculatorConfigJson && String(s.calculatorConfigJson).trim().length) {
                    calculatorConfig = String(s.calculatorConfigJson);
                } else {
                    const cfg = this.buildCalculatorConfigFromEditor(s);
                    calculatorConfig = JSON.stringify(cfg, null, 2);
                }
            }

            return {
            id: s.id,
            title: s.title || `Multi-submit step ${index + 1}`,
            type: s.type,
            isMultiSubmit: s.isMultiSubmit,
            formId: s.type === 'form' ? s.formId : undefined,
            stepKey: s.type === 'form' ? s.stepKey : '',
            termsContent: s.type === 'terms' ? s.termsContent : undefined,
            termsPdfPath: s.type === 'terms' ? s.termsPdfPath : undefined,
            termsPdfName: s.type === 'terms' ? s.termsPdfName : undefined,
            validationRules: (s.validationRules || [])
                .filter(r => r.fieldKey)
                .map(r => ({
                    type: r.type,
                    fieldKey: r.fieldKey,
                    targetFieldKey: r.targetFieldKey,
                    errorMessage: r.errorMessage
                })),
            calculatorConfig,
            columns: (s.columns || []).filter((c) => c.fieldKey && c.header)
            };
        });

        this.config.settings = {
            ...this.config.settings,
            title: this.settings.title,
            minItems: this.settings.minItems,
            maxItems: this.settings.maxItems,
            validationMode: this.settings.validationMode,
            limitSourceField: this.settings.limitSourceField,
            limitRules: this.settings.limitRules,
            nextUrl: this.settings.nextUrl,
            enableCompletionPdf: this.settings.enableCompletionPdf === true,
            completionPdfMode: this.settings.completionPdfMode || 'system',
            requireSignature: this.settings.requireSignature === true,
            completionPdfUrl: this.settings.completionPdfUrl || '',
            steps: cleanedSteps
        };

        this.saveMessage = 'Settings saved.';
        this.update.emit(this.config.settings);
    }
}
