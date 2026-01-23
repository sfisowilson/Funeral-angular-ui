import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { FormDto, FormServiceProxy } from '../../core/services/service-proxies';

interface EditorStepConfig {
    id: string;
    type: 'form' | 'terms';
    title: string;
    formId?: string;
}

interface FormOption {
    id: string;
    name: string;
    description?: string | null;
}

@Component({
    selector: 'app-stepper-form-widget-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stepper-form-widget-editor.component.html',
    styleUrls: ['./stepper-form-widget-editor.component.scss'],
    providers: [FormServiceProxy]
})
export class StepperFormWidgetEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();

    settings: any = {};
    steps: EditorStepConfig[] = [];
    forms: FormOption[] = [];
    loadingForms = false;

    constructor(private formService: FormServiceProxy) {}

    ngOnInit(): void {
        this.settings = {
            title: this.config.settings?.title || 'Multi-step form',
            showProgressBar: this.config.settings?.showProgressBar !== false,
            successMessage: this.config.settings?.successMessage || 'Thank you for completing all steps.',
            enableCompletionPdf: this.config.settings?.enableCompletionPdf === true,
            completionPdfMode: this.config.settings?.completionPdfMode || 'system',
            requireSignature: this.config.settings?.requireSignature === true,
            completionPdfUrl: this.config.settings?.completionPdfUrl || ''
        };

        const rawSteps = (this.config.settings?.steps || []) as EditorStepConfig[];
        this.steps = (rawSteps || []).map((s, index) => ({
            id: s.id || this.generateId(index),
            type: s.type || 'form',
            title: s.title || `Step ${index + 1}`,
            formId: s.formId
        }));

        this.loadForms();
    }

    private generateId(index: number): string {
        return 'step-' + index + '-' + Math.random().toString(36).substring(2, 9);
    }

    private loadForms(): void {
        this.loadingForms = true;
        this.formService.form_GetAll(1, 100, true).subscribe({
            next: (response) => {
                const result = response.result;
                const forms = (result?.forms || []) as FormDto[];
                this.forms = forms.map((f) => ({
                    id: f.id!,
                    name: f.name || 'Untitled form',
                    description: f.description
                }));
                this.loadingForms = false;
            },
            error: () => {
                this.loadingForms = false;
            }
        });
    }

    addFormStep(): void {
        const index = this.steps.length;
        this.steps.push({
            id: this.generateId(index),
            type: 'form',
            title: `Form step ${index + 1}`,
            formId: undefined
        });
    }

    addTermsStep(): void {
        const index = this.steps.length;
        this.steps.push({
            id: this.generateId(index),
            type: 'terms',
            title: `Terms and conditions`
        });
    }

    removeStep(index: number): void {
        this.steps.splice(index, 1);
    }

    moveStepUp(index: number): void {
        if (index <= 0) return;
        const temp = this.steps[index - 1];
        this.steps[index - 1] = this.steps[index];
        this.steps[index] = temp;
    }

    moveStepDown(index: number): void {
        if (index >= this.steps.length - 1) return;
        const temp = this.steps[index + 1];
        this.steps[index + 1] = this.steps[index];
        this.steps[index] = temp;
    }

    save(): void {
        const cleanedSteps = this.steps.map((s) => ({
            id: s.id,
            type: s.type,
            title: s.title,
            formId: s.type === 'form' ? s.formId : undefined
        }));

        this.config.settings = {
            ...this.config.settings,
            title: this.settings.title,
            showProgressBar: this.settings.showProgressBar,
            successMessage: this.settings.successMessage,
             enableCompletionPdf: this.settings.enableCompletionPdf,
             completionPdfMode: this.settings.completionPdfMode,
            requireSignature: this.settings.requireSignature,
            completionPdfUrl: this.settings.completionPdfUrl || undefined,
            steps: cleanedSteps
        };

        this.update.emit(this.config.settings);
    }
}
