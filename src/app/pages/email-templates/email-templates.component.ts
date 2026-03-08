import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { NotificationTemplateServiceProxy } from '../../core/services/service-proxies';

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
    imports: [CommonModule, FormsModule, ToastModule, TableModule, DialogModule, InputTextModule, CheckboxModule, ButtonModule],
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
        private notificationTemplateService: NotificationTemplateServiceProxy,
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
        this.notificationTemplateService.notificationTemplate_GetAll().subscribe({
            next: (response) => {
                const templates = (response?.result as any as EmailTemplateDto[]) || [];
                this.templates.set(templates);
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
        const request$ = isEdit
            ? this.notificationTemplateService.notificationTemplate_Update(this.currentTemplate as any)
            : this.notificationTemplateService.notificationTemplate_Create(this.currentTemplate as any);

        request$.subscribe({
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

        this.notificationTemplateService.notificationTemplate_Delete(template.id).subscribe({
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
