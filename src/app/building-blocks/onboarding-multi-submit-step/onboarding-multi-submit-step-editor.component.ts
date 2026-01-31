import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { DynamicFileUploadComponent, UploadedFile } from '../../shared/components/dynamic-file-upload/dynamic-file-upload.component';
import {
    OnboardingStepAdminService,
    OnboardingStepConfigurationDto,
    ListDisplayColumnConfig
} from '../../core/services/onboarding-step-admin.service';
import {
    FormDto,
    FormServiceProxy,
    DynamicEntityServiceProxy,
    DynamicEntityTypeDto,
    FileUploadServiceProxy
} from '../../core/services/service-proxies';

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

    constructor(
        private onboardingStepAdminService: OnboardingStepAdminService,
        private formService: FormServiceProxy,
        private dynamicEntityService: DynamicEntityServiceProxy
    ) {}

    ngOnInit(): void {
        this.settings = {
            title: this.config.settings?.title || 'Multi-submit onboarding step',
            minItems: this.config.settings?.minItems || 0,
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
                termsPdfPath: s.termsPdfPath,
                termsPdfName: s.termsPdfName,
                columns: (s.columns || []).map((c: any) => ({
                    fieldKey: c.fieldKey || '',
                    header: c.header || '',
                    width: c.width,
                    format: c.format
                })) as ListDisplayColumnConfig[]
            }));
        } else {
            // Backwards compatibility: fall back to single stepKey on settings
            const existingStepKey = this.config.settings?.stepKey || '';
            this.editorSteps = [
                {
                    id: this.generateId(0),
                    title: 'Multi-submit step',
                    type: 'form',
                    isMultiSubmit: true,
                    formId: undefined,
                    stepKey: existingStepKey,
                    columns: [],
                    termsContent: '',
                    termsPdfPath: '',
                    termsPdfName: ''
                }
            ];
        }
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

        const cleanedSteps = this.editorSteps.map((s, index) => ({
            id: s.id,
            title: s.title || `Multi-submit step ${index + 1}`,
            type: s.type,
            isMultiSubmit: s.isMultiSubmit,
            formId: s.type === 'form' ? s.formId : undefined,
            stepKey: s.type === 'form' ? s.stepKey : '',
            termsContent: s.type === 'terms' ? s.termsContent : undefined,
            termsPdfPath: s.type === 'terms' ? s.termsPdfPath : undefined,
            termsPdfName: s.type === 'terms' ? s.termsPdfName : undefined,
            columns: (s.columns || []).filter((c) => c.fieldKey && c.header)
        }));

        this.config.settings = {
            ...this.config.settings,
            title: this.settings.title,
            minItems: this.settings.minItems,
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
