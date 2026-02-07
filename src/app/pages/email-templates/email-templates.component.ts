import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';

export interface EmailTemplateDto {
    id?: string;
    key: string;
    subject: string;
    body: string;
    channel: string;
    isActive: boolean;
}

@Component({
    selector: 'app-email-templates',
    standalone: true,
    imports: [CommonModule, FormsModule, ToastModule, TableModule, DialogModule, InputTextModule, InputTextarea, CheckboxModule, ButtonModule],
    providers: [MessageService],
    templateUrl: './email-templates.component.html',
    styleUrl: './email-templates.component.scss'
})
export class EmailTemplatesComponent implements OnInit {
    templates = signal<EmailTemplateDto[]>([]);
    loading = signal(false);
    saving = signal(false);
    showDialog = signal(false);
    isEditing = signal(false);
    currentTemplate: EmailTemplateDto = this.createEmptyTemplate();

    constructor(
        private http: HttpClient,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.loadTemplates();
    }

    createEmptyTemplate(): EmailTemplateDto {
        return {
            key: '',
            subject: '',
            body: '',
            channel: 'Email',
            isActive: true
        };
    }

    loadTemplates() {
        this.loading.set(true);
        const url = `${environment.apiUrl}/api/NotificationTemplate/NotificationTemplate_GetAll`;
        this.http.get<EmailTemplateDto[]>(url).subscribe({
            next: (templates) => {
                this.templates.set(templates || []);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load email templates'
                });
            }
        });
    }

    openCreateDialog() {
        this.currentTemplate = this.createEmptyTemplate();
        this.isEditing.set(false);
        this.showDialog.set(true);
    }

    openEditDialog(template: EmailTemplateDto) {
        this.currentTemplate = { ...template };
        this.isEditing.set(true);
        this.showDialog.set(true);
    }

    closeDialog() {
        if (this.saving()) return;
        this.showDialog.set(false);
    }

    saveTemplate() {
        if (!this.currentTemplate.key || !this.currentTemplate.subject) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation',
                detail: 'Key and Subject are required'
            });
            return;
        }

        this.saving.set(true);
        const isEdit = !!this.currentTemplate.id;
        const endpoint = isEdit ? 'NotificationTemplate_Update' : 'NotificationTemplate_Create';
        const url = `${environment.apiUrl}/api/NotificationTemplate/${endpoint}`;

        this.http.post<EmailTemplateDto>(url, this.currentTemplate).subscribe({
            next: () => {
                this.saving.set(false);
                this.showDialog.set(false);
                this.loadTemplates();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Saved',
                    detail: `Template ${isEdit ? 'updated' : 'created'} successfully`
                });
            },
            error: () => {
                this.saving.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save template'
                });
            }
        });
    }

    deleteTemplate(template: EmailTemplateDto) {
        if (!template.id) return;
        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }

        const url = `${environment.apiUrl}/api/NotificationTemplate/NotificationTemplate_Delete/${template.id}`;
        this.http.post(url, {}).subscribe({
            next: () => {
                this.loadTemplates();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Deleted',
                    detail: 'Template deleted successfully'
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to delete template'
                });
            }
        });
    }
}
