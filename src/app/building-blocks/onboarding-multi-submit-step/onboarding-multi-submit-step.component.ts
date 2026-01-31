import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, OnChanges, Output, EventEmitter, SimpleChanges, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { WidgetConfig } from '../widget-config';
import { OnboardingMultiSubmitService, MultiSubmitStepContextDto, SaveMultiSubmitRecordDto } from '../../core/services/onboarding-multi-submit.service';
import { EmbeddedCalculatorComponent, CalculatorConfig, CalculatorResult } from '../../shared/components/embedded-calculator/embedded-calculator.component';
import { OnboardingStepConfigurationClient } from '../../core/services/onboarding-step-configuration.client';
import { PublicFormService } from '../../core/services/public-form.service';
import { OnboardingStepType, OnboardingPdfServiceProxy, MemberServiceProxy, SaveSignatureDto, MemberProfileCompletionServiceProxy } from '../../core/services/service-proxies';
import { saIdNumberValidator } from '../../shared/validators/sa-id-number.validator';

interface ListDisplayColumnConfig {
  fieldKey: string;
  header: string;
  width?: string;
  format?: string;
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EmbeddedCalculatorComponent],
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
  nextUrl: string | undefined;

  // Embedded calculator integration
  calculatorConfig: CalculatorConfig | null = null;
  calculatorFormData: any = {};
  calculatorResult: CalculatorResult | null = null;

  // Terms state
  activeTermsContent: string | undefined;
  activeTermsPdfPath: string | undefined;
  activeTermsPdfName: string | undefined;
  termsAgreed = false;

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

  constructor(
    private fb: FormBuilder,
    private multiSubmitService: OnboardingMultiSubmitService,
    private onboardingStepConfigurationClient: OnboardingStepConfigurationClient,
    private publicFormService: PublicFormService,
    private onboardingPdfService: OnboardingPdfServiceProxy,
    private memberService: MemberServiceProxy,
    private memberProfileCompletionService: MemberProfileCompletionServiceProxy,
    private sanitizer: DomSanitizer,
    private router: Router,
    private http: HttpClient
  ) {}

  ngAfterViewInit(): void {
    // Canvas might not be in DOM initially (hidden by ngIf)
    // We initialize it on demand when isCompleteStep becomes true
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && this.config) {
      const settings = (this.config && this.config.settings) || {};
      this.minItems = typeof settings.minItems === 'number' ? settings.minItems : 0;
      this.nextUrl = settings.nextUrl;
      console.log('OnboardingMultiSubmitStep config updated:', { minItems: this.minItems, nextUrl: this.nextUrl });
    }
  }

  private normalizeKey(value: string | null | undefined): string {
    return (value || '').trim().toLowerCase();
  }

  private normalizeKeyLoose(value: string | null | undefined): string {
    return this.normalizeKey(value).replace(/[^a-z0-9]/g, '');
  }

  ngOnInit(): void {
    const settings = (this.config && this.config.settings) || {};
    this.configuredSteps = (settings.steps || []) as any[];

    // Parse rules
    this.minItems = typeof settings.minItems === 'number' ? settings.minItems : 0;
    this.nextUrl = settings.nextUrl;

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

    // Restore state if available
    const savedState = this.stepStates[this.currentStepIndex];

    // Reset view states
    this.displayColumns = [];
    this.isCompleteStep = false;
    this.context = null;
    this.activeTermsContent = undefined;
    this.activeTermsPdfPath = undefined;
    this.error = '';

    // Check if this is a 'complete' step
    if (stepConfig.type === 'complete') {
        this.isCompleteStep = true;
        this.requireSignature = settings.requireSignature === true;
        this.loadCompletionPdf(settings);
        
        // Wait for view to update so canvas is in DOM
        setTimeout(() => this.initializeCanvas(), 100);
        return;
    }
    
    // Determine basics from the step config
    let primaryFormId = stepConfig.formId || settings.formId;
    let primaryDynamicEntityKey = stepConfig.dynamicEntityTypeKey || settings.dynamicEntityTypeKey; 
    let stepKeyOverride = stepConfig.stepKey || settings.stepKey || settings.stepKeyOverride || '';

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
             const termsStep = steps.find(s => s.stepType === OnboardingStepType._3);
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
        const byForm = primaryFormId
          ? (enabledSteps.find(
              (s: any) => !!s && s.formId === primaryFormId && !!s.stepKey
            ) as any)
          : null;

        if (byForm?.stepKey) {
          this.stepKey = byForm.stepKey;
          this.loadContext(this.stepKey);
          return;
        }

        // Second attempt: match by dynamic entity type key (if present in widget config)
        if (primaryDynamicEntityKey) {
          const targetKey = this.normalizeKey(primaryDynamicEntityKey);
          const targetKeyLoose = this.normalizeKeyLoose(primaryDynamicEntityKey);
          const byDynamicKeyFromWidget = enabledSteps.find(
            (s: any) =>
              !!s &&
              (this.normalizeKey(s.dynamicEntityTypeKey) === targetKey || this.normalizeKeyLoose(s.dynamicEntityTypeKey) === targetKeyLoose) &&
              !!s.stepKey
          ) as any;

          if (byDynamicKeyFromWidget?.stepKey) {
            this.stepKey = byDynamicKeyFromWidget.stepKey;
            this.loadContext(this.stepKey);
            return;
          }
        }

        // Fallback: many step configs are bound to a dynamic entity type and may not carry formId.
        // In that case resolve the form's dynamicEntityTypeKey and match on that.
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
            const byDynamicKey = enabledSteps.find(
              (s: any) =>
                !!s &&
                (this.normalizeKey(s.dynamicEntityTypeKey) === targetKey || this.normalizeKeyLoose(s.dynamicEntityTypeKey) === targetKeyLoose) &&
                !!s.stepKey
            ) as any;

            // Additional fallback: match by dynamic entity type ID if the backend provides it.
            if (!byDynamicKey?.stepKey && formDynamicTypeId) {
              const byDynamicId = enabledSteps.find(
                (s: any) => !!s && !!s.stepKey && !!s.dynamicEntityTypeId && s.dynamicEntityTypeId === formDynamicTypeId
              ) as any;

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
                (formDynamicTypeId
                  ? ` | Available step dynamicEntityTypeIds (${distinctIds.length}): ${distinctIds.slice(0, 3).join(', ')}${distinctIds.length > 3 ? ', ...' : ''}`
                  : '');
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
        this.loading = false;
        this.resetEditor();
        this.loadFormDefinition();
        this.ensureCalculatorInitialized();
        this.updateCalculatorFormData();
        this.buildViewRecords();
      },
      error: () => {
        this.error = 'Failed to load multi-submit step.';
        this.loading = false;
      }
    });
  }

  startCreate(): void {
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

    const payload: SaveMultiSubmitRecordDto = {
      stepKey: this.stepKey,
      id: this.activeRecordId,
      displayName: this.activeDisplayName,
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
        this.formFields = this.parseFields((form as any)?.fields);
        this.buildActiveForm();
        // Apply any current editor state (e.g., user clicked Edit before form load completed)
        this.applyDataToActiveForm(this.activeOriginalData);
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

  private ensureCalculatorInitialized(): void {
    if (!this.context || this.calculatorConfig) {
      return;
    }

    const step: any = this.context.step || {};
    const settings = (this.config && this.config.settings) || {};

    // Determine the collection key dynamically from the entity type, or fallback to 'dependents'
    const collectionKey = this.getCollectionKey();

    let baseConfig: CalculatorConfig = {
      title: step.stepLabel || 'Your Estimated Premium',
      showBreakdown: true,
      autoCalculate: true,
      watchFieldKeys: [collectionKey]
    };

    let overrideConfig: Partial<CalculatorConfig> | null = null;

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

    this.calculatorConfig = overrideConfig
      ? { ...baseConfig, ...overrideConfig }
      : baseConfig;
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

    // The embedded calculator watches keys (e.g. 'dependents', 'beneficiaries') and
    // auto-recalculates via ngOnChanges when formData changes.
    this.calculatorFormData = {
      [collectionKey]: items
    };
  }

  private getCollectionKey(): string {
    const step: any = this.context?.step;
    if (step?.dynamicEntityTypeKey) {
      // Use the normalized dynamic entity key (e.g. "ExtendedFamily" -> "extendedfamily")
      return this.normalizeKeyLoose(step.dynamicEntityTypeKey);
    }
    // No fallback to 'dependents'. Use a generic key 'items' if no specific entity type is defined.
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
    if (this.minItems > 0 && this.records.length < this.minItems) {
      return false;
    }
    return true;
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
    if(event.cancelable) event.preventDefault();
    this.isDrawing = true;
    const touch = event.touches[0];
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.lastX = touch.clientX - rect.left;
    this.lastY = touch.clientY - rect.top;
  }

  handleTouchMove(event: TouchEvent): void {
    if (!this.isDrawing || !this.ctx) return;
    if(event.cancelable) event.preventDefault();

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
    if (this.requireSignature && !this.hasSignature()) {
        this.error = 'Please sign the document before continuing.';
        return;
    }

    this.isCompletingFlow = true;
    this.error = '';

    if (this.requireSignature) {
        const signatureDataUrl = this.canvasRef.nativeElement.toDataURL('image/png');
        const dto = new SaveSignatureDto();
        dto.signatureDataUrl = signatureDataUrl;

        this.memberService.member_SaveSignature(dto).subscribe({
            next: () => {
                this.finalizeCompletion();
            },
            error: () => {
                this.error = 'Failed to save signature. Please try again.';
                this.isCompletingFlow = false;
            }
        });
    } else {
        this.finalizeCompletion();
    }
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
                              this.router.navigate(['/dashboard']);
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
}
