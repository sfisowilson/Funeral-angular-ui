import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, OnChanges, Output, EventEmitter, SimpleChanges, ElementRef, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WidgetConfig } from '../widget-config';
import { OnboardingMultiSubmitService, MultiSubmitStepContextDto, SaveMultiSubmitRecordDto } from '../../core/services/onboarding-multi-submit.service';
import { EmbeddedCalculatorComponent, CalculatorConfig, CalculatorResult } from '../../shared/components/embedded-calculator/embedded-calculator.component';
import { OnboardingStepConfigurationClient } from '../../core/services/onboarding-step-configuration.client';
import { OnboardingCalculatorAggregatorService } from '../../core/services/onboarding-calculator-aggregator.service';
import { PublicFormService } from '../../core/services/public-form.service';
import { OnboardingStepType, OnboardingPdfServiceProxy, MemberServiceProxy, SaveSignatureDto, MemberProfileCompletionServiceProxy } from '../../core/services/service-proxies';
import { saIdNumberValidator } from '../../shared/validators/sa-id-number.validator';
import { DynamicFileUploadComponent } from '../../shared/components/dynamic-file-upload/dynamic-file-upload.component';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';

export interface StepLimitRule {
    targetValue: string; // The value to match i.e. "Plan A" or "123"
    minItems: number;
    maxItems: number;
}

export interface DataValidationRule {
    type: 'uniqueInList' | 'notMatchMemberField';
    fieldKey: string;
    targetFieldKey?: string; // For notMatchMemberField (e.g., 'idNumber')
    errorMessage?: string;
}

interface RowLimitConditionConfig {
    sourceEntityTypeId?: string;
    sourceFieldKey?: string;
    sourceKey: string;
    equalsValue: string;
}

interface RowLimitRuleConfig {
    order: number;
    conditions: RowLimitConditionConfig[];
    maxItems: number;
    errorMessage: string;
}

interface ListDisplayColumnConfig {
    fieldKey: string;
    header: string;
    width?: string;
    format?: string;
}

interface ListDisplayActionsConfig {
    add: boolean;
    edit: boolean;
    delete: boolean;
    view: boolean;
}

