import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FormServiceProxy, FormDto } from '../../core/services/service-proxies';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface FormOption {
    label: string;
    value: string;
    description?: string | null;
}

@Component({
    selector: 'app-form-widget-editor',
    standalone: true,
    imports: [CommonModule, FormsModule, DropdownModule, ButtonModule, InputTextModule, TextareaModule, ToastModule],
    providers: [FormServiceProxy, MessageService],
    templateUrl: './form-widget-editor.component.html',
    styleUrls: ['./form-widget-editor.component.scss']
})
export class FormWidgetEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();

    settings: any = {};
    forms: FormOption[] = [];
    loadingForms = false;

    constructor(
        private formService: FormServiceProxy,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.settings = JSON.parse(JSON.stringify(this.config.settings || {}));

        if (this.settings.showTitle === undefined) {
            this.settings.showTitle = true;
        }
        if (this.settings.showDescription === undefined) {
            this.settings.showDescription = true;
        }

        this.loadForms();
    }

    private loadForms(): void {
        this.loadingForms = true;
        this.formService.form_GetAll(1, 100, true).subscribe({
            next: (response) => {
                const result = response.result;
                const forms = (result?.forms || []) as FormDto[];
                this.forms = forms.map((f) => ({
                    label: f.name || 'Untitled form',
                    value: f.id!,
                    description: f.description
                }));
                this.loadingForms = false;
            },
            error: () => {
                this.loadingForms = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load forms for selection.'
                });
            }
        });
    }

    save(): void {
        this.config.settings = {
            ...this.config.settings,
            ...this.settings
        };

        this.update.emit(this.config.settings);
        this.messageService.add({
            severity: 'success',
            summary: 'Saved',
            detail: 'Form widget settings updated.'
        });
    }
}