interface ListDisplayConstraintsConfig {
    minItems?: number | null;
    maxItems?: number | null;
    enforceOnNavigation?: boolean;
    showWarningsOnly?: boolean;
    labels?: {
        singular?: string;
        plural?: string;
    };
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

@Component({
    selector: 'app-onboarding-multi-submit-step',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, EmbeddedCalculatorComponent, DynamicFileUploadComponent],
    templateUrl: './onboarding-multi-submit-step.component.html',
    styleUrls: ['./onboarding-multi-submit-step.component.scss'],
    providers: [OnboardingPdfServiceProxy, MemberServiceProxy, MemberProfileCompletionServiceProxy]
})
export class OnboardingMultiSubmitStepComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() config!: WidgetConfig | any;
    @Output() next = new EventEmitter<void>();
    @ViewChild('signatureCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

    loading = false;
    error = '';

    stepKey = '';
    context: MultiSubmitStepContextDto | null = null;
    displayColumns: ListDisplayColumnConfig[] = [];

    actions: ListDisplayActionsConfig = {
        add: true,
        edit: true,
        delete: true,
        view: false
    };

    viewRecords: { record: any; parsed: any | null }[] = [];

    activeRecordId: string | null = null;
    activeDisplayName = '';

    formDefinition: any | null = null;
    formFields: DynamicFormField[] = [];
    activeFormGroup: FormGroup | null = null;
    formLoadError = '';
    private activeOriginalData: Record<string, any> = {};

    // Rules
    minItems = 0;
    maxItems = 0;
    enforceOnNavigation = true;
    showWarningsOnly = false;
    singularLabel = 'Item';
    pluralLabel = 'Items';
    validationMode: 'simple' | 'dynamic' = 'simple';
    limitSourceField = '';
    limitRules: StepLimitRule[] = [];
    validationRules: DataValidationRule[] = [];
    rowLimitRules: RowLimitRuleConfig[] = [];
    private activeRowLimitRule: RowLimitRuleConfig | null = null;
    private rowLimitSourceValues: Record<string, string[]> = {};
    effectiveMin = 0;
    effectiveMax = 0;
    nextUrl: string | undefined;

    // Member Context for Validation
    memberProfile: any | null = null;
    isMemberProfileLoaded = false;

    // Embedded calculator integration
    calculatorConfig: CalculatorConfig | null = null;
    calculatorFormData: any = {};
    calculatorResult: CalculatorResult | null = null;

    // Terms state
    activeTermsContent: string | undefined;
    activeTermsPdfPath: string | undefined;
    activeTermsPdfName: string | undefined;
    termsAgreed = false;
    isMultiSubmit = true;

    // Completion / Signature state
    isCompleteStep = false;
    completionPdfUrl: SafeResourceUrl | null = null;
    requireSignature = false;
    isDrawing = false;
    isCompletingFlow = false;
    private ctx!: CanvasRenderingContext2D;
    private lastX = 0;
    private lastY = 0;

    // Internal step management
    configuredSteps: any[] = [];
    currentStepIndex = 0;
    private stepStates: Record<number, any> = {};

    // Approval Workflow
    submitButtonLabel = 'Finish & Submit';
    savedSignatureUrl: string | null = null;
    isSavingSignature = false;

    constructor(
        private fb: FormBuilder,
        private multiSubmitService: OnboardingMultiSubmitService,
        private onboardingStepConfigurationClient: OnboardingStepConfigurationClient,
        private publicFormService: PublicFormService,
        private onboardingPdfService: OnboardingPdfServiceProxy,
        private memberService: MemberServiceProxy,
        private memberProfileCompletionService: MemberProfileCompletionServiceProxy,
        private tenantSettingsService: TenantSettingsService,
        private sanitizer: DomSanitizer,
        private router: Router,
        private route: ActivatedRoute,
        private http: HttpClient,
        private cdr: ChangeDetectorRef,
        private calculatorAggregator: OnboardingCalculatorAggregatorService
    ) {}

    private initializeButtonLabel(): void {
        const settings = this.tenantSettingsService.currentSettings;
        if (settings && settings.requiresOnboardingApproval) {
            this.submitButtonLabel = settings.onboardingSubmitButtonLabel || 'Submit Application';
        }
    }

    ngAfterViewInit(): void {
        // Canvas might not be in DOM initially (hidden by ngIf)
        // We initialize it on demand when isCompleteStep becomes true
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config) {
            const settings = (this.config && this.config.settings) || {};

            // Prevent infinite loops if the config object reference changes but content is effectively same.
            // This happens often if the parent component constructs the config object on every check.
            const prevConfig = changes['config'].previousValue;
            if (prevConfig) {
                const prevSettings = (prevConfig && prevConfig.settings) || {};
                // Simple check on key properties to avoid deep comparison overhead if possible, 
                // but since settings is arbitrary, we might need to rely on reference or shallow check of known properties.
                // If it's the exact same logic regenerating it, JSON stringify often helps for small objects.
                if (JSON.stringify(prevSettings) === JSON.stringify(settings)) {
                    return;
                }
            }

            this.minItems = typeof settings.minItems === 'number' ? settings.minItems : 0;
            this.maxItems = typeof settings.maxItems === 'number' ? settings.maxItems : 0;
            this.validationMode = settings.validationMode || 'simple';
            this.limitSourceField = settings.limitSourceField || '';
            this.limitRules = Array.isArray(settings.limitRules) ? settings.limitRules : [];
            this.validationRules = Array.isArray(settings.validationRules) ? settings.validationRules : [];
            this.nextUrl = settings.nextUrl;

            this.resolveEffectiveLimits();
            this.ensureMemberContextIfNeeded();
            console.log('OnboardingMultiSubmitStep config updated:', { minItems: this.minItems, nextUrl: this.nextUrl });
        }
    }

    private normalizeKey(value: string | null | undefined): string {
        return (value || '').trim().toLowerCase();
    }

    private normalizeKeyLoose(value: string | null | undefined): string {
        return this.normalizeKey(value).replace(/[^a-z0-9]/g, '');
    }

    private resolveEffectiveLimits(): void {
        // Defaults
        this.effectiveMin = this.minItems;
        this.effectiveMax = this.maxItems;

        if (this.validationMode === 'dynamic') {
            if (!this.limitSourceField) {
                console.warn('resolveEffectiveLimits: Dynamic mode enabled but no limitSourceField configured.');
            } else {
                // Try to find the value
                let sourceValue: string | null = null;

                // 1. Query Params
                const params = this.route.snapshot.queryParams;
                if (params && params[this.limitSourceField]) {
                    sourceValue = params[this.limitSourceField];
                }

                // 2. Session Storage (raw)
                if (!sourceValue) {
                    sourceValue = sessionStorage.getItem(this.limitSourceField);
                }

                // 3. Session Storage (structured - onboarding_session)
                if (!sourceValue) {
                    try {
                        const sessionJson = sessionStorage.getItem('onboarding_session');
                        if (sessionJson) {
                            const sessionData = JSON.parse(sessionJson);
                            if (sessionData && sessionData[this.limitSourceField]) {
                                sourceValue = sessionData[this.limitSourceField];
                            }
                        }
                    } catch { /* ignore */ }
                }

                // 4. Session Storage (structured - form_data fallback)
                if (!sourceValue) {
                    try {
                        const formDataJson = sessionStorage.getItem('form_data');
                        if (formDataJson) {
                            const formData = JSON.parse(formDataJson);
                            if (formData && formData[this.limitSourceField]) {
                                sourceValue = formData[this.limitSourceField];
                            }
                        }
                    } catch { /* ignore */ }
                }

                if (!sourceValue) {
                    console.log(`resolveEffectiveLimits: Computed value for field '${this.limitSourceField}' not found.`);
                } else {
                    const normalizedValue = String(sourceValue).trim().toLowerCase();

                    // Find matching rule
                    const rule = this.limitRules.find((r) => r.targetValue && r.targetValue.trim().toLowerCase() === normalizedValue);

                    if (rule) {
                        console.log(`resolveEffectiveLimits: Matched rule for value '${sourceValue}'. Min=${rule.minItems}, Max=${rule.maxItems}`);
                        this.effectiveMin = rule.minItems;
                        this.effectiveMax = rule.maxItems;
                    } else {
                        console.log(`resolveEffectiveLimits: No rule matched for value '${sourceValue}'. Using defaults.`);
                    }
                }
            }
        }

        // Row-limit rules (configured on the form) are evaluated after simple/dynamic limits
        // and can further reduce the effectiveMax for this step based on previous answers.
        this.applyRowLimitRules();
    }

    private getSessionValue(key: string): string | null {
        if (!key) {
            return null;
        }

        // 1. Query Params
        const params = this.route.snapshot.queryParams;
        if (params && params[key] != null) {
            return String(params[key]);
        }

        // 2. Session Storage (raw)
        const direct = sessionStorage.getItem(key);
        if (direct) {
            return direct;
        }

        // 3. onboarding_session JSON
        try {
            const sessionJson = sessionStorage.getItem('onboarding_session');
            if (sessionJson) {
                const sessionData = JSON.parse(sessionJson);
                if (sessionData && sessionData[key] != null) {
                    return String(sessionData[key]);
                }
            }
        } catch {
            // ignore
        }

        // 4. form_data JSON (fallback)
        try {
            const formDataJson = sessionStorage.getItem('form_data');
            if (formDataJson) {
                const formData = JSON.parse(formDataJson);
                if (formData && formData[key] != null) {
                    return String(formData[key]);
                }
            }
        } catch {
            // ignore
        }

        return null;
    }

    private applyRowLimitRules(): void {
        this.activeRowLimitRule = null;

        if (!this.rowLimitRules || this.rowLimitRules.length === 0) {
            return;
        }

        // Evaluate rules in ascending order; first match wins.
        const ordered = [...this.rowLimitRules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        let matchedMax: number | null = null;

        for (const rule of ordered) {
            if (!rule.conditions || rule.conditions.length === 0) {
                continue;
            }

            let allMatch = true;
            for (const cond of rule.conditions) {
                const expected = String(cond.equalsValue || '').trim().toLowerCase();
                if (!expected) {
                    allMatch = false;
                    break;
                }

                let matched = false;

                // Preferred path: dynamic entity source (entity + field) as configured in admin UI
                if (cond.sourceEntityTypeId && cond.sourceFieldKey) {
                    const cacheKey = `${cond.sourceEntityTypeId}|${cond.sourceFieldKey.trim().toLowerCase()}`;
                    const values = this.rowLimitSourceValues[cacheKey];

                    if (Array.isArray(values) && values.length > 0) {
                        matched = values.some((v) => String(v || '').trim().toLowerCase() === expected);
                    }
                }

                // Backwards-compatible fallback: use a raw session key when no entity/field is specified
                if (!matched && !cond.sourceEntityTypeId && cond.sourceKey) {
                    const value = this.getSessionValue(cond.sourceKey);
                    if (value != null) {
                        const normalizedActual = String(value).trim().toLowerCase();
                        matched = normalizedActual === expected;
                    }
                }

                if (!matched) {
                    allMatch = false;
                    break;
                }
            }

            if (allMatch) {
                this.activeRowLimitRule = rule;
                if (rule.maxItems > 0) {
                    matchedMax = rule.maxItems;
                }
                break;
            }
        }

        // When row-limit rules exist, defaults (static/dynamic) should only apply if there are no rules at all.
        // If no rule matched, treat as unlimited for max-items; otherwise use the matched rule's max.
        if (matchedMax != null) {
            this.effectiveMax = matchedMax;
        } else {
            this.effectiveMax = 0; // unlimited when rules exist but none match
        }
    }

    private loadRowLimitSourceValues(): void {
        this.rowLimitSourceValues = {};

        if (!this.rowLimitRules || this.rowLimitRules.length === 0) {
            this.applyRowLimitRules();
            return;
        }

        const lookups: { cacheKey: string; entityTypeId: string; fieldKey: string }[] = [];

        for (const rule of this.rowLimitRules) {
            if (!rule.conditions) continue;
            for (const cond of rule.conditions) {
                if (!cond.sourceEntityTypeId || !cond.sourceFieldKey) continue;
                const cacheKey = `${cond.sourceEntityTypeId}|${cond.sourceFieldKey.trim().toLowerCase()}`;
                if (!lookups.some((l) => l.cacheKey === cacheKey)) {
                    lookups.push({ cacheKey, entityTypeId: cond.sourceEntityTypeId, fieldKey: cond.sourceFieldKey });
                }
            }
        }

        if (lookups.length === 0) {
            this.applyRowLimitRules();
            return;
        }

        const requests = lookups.map((l) =>
            this.multiSubmitService.getDynamicFieldValues(l.entityTypeId, l.fieldKey)
        );

        forkJoin(requests).subscribe({
            next: (results) => {
                results.forEach((values, index) => {
                    const lookup = lookups[index];
                    this.rowLimitSourceValues[lookup.cacheKey] = Array.isArray(values) ? values : [];
                });

                this.applyRowLimitRules();
            },
            error: () => {
                // On error, log and fall back to defaults (no matches => unlimited)
                console.error('Failed to resolve dynamic field values for row-limit rules');
                this.rowLimitSourceValues = {};
                this.applyRowLimitRules();
            }
        });
    }

    private ensureMemberContextIfNeeded(): void {
        const needsMemberContext = this.validationRules.some(r => r.type === 'notMatchMemberField');
        if (needsMemberContext && !this.memberProfile && !this.isMemberProfileLoaded) {
            this.isMemberProfileLoaded = true; // Mark as loading/loaded
            
            // Re-use logic to get current member via profile status since we don't have a direct session service handy here
            this.memberProfileCompletionService.profileCompletion_GetMyStatus().subscribe({
                next: (status) => {
                    const id = status.result?.profileCompletion?.memberId;
                    if (id) {
                         this.memberService.member_GetById(id).subscribe({
                            next: (res) => {
                                this.memberProfile = res.result;
                                console.log('Member context loaded for validation rules', this.memberProfile);
                            },
                            error: (err) => console.error('Failed to load member details for validation', err)
                        });
                    }
                },
                error: (err) => console.error('Failed to load member context for validation', err)
            });
        }
    }

    private validateRecord(data: Record<string, any>): string | null {
        if (!this.validationRules || this.validationRules.length === 0) {
            return null;
        }

        for (const rule of this.validationRules) {
            const fieldValue = data[rule.fieldKey];

            // Skip validation if value is empty/null, let required validators handle that
            if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
                continue;
            }

            const fieldLabel = rule.fieldKey; // Enhancement: We could look up the label from formFields
            const fieldDisplay = this.formFields.find(f => f.name === rule.fieldKey)?.label || rule.fieldKey;

            if (rule.type === 'uniqueInList') {
                const normalizedValue = String(fieldValue).trim().toLowerCase();
                // Check existing records
                const isDuplicate = this.records.some(r => {
                    // Skip self if editing
                    if (this.activeRecordId && r.id === this.activeRecordId) return false;

                    // Parse JSON if needed
                    let recordData = r.dataJson ? JSON.parse(r.dataJson) : {};
                    const recordValue = recordData[rule.fieldKey];
                    return recordValue && String(recordValue).trim().toLowerCase() === normalizedValue;
                });

                if (isDuplicate) {
                    return rule.errorMessage || `${fieldDisplay} has already been used in this list.`;
                }
            }

            if (rule.type === 'notMatchMemberField') {
                if (!this.memberProfile) {
                    console.warn('Skipping validation rule: Member profile not loaded yet.');
                    continue;
                }

                const targetKey = rule.targetFieldKey || rule.fieldKey;
                // Since memberProfile structure can vary (DTO vs Entity), try matching keys roughly
                // Most member DTOs allow direct access or camelCase props
                const memberValue = (this.memberProfile as any)[targetKey] || 
                                    (this.memberProfile as any)[targetKey.charAt(0).toLowerCase() + targetKey.slice(1)];
                
                if (memberValue) {
                    const normalizedValue = String(fieldValue).trim().toLowerCase();
                    const normalizedMemberValue = String(memberValue).trim().toLowerCase();

                    if (normalizedValue === normalizedMemberValue) {
                        return rule.errorMessage || `${fieldDisplay} cannot be the same as the main member's ${targetKey}.`;
                    }
                }
            }
        }

        return null;
    }

    ngOnInit(): void {
        this.initializeButtonLabel();

        // Start each widget instance with a clean aggregated calculator state
        // so cross-step calculations only consider the current flow's data.
        this.calculatorAggregator.reset();
        const settings = (this.config && this.config.settings) || {};
        this.configuredSteps = (settings.steps || []) as any[];

        // Parse rules
        this.minItems = typeof settings.minItems === 'number' ? settings.minItems : 0;
        this.maxItems = typeof settings.maxItems === 'number' ? settings.maxItems : 0;
        this.validationMode = settings.validationMode || 'simple';
        this.limitSourceField = settings.limitSourceField || '';
        this.limitRules = Array.isArray(settings.limitRules) ? settings.limitRules : [];
        this.validationRules = Array.isArray(settings.validationRules) ? settings.validationRules : [];
        this.nextUrl = settings.nextUrl;

        this.resolveEffectiveLimits();
        this.ensureMemberContextIfNeeded();

        if (this.configuredSteps.length > 0) {
            this.currentStepIndex = 0;
            this.loadInternalStep(this.configuredSteps[0]);
        } else {
            // Legacy fallback: pretend the settings object itself is the step configuration
            this.loadInternalStep(settings);
        }
    }

    private loadInternalStep(stepConfig: any): void {
        console.log('loadInternalStep called with:', stepConfig);
        const settings = (this.config && this.config.settings) || {};

        // Merge validation rules from step config
        const globalValidationRules = Array.isArray(settings.validationRules) ? settings.validationRules : [];
        const stepValidationRules = Array.isArray(stepConfig.validationRules) ? stepConfig.validationRules : [];
        this.validationRules = [...globalValidationRules, ...stepValidationRules];
        
        this.resolveEffectiveLimits();
        this.ensureMemberContextIfNeeded();

        // Restore state if available
        const savedState = this.stepStates[this.currentStepIndex];

        // Reset view states
        this.displayColumns = [];
        this.isCompleteStep = false;
        this.savedSignatureUrl = null; // Clear stale signature state
        this.context = null;
        this.activeTermsContent = undefined;
        this.activeTermsPdfPath = undefined;
        this.error = '';

        // Check if this is a 'complete' step
        if (String(stepConfig.type).toLowerCase() === 'complete') {
            this.isCompleteStep = true;
            console.log('loadInternalStep: Detected completion step.');
            // Prefer step-level config, fall back to global settings
            this.requireSignature = (stepConfig.requireSignature === true) || (settings.requireSignature === true);
            
            // Merge settings for PDF loader
            const effectiveSettings = { ...settings, ...stepConfig };
            this.loadCompletionPdf(effectiveSettings);

            if (this.requireSignature) {
                this.checkExistingSignature();
            }

            // Wait for view to update so canvas is in DOM
            setTimeout(() => this.initializeCanvas(), 100);
            return;
        }

        // Determine basics from the step config
        let primaryFormId = stepConfig.formId || settings.formId;
        let primaryDynamicEntityKey = stepConfig.dynamicEntityTypeKey || settings.dynamicEntityTypeKey;
        let stepKeyOverride = stepConfig.stepKey || settings.stepKey || settings.stepKeyOverride || '';

        // Determine if this is a multi-submit step (default to true for backward compatibility)
        if (typeof stepConfig.isMultiSubmit === 'boolean') {
            this.isMultiSubmit = stepConfig.isMultiSubmit;
        } else {
            // Check if it's explicitly disabled in settings
            this.isMultiSubmit = settings.isMultiSubmit !== false;
        }

        // If stepConfig has columns, use them.
        // Note: The editor usually stores columns on the step object even if it's the only one.
        if (stepConfig.columns && Array.isArray(stepConfig.columns)) {
            this.displayColumns = stepConfig.columns.map((c: any) => ({
                fieldKey: c.fieldKey || '',
                header: c.header || '',
                width: c.width,
                format: c.format
            }));
        }

        // Logic to resolve stepKey
        this.stepKey = stepKeyOverride;

        // Backend requires stepKey. If it's not explicitly configured, infer it by
        // matching the widget's configured formId to an enabled onboarding step.
        if (this.stepKey) {
            this.loadContext(this.stepKey);
            return;
        }

        // No manual stepKey: if a formId is configured, derive a stable step key
        // and let the backend resolve the dynamic entity type from the form.
        if (primaryFormId) {
            this.stepKey = `form:${primaryFormId}`;
            this.loadContext(this.stepKey);
            return;
        }

        // If this widget is placed on a terms/complete step and no form is configured,
        // we cannot resolve a stepKey automatically.
        if (!primaryFormId && !primaryDynamicEntityKey) {
            if (stepConfig.type === 'terms') {
                if (savedState && savedState.hasOwnProperty('termsAgreed')) {
                    this.termsAgreed = savedState.termsAgreed;
                } else {
                    this.termsAgreed = false;
                }

                // Check for manual configuration first
                if (stepConfig.termsContent || stepConfig.termsPdfPath) {
                    this.activeTermsContent = stepConfig.termsContent;
                    this.activeTermsPdfPath = stepConfig.termsPdfPath;
                    this.activeTermsPdfName = stepConfig.termsPdfName;

                    this.loading = false;
                    this.error = '';
                    this.context = null; // Ensure list view is hidden
                    return;
                }

                this.loading = true;
                this.error = '';
                this.onboardingStepConfigurationClient.getAllSteps().subscribe({
                    next: (steps) => {
                        // Find a step with stepType = TermsAndConditions (3)
                        // The generated enum might be _0, _1, ... so we use the value 3
                        // Or cast to any if the enum names are wonky in the proxy
                        const termsStep = steps.find((s) => s.stepType === OnboardingStepType._3);
                        if (termsStep && termsStep.stepKey) {
                            this.stepKey = termsStep.stepKey;
                            this.loadContext(this.stepKey);
                        } else {
                            this.error = 'No configured Terms & Conditions step found for this tenant.';
                            this.loading = false;
                        }
                    },
                    error: () => {
                        this.error = 'Failed to resolve Terms step configuration.';
                        this.loading = false;
                    }
                });
                return;
            }

            // If we are iterating internal steps, maybe this step is just a placeholder?
            // But for now, show error.
            this.error = 'Multi-submit step is not configured (no stepKey and no form/dynamic entity mapping found).';
            return;
        }

        this.loading = true;
        this.error = '';
        this.onboardingStepConfigurationClient.getAllSteps().subscribe({
            next: (steps) => {
                const enabledSteps = steps || [];

                // First attempt: match step by the same formId
                const byForm = primaryFormId ? (enabledSteps.find((s: any) => !!s && s.formId === primaryFormId && !!s.stepKey) as any) : null;

                if (byForm?.stepKey) {
                    this.stepKey = byForm.stepKey;
                    this.loadContext(this.stepKey);
                    return;
                }

                // Second attempt: match by dynamic entity type key (if present in widget config)
                if (primaryDynamicEntityKey) {
                    const targetKey = this.normalizeKey(primaryDynamicEntityKey);
                    const targetKeyLoose = this.normalizeKeyLoose(primaryDynamicEntityKey);
                    const byDynamicKeyFromWidget = enabledSteps.find((s: any) => !!s && (this.normalizeKey(s.dynamicEntityTypeKey) === targetKey || this.normalizeKeyLoose(s.dynamicEntityTypeKey) === targetKeyLoose) && !!s.stepKey) as any;

                    if (byDynamicKeyFromWidget?.stepKey) {
                        this.stepKey = byDynamicKeyFromWidget.stepKey;
                        this.loadContext(this.stepKey);
                        return;
                    }
                }

                // Fallback: many step configs are bound to a dynamic entity type and may not carry formId.
                // In that case resolve the form's dynamicEntityTypeKey and match on that.
                if (!primaryFormId || primaryFormId === '00000000-0000-0000-0000-000000000000') {
                     // Check if it's the completion step
                     if (stepConfig.type === 'complete' || settings.type === 'complete') {
                         this.isCompleteStep = true;
                         this.requireSignature = (stepConfig.requireSignature === true) || (settings.requireSignature === true);
                         const effectiveSettings = { ...settings, ...stepConfig };
                         this.loadCompletionPdf(effectiveSettings);

                         if (this.requireSignature) {
                             this.checkExistingSignature();
                         }

                         setTimeout(() => this.initializeCanvas(), 100);
                         this.loading = false;
                         return;
                     }
                }

                if (!primaryFormId) {
                    this.error = 'Multi-submit step configuration could not be resolved (missing formId).';
                    this.loading = false;
                    return;
                }

                this.publicFormService.getFormById(primaryFormId).subscribe({
                    next: (form) => {
                        const formDynamicKey = (form as any)?.dynamicEntityTypeKey as string | undefined;
                        const formDynamicTypeId = (form as any)?.dynamicEntityTypeId as string | undefined;
                        if (!formDynamicKey) {
                            this.error = 'Multi-submit step configuration could not be resolved: selected form is not linked to a dynamic entity type.';
                            this.loading = false;
                            return;
                        }

                        const targetKey = this.normalizeKey(formDynamicKey);
                        const targetKeyLoose = this.normalizeKeyLoose(formDynamicKey);
                        const byDynamicKey = enabledSteps.find((s: any) => !!s && (this.normalizeKey(s.dynamicEntityTypeKey) === targetKey || this.normalizeKeyLoose(s.dynamicEntityTypeKey) === targetKeyLoose) && !!s.stepKey) as any;

                        // Additional fallback: match by dynamic entity type ID if the backend provides it.
                        if (!byDynamicKey?.stepKey && formDynamicTypeId) {
                            const byDynamicId = enabledSteps.find((s: any) => !!s && !!s.stepKey && !!s.dynamicEntityTypeId && s.dynamicEntityTypeId === formDynamicTypeId) as any;

                            if (byDynamicId?.stepKey) {
                                this.stepKey = byDynamicId.stepKey;
                                this.loadContext(this.stepKey);
                                return;
                            }
                        }

                        if (!byDynamicKey?.stepKey) {
                            const distinctKeys = Array.from(
                                new Set(
                                    (enabledSteps || [])
                                        .map((s: any) => (s?.dynamicEntityTypeKey as string | null | undefined) || '')
                                        .map((k) => k.trim())
                                        .filter((k) => !!k)
                                )
                            );

                            const distinctIds = Array.from(
                                new Set(
                                    (enabledSteps || [])
                                        .map((s: any) => (s?.dynamicEntityTypeId as string | null | undefined) || '')
                                        .map((k) => k.trim())
                                        .filter((k) => !!k)
                                )
                            );

                            const preview = distinctKeys.slice(0, 6).join(', ');
                            this.error =
                                'Multi-submit step configuration could not be resolved for this form (no onboarding step matches its dynamic entity type). ' +
                                `Form dynamicEntityTypeKey="${formDynamicKey}"` +
                                (formDynamicTypeId ? `, dynamicEntityTypeId="${formDynamicTypeId}". ` : '. ') +
                                `Available step dynamicEntityTypeKeys (${distinctKeys.length}): ${preview}${distinctKeys.length > 6 ? ', ...' : ''}` +
                                (formDynamicTypeId ? ` | Available step dynamicEntityTypeIds (${distinctIds.length}): ${distinctIds.slice(0, 3).join(', ')}${distinctIds.length > 3 ? ', ...' : ''}` : '');
                            this.loading = false;
                            return;
                        }

                        this.stepKey = byDynamicKey.stepKey;
                        this.loadContext(this.stepKey);
                    },
                    error: () => {
                        this.error = 'Failed to resolve onboarding step configuration.';
                        this.loading = false;
                    }
                });
            },
            error: () => {
                this.error = 'Failed to resolve onboarding step configuration.';
                this.loading = false;
            }
        });
    }

    get hasContext(): boolean {
        return !!this.context || !!this.activeTermsContent || !!this.activeTermsPdfPath || this.isCompleteStep;
    }

    get records() {
        return this.context?.records || [];
    }

    loadContext(stepKey: string): void {
        this.loading = true;
        this.error = '';

        this.multiSubmitService.getStepContext(stepKey).subscribe({
            next: (ctx) => {
                this.context = ctx;
                // Ensure we have a concrete stepKey for subsequent save/delete calls.
                const serverStepKey = (ctx as any)?.step?.stepKey as string | undefined;
                if (serverStepKey) {
                    this.stepKey = serverStepKey;
                }

                // Apply any admin-configured list display settings (columns, actions, constraints)
                this.applyListDisplayConfigFromStep((ctx as any)?.step);

                this.loading = false;
                this.resetEditor();
                this.loadFormDefinition();
                this.ensureCalculatorInitialized();
                this.updateCalculatorFormData();
                this.buildViewRecords();

                // If this is NOT a multi-submit step, we enforce single record mode
                if (!this.isMultiSubmit) {
                    this.effectiveMax = 1;
                    const existing = this.context?.records || [];
                    if (existing.length > 0) {
                        // Automatically open the first record for editing
                        // We use setTimeout to ensure form definition is processed if it's async (though loadFormDefinition seems sync-ish here, standard safety)
                        setTimeout(() => this.startEdit(existing[0]), 0);
                    } else {
                        // Automatically start creation
                        setTimeout(() => this.startCreate(), 0);
                    }
                }
            },
            error: () => {
                this.error = 'Failed to load multi-submit step.';
                this.loading = false;
            }
        });
    }

    private applyListDisplayConfigFromStep(step: any): void {
        if (!step || !step.listDisplayConfig) {
            return;
        }

        try {
            const parsed: any = typeof step.listDisplayConfig === 'string' ? JSON.parse(step.listDisplayConfig) : step.listDisplayConfig;

            if (Array.isArray(parsed.columns)) {
                this.displayColumns = parsed.columns.map((c: any) => ({
                    fieldKey: c.fieldKey || '',
                    header: c.header || '',
                    width: c.width,
                    format: c.format
                }));
            }

            if (parsed.actions) {
                this.actions = {
                    add: !!parsed.actions.add,
                    edit: !!parsed.actions.edit,
                    delete: !!parsed.actions.delete,
                    view: !!parsed.actions.view
                };
            }

            const constraints: ListDisplayConstraintsConfig | undefined = parsed.constraints;
            if (constraints) {
                if (typeof constraints.minItems === 'number') {
                    this.minItems = constraints.minItems;
                }
                if (typeof constraints.maxItems === 'number') {
                    this.maxItems = constraints.maxItems;
                }
                if (typeof constraints.enforceOnNavigation === 'boolean') {
                    this.enforceOnNavigation = constraints.enforceOnNavigation;
                }
                if (typeof constraints.showWarningsOnly === 'boolean') {
                    this.showWarningsOnly = constraints.showWarningsOnly;
                }
                if (constraints.labels) {
                    this.singularLabel = constraints.labels.singular || this.singularLabel;
                    this.pluralLabel = constraints.labels.plural || this.pluralLabel;
                }

                // Recompute effective limits based on any dynamic or static min/max
                this.resolveEffectiveLimits();
            }
        } catch (err) {
            console.warn('Invalid listDisplayConfig on step', step?.stepKey, err);
        }
    }

    startCreate(): void {
        if (this.effectiveMax > 0 && this.records.length >= this.effectiveMax) {
            this.error = `You have reached the maximum limit of ${this.effectiveMax} items.`;
            return;
        }

        this.activeRecordId = null;
        this.activeDisplayName = '';
        this.activeOriginalData = {};
        this.resetActiveForm();
    }

    startEdit(record: { id: string; displayName?: string | null; dataJson: string }): void {
        this.activeRecordId = record.id;
        this.activeDisplayName = record.displayName || '';

        let parsed: any = {};
        try {
            parsed = record.dataJson ? JSON.parse(record.dataJson) : {};
        } catch {
            parsed = {};
        }

        this.activeOriginalData = parsed && typeof parsed === 'object' ? parsed : {};
        this.applyDataToActiveForm(this.activeOriginalData);
    }

    saveActive(): void {
        if (!this.stepKey) {
            this.error = 'Multi-submit step is not available in this context.';
            return;
        }

        if (this.activeFormGroup && this.activeFormGroup.invalid) {
            this.activeFormGroup.markAllAsTouched();
            return;
        }

        const formValues = this.buildDataFromActiveForm();
        const merged = { ...(this.activeOriginalData || {}), ...formValues };

        // Run Custom Validation Rules
        const validationError = this.validateRecord(merged);
        if (validationError) {
            this.error = validationError;
            // Scroll to top to see error
            try {
                const el = document.querySelector('.onboarding-multi-submit-step');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            } catch {}
            return;
        }

        // Auto-generate display name if not explicitly set (or always, since we hidden the input)
        const autoName = this.generateDisplayName(merged);
        
        const payload: SaveMultiSubmitRecordDto = {
            stepKey: this.stepKey,
            id: this.activeRecordId,
            displayName: autoName,
            dataJson: JSON.stringify(merged || {})
        };

        this.loading = true;
        this.error = '';

        this.multiSubmitService.saveRecord(payload).subscribe({
            next: () => {
                this.loadContext(this.stepKey);
            },
            error: () => {
                this.error = 'Failed to save record.';
                this.loading = false;
            }
        });
    }

    private generateDisplayName(data: Record<string, any>): string {
        // Try common name patterns
        const keys = Object.keys(data).map(k => k.toLowerCase());
        
        // 1. Full name fields
        const fullNameKey = keys.find(k => k === 'name' || k === 'fullname' || k === 'full name');
        if (fullNameKey) {
            const originalKey = Object.keys(data).find(k => k.toLowerCase() === fullNameKey);
            if (originalKey && data[originalKey]) return data[originalKey];
        }

        // 2. First + Last name
        const firstKey = keys.find(k => k.includes('first') && k.includes('name')); // firstname, firstnames
        const lastKey = keys.find(k => k.includes('last') || k.includes('sur')); // lastname, surname
        
        if (firstKey) {
             const originalFirst = Object.keys(data).find(k => k.toLowerCase() === firstKey);
             const originalLast = lastKey ? Object.keys(data).find(k => k.toLowerCase() === lastKey) : null;
             
             if (originalFirst && data[originalFirst]) {
                 return originalLast && data[originalLast] 
                    ? `${data[originalFirst]} ${data[originalLast]}`
                    : data[originalFirst];
             }
        }

        // 3. Any text field that looks like a title/relationship
        const typeKey = keys.find(k => k === 'relationship' || k === 'type');
        if (typeKey) {
            const originalType = Object.keys(data).find(k => k.toLowerCase() === typeKey);
            if (originalType && data[originalType]) return data[originalType];
        }

        // 4. Fallback: First string value found
        for (const key in data) {
            if (typeof data[key] === 'string' && data[key].length > 1 && data[key].length < 50) {
                return data[key];
            }
        }

        return 'Record';
    }

    deleteRecord(recordId: string): void {
        if (!confirm('Delete this record?')) {
            return;
        }

        this.loading = true;
        this.error = '';

        this.multiSubmitService.deleteRecord(this.stepKey, recordId).subscribe({
            next: () => this.loadContext(this.stepKey),
            error: () => {
                this.error = 'Failed to delete record.';
                this.loading = false;
            }
        });
    }

    private resetEditor(): void {
        this.activeRecordId = null;
        this.activeDisplayName = '';
        this.activeOriginalData = {};
        this.resetActiveForm();
    }

    private parseFormSchema(json: string | undefined | null): { fields: DynamicFormField[]; validationRules: DataValidationRule[] } {
        const result = { fields: [] as DynamicFormField[], validationRules: [] as DataValidationRule[] };
        if (!json) return result;

        try {
            const parsed = JSON.parse(json);
            let fieldsRaw: any[] = [];

            if (Array.isArray(parsed)) {
                fieldsRaw = parsed;
            } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.fields)) {
                fieldsRaw = parsed.fields;
                if (Array.isArray(parsed.validationRules)) {
                    result.validationRules = parsed.validationRules;
                }
                if (Array.isArray((parsed as any).rowLimitRules)) {
                    this.rowLimitRules = (parsed as any).rowLimitRules as RowLimitRuleConfig[];
                    // Ensure a stable order field and sane defaults, then load dynamic sources and apply row-limit effect.
                    this.rowLimitRules = this.rowLimitRules.map((r, idx) => ({
                        order: typeof r.order === 'number' ? r.order : idx + 1,
                        conditions: Array.isArray(r.conditions) ? r.conditions : [],
                        maxItems: typeof r.maxItems === 'number' ? r.maxItems : 0,
                        errorMessage: r.errorMessage || 'You have reached the maximum number of rows allowed for this step.'
                    }));

                    this.loadRowLimitSourceValues();
                }
            }

            if (fieldsRaw.length > 0) {
                result.fields = fieldsRaw
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
            }
        } catch {
            return result;
        }
        return result;
    }

    private loadFormDefinition(): void {
        const formId = (this.context as any)?.step?.formId as string | undefined;

        this.formDefinition = null;
        this.formFields = [];
        this.activeFormGroup = null;
        this.formLoadError = '';

        if (!formId) {
            this.formLoadError = 'This step has no FormId configured.';
            return;
        }

        this.publicFormService.getFormById(formId).subscribe({
            next: (form) => {
                this.formDefinition = form as any;
                const parsed = this.parseFormSchema((form as any)?.fields);
                this.formFields = parsed.fields;
                
                // Add validation rules from form definition
                if (parsed.validationRules && parsed.validationRules.length > 0) {
                    parsed.validationRules.forEach(r => {
                        // Prevent duplicates
                        const exists = this.validationRules.some(existing => 
                            existing.type === r.type && 
                            existing.fieldKey === r.fieldKey && 
                            existing.targetFieldKey === r.targetFieldKey
                        );
                        if (!exists) {
                            this.validationRules.push(r);
                        }
                    });
                    this.ensureMemberContextIfNeeded();
                }

                this.buildActiveForm();
                // Apply any current editor state (e.g., user clicked Edit before form load completed)
                this.applyDataToActiveForm(this.activeOriginalData);

                // Re-evaluate calculator config now that form is loaded
                this.ensureCalculatorInitialized(true);
            },
            error: () => {
                this.formLoadError = 'Failed to load form definition for this step.';
            }
        });
    }

    private buildActiveForm(): void {
        const group: { [key: string]: any } = {};

        for (const field of this.formFields) {
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
                group[field.name] = this.fb.array(controls);
            } else {
                group[field.name] = this.fb.control('', validators);
            }
        }

        this.activeFormGroup = this.fb.group(group);

        // Auto-populate Age/Gender from ID Number
        this.formFields
            .filter((f) => f.type === 'idNumber')
            .forEach((idField) => {
                const ctrl = this.activeFormGroup?.get(idField.name);
                if (ctrl) {
                    ctrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe((val) => {
                        if (ctrl.valid && val && typeof val === 'string' && val.length === 13) {
                            this.populateDerivedIdFields(idField.name, val);
                        }
                    });
                }
            });
    }

    private populateDerivedIdFields(idFieldName: string, idNumber: string): void {
        if (!idNumber || idNumber.length !== 13) return;

        // YYMMDD
        const yy = parseInt(idNumber.substring(0, 2), 10);
        const mm = parseInt(idNumber.substring(2, 4), 10);
        const dd = parseInt(idNumber.substring(4, 6), 10);
        const genderDigit = parseInt(idNumber.substring(6, 10), 10); // SSSS

        if (isNaN(yy) || isNaN(mm) || isNaN(dd)) return;

        // Determine century
        const currentYearShort = new Date().getFullYear() % 100;
        const fullYear = yy <= currentYearShort ? 2000 + yy : 1900 + yy;

        const dob = new Date(fullYear, mm - 1, dd);
        const today = new Date();

        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        age = Math.max(0, age);

        const gender = genderDigit >= 5000 ? 'Male' : 'Female';

        // Find target fields
        const ageTarget = this.formFields.find((f) => f.name.toLowerCase() === `${idFieldName}_age`.toLowerCase() || f.name.toLowerCase() === 'age');
        const genderTarget = this.formFields.find((f) => f.name.toLowerCase() === `${idFieldName}_gender`.toLowerCase() || f.name.toLowerCase() === 'gender');

        if (this.activeFormGroup) {
            if (ageTarget) {
                // Only set if empty or previously auto-filled (checking pristine might be too strict, just overwrite)
                this.activeFormGroup.get(ageTarget.name)?.setValue(age);
            }
            if (genderTarget) {
                this.activeFormGroup.get(genderTarget.name)?.setValue(gender);
            }
        }
    }

    getCheckboxControl(field: DynamicFormField): FormArray {
        return this.activeFormGroup?.get(field.name) as FormArray;
    }

    getCheckboxOptions(field: DynamicFormField): string[] {
        return field.options || [];
    }

    private resetActiveForm(): void {
        if (!this.activeFormGroup) {
            return;
        }

        for (const field of this.formFields) {
            if (field.type === 'checkbox' && field.options && field.options.length) {
                const arr = this.activeFormGroup.get(field.name) as FormArray;
                if (arr && arr.controls) {
                    for (let i = 0; i < arr.length; i++) {
                        arr.at(i).setValue(false, { emitEvent: false });
                    }
                }
            } else {
                this.activeFormGroup.get(field.name)?.setValue('', { emitEvent: false });
            }
        }

        this.activeFormGroup.markAsPristine();
        this.activeFormGroup.markAsUntouched();
    }

    private applyDataToActiveForm(data: Record<string, any>): void {
        if (!this.activeFormGroup) {
            return;
        }

        const safeData = data && typeof data === 'object' ? data : {};

        for (const field of this.formFields) {
            const rawValue = (safeData as any)[field.name];

            if (field.type === 'checkbox' && field.options && field.options.length) {
                const selected = Array.isArray(rawValue)
                    ? rawValue.map((v: any) => `${v}`)
                    : typeof rawValue === 'string'
                      ? rawValue
                            .split(',')
                            .map((s) => s.trim())
                            .filter((s) => !!s)
                      : [];

                const arr = this.activeFormGroup.get(field.name) as FormArray;
                if (arr && arr.controls) {
                    for (let i = 0; i < (field.options || []).length; i++) {
                        const opt = field.options![i];
                        arr.at(i).setValue(selected.includes(opt), { emitEvent: false });
                    }
                }

                continue;
            }

            const next = rawValue === undefined || rawValue === null ? '' : rawValue;
            this.activeFormGroup.get(field.name)?.setValue(next, { emitEvent: false });
        }

        this.activeFormGroup.markAsPristine();
        this.activeFormGroup.markAsUntouched();
    }

    private buildDataFromActiveForm(): Record<string, any> {
        if (!this.activeFormGroup) {
            return {};
        }

        const data: Record<string, any> = {};

        for (const field of this.formFields) {
            if (field.type === 'checkbox' && field.options && field.options.length) {
                const arr = this.activeFormGroup.get(field.name) as FormArray;
                const selected: string[] = [];
                for (let i = 0; i < (field.options || []).length; i++) {
                    if (arr?.at(i)?.value) {
                        selected.push(field.options![i]);
                    }
                }
                data[field.name] = selected;
                continue;
            }

            const raw = this.activeFormGroup.get(field.name)?.value;

            if (field.type === 'number') {
                const n = raw === '' || raw === null || raw === undefined ? null : Number(raw);
                data[field.name] = Number.isFinite(n as any) ? n : raw;
            } else {
                data[field.name] = raw;
            }
        }

        return data;
    }

    private ensureCalculatorInitialized(force: boolean = false): void {
        if (!this.context) {
            return;
        }

        if (this.calculatorConfig && !force) {
            return;
        }

        const step: any = this.context.step || {};
        const settings = (this.config && this.config.settings) || {};

        let overrideConfig: Partial<CalculatorConfig> | null = null;

        console.log('ensureCalculatorInitialized: step config:', step.calculatorConfig);

        // 1. Prefer direct calculator config from the step (provided by backend)
        if (step.calculatorConfig) {
            try {
                const parsed = typeof step.calculatorConfig === 'string' 
                    ? JSON.parse(step.calculatorConfig) 
                    : step.calculatorConfig;
                
                console.log('ensureCalculatorInitialized: parsed config:', parsed);

                if (parsed) {
                    overrideConfig = { ...(overrideConfig || {}), ...parsed };
                }
            } catch (err) {
                console.warn('Failed to parse step.calculatorConfig', err);
            }
        }

        // Allow widget settings to provide calculator config directly
        if (settings.calculatorConfigJson) {
            try {
                const parsed = JSON.parse(settings.calculatorConfigJson);
                overrideConfig = { ...(overrideConfig || {}), ...parsed };
            } catch {
                // Ignore parse errors and fall back to defaults
            }
        } else if (settings.calculatorConfig) {
            overrideConfig = { ...(overrideConfig || {}), ...settings.calculatorConfig };
        }

        // Also allow step listDisplayConfig to contain a calculator block
        if (step.listDisplayConfig) {
            try {
                const parsed = JSON.parse(step.listDisplayConfig);
                if (parsed && parsed.calculator) {
                    overrideConfig = { ...(overrideConfig || {}), ...parsed.calculator };
                }
            } catch {
                // Ignore parse errors and continue
            }
        }

        // Also allow the underlying Form Definition to provide calculator config
        if (this.formDefinition && this.formDefinition.settings) {
            let formSettings = this.formDefinition.settings;
            if (typeof formSettings === 'string') {
                try {
                    formSettings = JSON.parse(formSettings);
                } catch {
                    formSettings = {}; // Fix: default to empty object, not null
                }
            }

            if (formSettings) { // Guard against null formSettings
                 if (formSettings.calculatorConfigJson) {
                      try {
                         const parsed = JSON.parse(formSettings.calculatorConfigJson);
                         overrideConfig = { ...(overrideConfig || {}), ...parsed };
                      } catch {}
                 } else if (formSettings.calculatorConfig) {
                      overrideConfig = { ...(overrideConfig || {}), ...formSettings.calculatorConfig };
                 } else if (formSettings.calculator) {
                      overrideConfig = { ...(overrideConfig || {}), ...formSettings.calculator };
                 }
            }
        }

        // Only initialize calculator if configuration is explicitly provided
        if (overrideConfig) {
            // Determine the collection key dynamically from the entity type, or fallback to 'dependents'
            const collectionKey = this.getCollectionKey();

            let baseConfig: CalculatorConfig = {
                title: step.stepLabel || 'Your Estimated Premium',
                showBreakdown: true,
                autoCalculate: true
            };
    
            this.calculatorConfig = overrideConfig ? { ...baseConfig, ...overrideConfig } : baseConfig;
        } else {
            this.calculatorConfig = undefined as any; // Ensure it's hidden
        }
    }

    private updateCalculatorFormData(): void {
        if (!this.context) {
            this.calculatorFormData = {};
            return;
        }

        const items: any[] = [];

        for (const record of this.records) {
            if (!record.dataJson) {
                continue;
            }

            let parsed: any;
            try {
                parsed = JSON.parse(record.dataJson);
            } catch {
                // Skip invalid JSON entries
                continue;
            }

            const item: any = { ...parsed };

            if (!item.relationship && record.displayName) {
                item.relationship = record.displayName;
            }
            items.push(item);
        }

        const collectionKey = this.getCollectionKey();

        // Update the cross-step aggregator so calculators can operate on
        // all onboarding entities (children, adults, elders, etc.) that
        // have been visited in this flow.
        this.calculatorAggregator.updateCollection(collectionKey, items);

        // The embedded calculator watches collection keys (for example,
        // entity-specific arrays like beneficiaries) and auto-recalculates
        // via ngOnChanges when formData changes. We now feed it the
        // aggregated data across all relevant collections so totals and
        // breakdowns can span multiple onboarding steps.
        this.calculatorFormData = this.calculatorAggregator.getFormDataSnapshot();
    }

    private getCollectionKey(): string {
        const step: any = this.context?.step;
        if (step?.dynamicEntityTypeKey) {
            // Use the normalized dynamic entity key (e.g. "ExtendedFamily" -> "extendedfamily")
            return this.normalizeKeyLoose(step.dynamicEntityTypeKey);
        }
        // Use a generic key 'items' if no specific entity type is defined.
        return 'items';
    }

    private buildViewRecords(): void {
        if (!this.context) {
            this.viewRecords = [];
            return;
        }

        this.viewRecords = (this.records || []).map((r: any) => {
            let parsed: any = null;
            if (r.dataJson) {
                try {
                    parsed = JSON.parse(r.dataJson);
                } catch {
                    parsed = null;
                }
            }
            return { record: r, parsed };
        });
    }

    get canProceed(): boolean {
        const currentStep = this.configuredSteps[this.currentStepIndex];

        if (this.isCompleteStep) {
            // Validation handled by onCompleteFlow
            return false; // Hide normal next button
        }

        // Terms step logic
        if (currentStep?.type === 'terms') {
            if (this.activeTermsContent || this.activeTermsPdfPath) {
                return this.termsAgreed;
            }
            // If it's a backend-resolved terms step (legacy/complex),
            // we assume it's valid to proceed unless records validation blocks it (unlikely for terms)
            return true;
        }

        // Standard list validation
        if (this.enforceOnNavigation) {
            if (this.effectiveMin > 0 && this.records.length < this.effectiveMin) {
                return false;
            }
            if (this.effectiveMax > 0 && this.records.length > this.effectiveMax) {
                return false;
            }
        }

        // Row-limit rules are always blocking when violated, regardless of enforceOnNavigation.
        if (this.activeRowLimitRule && this.effectiveMax > 0 && this.records.length > this.effectiveMax) {
            return false;
        }

        return true;
    }

    get constraintWarningMessage(): string | null {
        const count = this.records.length;

        if (this.activeRowLimitRule && this.effectiveMax > 0 && count > this.effectiveMax) {
            return this.activeRowLimitRule.errorMessage || null;
        }

        if (this.effectiveMin > 0 && count < this.effectiveMin) {
            const label = this.effectiveMin === 1 ? (this.singularLabel || 'item') : (this.pluralLabel || 'items');
            return `Please add at least ${this.effectiveMin} ${label.toLowerCase()} to continue.`;
        }

        if (this.effectiveMax > 0 && count > this.effectiveMax) {
            const label = this.pluralLabel || 'items';
            return `You have more than the maximum of ${this.effectiveMax} ${label.toLowerCase()}.`;
        }

        return null;
    }

    onNext(): void {
        if (this.isCompleteStep) {
            return;
        }

        console.log('onNext: CanProceed?', this.canProceed);
        console.log('onNext: CurrentIndex:', this.currentStepIndex, 'TotalSteps:', this.configuredSteps.length);

        if (!this.canProceed) {
            console.log('onNext: Blocked by validation.');
            return;
        }

        // Save state before moving
        this.stepStates[this.currentStepIndex] = { termsAgreed: this.termsAgreed };

        if (this.currentStepIndex < this.configuredSteps.length - 1) {
            this.currentStepIndex++;
            console.log('onNext: Advancing to internal step index:', this.currentStepIndex);
            this.loadInternalStep(this.configuredSteps[this.currentStepIndex]);
            return;
        }

        // Check if we are entering the completion/signature step
        this.checkExistingSignature();

        console.log('onNext: Finished all internal steps. Emitting next event.');
        this.next.emit();

        if (this.nextUrl) {
            console.log('onNext: Navigating to URL:', this.nextUrl);
            this.router.navigateByUrl(this.nextUrl);
        } else {
            console.error('onNext: No NextURL configured.');
            this.error = 'Configuration Missing: No "Next Step URL" is configured for this button.';
        }
    }

    onPrev(): void {
        if (this.currentStepIndex > 0) {
            // Save state
            this.stepStates[this.currentStepIndex] = { termsAgreed: this.termsAgreed };

            this.currentStepIndex--;
            this.loadInternalStep(this.configuredSteps[this.currentStepIndex]);
        }
    }

    // --- Completion Logic ---

    private loadCompletionPdf(settings: any): void {
        const mode = settings.completionPdfMode || 'system';

        if (mode === 'custom' && settings.completionPdfUrl) {
            this.completionPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(settings.completionPdfUrl);
            this.loading = false;
            return;
        }

        this.loading = true;
        this.error = '';

        // Direct HTTP call instead of generated proxy which returns void for blobs
        const url = `${environment.apiUrl}/api/OnboardingPdf/OnboardingPdf_PreviewPdf`;

        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const objectUrl = URL.createObjectURL(blob);
                this.completionPdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
                this.loading = false;
            },
            error: (err) => {
                console.error('PDF Generation failed', err);
                this.error = 'Failed to generate completion PDF.';
                this.loading = false;
            }
        });
    }

    // --- Signature Logic ---

    private checkExistingSignature(): void {
        console.log('checkExistingSignature: Checking for existing member signature...');
        // First try to look up the member explicitly through authentication context or session if possible,
        // but since we don't have a SessionService imported here, we rely on the profile completion status.

        this.memberProfileCompletionService.profileCompletion_GetMyStatus().subscribe({
            next: (statusResponse) => {
                const memberId = statusResponse.result?.profileCompletion?.memberId;
                console.log('checkExistingSignature: Member ID found:', memberId);

                if (memberId && memberId !== '00000000-0000-0000-0000-000000000000') {
                    this.memberService.member_GetById(memberId).subscribe({
                        next: (memberResponse) => {
                            const signatureUrl = memberResponse.result?.signatureDataUrl;
                            console.log('checkExistingSignature: Signature URL found:', !!signatureUrl);
                            // Ensure change detection runs
                            if (signatureUrl) {
                                this.savedSignatureUrl = signatureUrl;
                                this.cdr.detectChanges(); // Force UI update
                            }
                        },
                        error: (err) => console.error('checkExistingSignature: Failed to get member details', err)
                    });
                } else {
                    console.warn('checkExistingSignature: No valid member ID in profile completion status.');
                }
            },
            error: (err) => console.error('checkExistingSignature: Failed to get profile status', err)
        });
    }

    initializeCanvas(attempt = 1): void {
        if (this.canvasRef) {
            const canvas = this.canvasRef.nativeElement;
            this.ctx = canvas.getContext('2d')!;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        } else if (attempt < 10) {
            // Retry initialization if DOM not ready
            setTimeout(() => this.initializeCanvas(attempt + 1), 200);
        }
    }

    startDrawing(event: MouseEvent): void {
        this.isDrawing = true;
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        this.lastX = event.clientX - rect.left;
        this.lastY = event.clientY - rect.top;
    }

    draw(event: MouseEvent): void {
        if (!this.isDrawing || !this.ctx) return;

        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing(): void {
        this.isDrawing = false;
    }

    // Touch support for mobile
    handleTouchStart(event: TouchEvent): void {
        if (event.cancelable) event.preventDefault();
        this.isDrawing = true;
        const touch = event.touches[0];
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        this.lastX = touch.clientX - rect.left;
        this.lastY = touch.clientY - rect.top;
    }

    handleTouchMove(event: TouchEvent): void {
        if (!this.isDrawing || !this.ctx) return;
        if (event.cancelable) event.preventDefault();

        const touch = event.touches[0];
        const rect = this.canvasRef.nativeElement.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    clearSignature(): void {
        if (this.ctx && this.canvasRef) {
            const canvas = this.canvasRef.nativeElement;
            this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    saveSignature(): void {
        if (!this.hasSignature()) {
            this.error = 'Please sign before saving.';
            return;
        }

        this.isSavingSignature = true;
        this.error = '';

        const signatureDataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
        const dto = new SaveSignatureDto();
        dto.signatureDataUrl = signatureDataUrl;

        this.memberService.member_SaveSignature(dto).subscribe({
            next: () => {
                this.savedSignatureUrl = signatureDataUrl;
                this.isSavingSignature = false;
                
                // Re-load the PDF to include the signature
                const settings = (this.config && this.config.settings) || {};
                this.loadCompletionPdf({ ...settings, forceRefresh: true }); 
            },
            error: (err) => {
                console.error('Failed to save signature', err);
                this.error = 'Failed to save signature. Please try again.';
                this.isSavingSignature = false;
            }
        });
    }

    editSignature(): void {
        this.savedSignatureUrl = null;
        // Wait for view to update so canvas exists
        setTimeout(() => this.initializeCanvas(), 0);
    }

    hasSignature(): boolean {
        if (!this.canvasRef || !this.ctx) return false;
        const canvas = this.canvasRef.nativeElement;
        // Simple check: iterate pixels to see if any are non-transparent
        const pixelData = this.ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < pixelData.length; i += 4) {
            if (pixelData[i] !== 0) return true;
        }
        return false;
    }

    onCompleteFlow(): void {
        if (this.requireSignature && !this.savedSignatureUrl) {
            this.error = 'Please save your signature before continuing.';
            return;
        }

        this.isCompletingFlow = true;
        this.error = '';
        this.finalizeCompletion();
    }

    private finalizeCompletion(): void {
        this.memberProfileCompletionService.profileCompletion_RecalculateMy().subscribe({
            next: () => {
                // Now check status to ensure we are actually complete
                this.memberProfileCompletionService.profileCompletion_GetMyStatus().subscribe({
                    next: (statusResponse) => {
                        const status = statusResponse.result;
                        this.isCompletingFlow = false;

                        if (status.isComplete) {
                            this.next.emit();
                            if (this.nextUrl) {
                                this.router.navigateByUrl(this.nextUrl);
                            } else {
                                this.router.navigate(['/admin/dashboard']);
                            }
                        } else {
                            // Not complete - show what's missing
                            const missing = (status.remainingSteps || []).join(', ');
                            this.error = `Profile incomplete. Missing: ${missing || 'Unknown requirements'}. Please complete all visible steps.`;
                        }
                    },
                    error: () => {
                        this.isCompletingFlow = false;
                        this.error = 'Failed to verify completion status.';
                    }
                });
            },
            error: () => {
                this.error = 'Flow finished but status update failed.';
                this.isCompletingFlow = false;
            }
        });
    }

    onFileUploaded(field: any, event: any): void {
        const control = this.activeFormGroup?.get(field.name);
        if (control) {
            // Store the file ID as the value
            // Event is expected to be an array of files, take the first one or ID directly if simplified
            const fileId = Array.isArray(event) ? event[0]?.id : event?.id;
            control.setValue(fileId);
            control.markAsDirty();
            control.markAsTouched();
        }
    }
}
