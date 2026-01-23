import { Component, signal, OnInit, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormServiceProxy, FormDto, CreateFormDto, UpdateFormDto, FormSubmissionDto } from '../../../core/services/service-proxies';

interface Alert {
    type: string;
    message: string;
}

interface FormField {
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string; // comma-separated for multi-option fields
    order: number;
}

// Using generated DTOs from service-proxies

@Component({
    selector: 'app-form-management',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [FormServiceProxy],
    schemas: [NO_ERRORS_SCHEMA],
    templateUrl: './form-management.component.html',
    styleUrls: ['./form-management.component.scss']
})
export class FormManagementComponent implements OnInit {
    Math = Math;
    alerts: Alert[] = [];
    formDialog: boolean = false;
    forms = signal<FormDto[]>([]);
    form: any = {};
    selectedForms!: FormDto[] | null;
    submitted: boolean = false;
    loading: boolean = false;
    formFields: FormField[] = [];
    
    // Submissions view state
    submissionsDialog: boolean = false;
    submissionsLoading: boolean = false;
    submissions: FormSubmissionDto[] = [];
    submissionsTotalCount: number = 0;
    submissionsPageNumber: number = 1;
    submissionsPageSize: number = 20;
    selectedFormForSubmissions: FormDto | null = null;
    
    showConfirmModal = false;
    confirmMessage = '';
    confirmAction: (() => void) | null = null;

    cols = [
        { field: 'name', header: 'Name' },
        { field: 'description', header: 'Description' },
        { field: 'submissionCount', header: 'Submissions' },
        { field: 'isActive', header: 'Active' },
        { field: 'createdAt', header: 'Created' }
    ];

    constructor(
        private router: Router,
        private formService: FormServiceProxy
    ) {}

    private generateId(): string {
        return 'fld-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
    }

    private loadFormFieldsFromJson(json: string | undefined | null): void {
        this.formFields = [];
        if (!json) {
            this.addField();
            return;
        }

        try {
            const parsed = JSON.parse(json);
            if (Array.isArray(parsed)) {
                this.formFields = parsed.map((f: any, index: number) => {
                    const options = Array.isArray(f.options)
                        ? f.options.join(', ')
                        : typeof f.options === 'string'
                        ? f.options
                        : '';
                    return {
                        id: this.generateId(),
                        name: f.name || '',
                        label: f.label || '',
                        type: f.type || 'text',
                        required: !!f.required,
                        placeholder: f.placeholder || '',
                        options,
                        order: typeof f.order === 'number' ? f.order : index
                    } as FormField;
                });
            }
        } catch {
            // If JSON is invalid, start with one empty field
            this.formFields = [];
        }

        if (this.formFields.length === 0) {
            this.addField();
        }
    }

    private syncFormFieldsToJson(): boolean {
        // Basic validation: at least one field with name and label
        if (!this.formFields.length) {
            this.showAlert('Please add at least one form field', 'danger');
            return false;
        }

        for (const field of this.formFields) {
            if (!field.label || !field.name) {
                this.showAlert('Each field must have a label and a name', 'danger');
                return false;
            }

            if (['select', 'checkbox', 'radio'].includes(field.type) && !field.options) {
                this.showAlert(`Field "${field.label}" requires options (comma-separated)`, 'danger');
                return false;
            }
        }

        const payload = this.formFields
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((f) => ({
                name: f.name,
                label: f.label,
                type: f.type,
                required: !!f.required,
                placeholder: f.placeholder || undefined,
                options: f.options
                    ? f.options
                          .split(',')
                          .map((o) => o.trim())
                          .filter((o) => !!o)
                    : undefined,
                order: f.order
            }));

        this.form.fields = JSON.stringify(payload, null, 2);
        return true;
    }

    addField(): void {
        const nextOrder = this.formFields.length ? Math.max(...this.formFields.map((f) => f.order)) + 1 : 0;
        this.formFields.push({
            id: this.generateId(),
            name: '',
            label: '',
            type: 'text',
            required: false,
            placeholder: '',
            options: '',
            order: nextOrder
        });
    }

    removeField(index: number): void {
        this.formFields.splice(index, 1);
        this.formFields = this.formFields.map((f, i) => ({ ...f, order: i }));
    }

    moveFieldUp(index: number): void {
        if (index <= 0) return;
        const temp = this.formFields[index - 1];
        this.formFields[index - 1] = this.formFields[index];
        this.formFields[index] = temp;
        this.formFields = this.formFields.map((f, i) => ({ ...f, order: i }));
    }

    moveFieldDown(index: number): void {
        if (index >= this.formFields.length - 1) return;
        const temp = this.formFields[index + 1];
        this.formFields[index + 1] = this.formFields[index];
        this.formFields[index] = temp;
        this.formFields = this.formFields.map((f, i) => ({ ...f, order: i }));
    }

    showAlert(message: string, type: string = 'info'): void {
        this.alerts.push({ type, message });
        setTimeout(() => this.dismissAlert(this.alerts[0]), 5000);
    }

    dismissAlert(alert: Alert): void {
        const index = this.alerts.indexOf(alert);
        if (index > -1) {
            this.alerts.splice(index, 1);
        }
    }

    showConfirm(message: string, action: () => void): void {
        this.confirmMessage = message;
        this.confirmAction = action;
        this.showConfirmModal = true;
    }

    executeConfirm(): void {
        if (this.confirmAction) {
            this.confirmAction();
        }
        this.showConfirmModal = false;
        this.confirmAction = null;
    }

    cancelConfirm(): void {
        this.showConfirmModal = false;
        this.confirmAction = null;
    }

    ngOnInit() {
        this.loadForms();
    }

    loadForms() {
        this.loading = true;
        this.formService.form_GetAll(1, 100, undefined).subscribe(
            (response) => {
                const result = response.result;
                this.forms.set(result?.forms ?? []);
                this.loading = false;
            },
            () => {
                this.showAlert('Failed to load forms', 'danger');
                this.loading = false;
            }
        );
    }

    openNew() {
        this.form = {
            name: '',
            description: '',
            fields: '[]',
            isActive: true,
            notificationEmail: '',
            successMessage: 'Thank you for your submission!',
            linkSubmissionsToUser: false,
            allowMultipleSubmissionsPerUser: true,
            prefillLastSubmissionForUser: false,
            allowUserToEditSubmission: false
        };
        this.formFields = [];
        this.addField();
        this.submitted = false;
        this.formDialog = true;
    }

    editForm(form: FormDto) {
        this.form = { ...form };
        this.loadFormFieldsFromJson(this.form.fields);
        this.formDialog = true;
    }

    deleteForm(form: FormDto) {
        this.showConfirm(
            `Are you sure you want to delete form '${form.name}'?`,
            () => {
                this.formService.form_Delete(form.id!).subscribe(
                    () => {
                        this.loadForms();
                        this.showAlert('Form deleted', 'success');
                    },
                    () => {
                        this.showAlert('Failed to delete form', 'danger');
                    }
                );
            }
        );
    }

    viewSubmissions(form: FormDto) {
        this.selectedFormForSubmissions = form;
        this.submissionsDialog = true;
        this.submissionsPageNumber = 1;
        this.loadSubmissions();
    }

    private loadSubmissions(): void {
        if (!this.selectedFormForSubmissions || !this.selectedFormForSubmissions.id) {
            return;
        }

        this.submissionsLoading = true;
        this.formService
            .formSubmission_GetByFormId(this.selectedFormForSubmissions.id, this.submissionsPageNumber, this.submissionsPageSize, undefined)
            .subscribe(
                (response) => {
                    const result = response.result;
                    this.submissions = result?.submissions ?? [];
                    this.submissionsTotalCount = result?.totalCount ?? 0;
                    this.submissionsPageNumber = result?.pageNumber ?? 1;
                    this.submissionsPageSize = result?.pageSize ?? this.submissionsPageSize;
                    this.submissionsLoading = false;
                },
                () => {
                    this.showAlert('Failed to load submissions', 'danger');
                    this.submissionsLoading = false;
                }
            );
    }

    closeSubmissionsDialog(): void {
        this.submissionsDialog = false;
        this.selectedFormForSubmissions = null;
        this.submissions = [];
        this.submissionsTotalCount = 0;
        this.submissionsPageNumber = 1;
    }

    parseSubmissionData(submission: FormSubmissionDto): { key: string; value: any }[] {
        if (!submission.submissionData) {
            return [];
        }
        try {
            const obj = JSON.parse(submission.submissionData);
            if (!obj || typeof obj !== 'object') {
                return [];
            }
            return Object.keys(obj).map((key) => ({ key, value: (obj as any)[key] }));
        } catch {
            return [];
        }
    }

    hideDialog() {
        this.formDialog = false;
        this.submitted = false;
    }

    saveForm() {
        this.submitted = true;

        if (!this.form.name) {
            this.showAlert('Form name is required', 'danger');
            return;
        }

        // Build JSON for fields from GUI definition
        if (!this.syncFormFieldsToJson()) {
            return;
        }

        if (this.form.id) {
            // Update existing form
            const updateDto = new UpdateFormDto();
            updateDto.name = this.form.name;
            updateDto.description = this.form.description;
            updateDto.fields = this.form.fields;
            updateDto.isActive = this.form.isActive;
            updateDto.notificationEmail = this.form.notificationEmail;
            updateDto.successMessage = this.form.successMessage;
            updateDto.linkSubmissionsToUser = !!this.form.linkSubmissionsToUser;
            updateDto.allowMultipleSubmissionsPerUser = !!this.form.allowMultipleSubmissionsPerUser;
            updateDto.prefillLastSubmissionForUser = !!this.form.prefillLastSubmissionForUser;
            updateDto.allowUserToEditSubmission = !!this.form.allowUserToEditSubmission;

            this.formService.form_Update(this.form.id, updateDto).subscribe(
                () => {
                    this.loadForms();
                    this.showAlert('Form updated', 'success');
                    this.hideDialog();
                },
                () => {
                    this.showAlert('Failed to update form', 'danger');
                }
            );
        } else {
            // Create new form
            const createDto = new CreateFormDto();
            createDto.name = this.form.name;
            createDto.description = this.form.description;
            createDto.fields = this.form.fields;
            createDto.isActive = this.form.isActive;
            createDto.notificationEmail = this.form.notificationEmail;
            createDto.successMessage = this.form.successMessage;
            createDto.linkSubmissionsToUser = !!this.form.linkSubmissionsToUser;
            createDto.allowMultipleSubmissionsPerUser = !!this.form.allowMultipleSubmissionsPerUser;
            createDto.prefillLastSubmissionForUser = !!this.form.prefillLastSubmissionForUser;
            createDto.allowUserToEditSubmission = !!this.form.allowUserToEditSubmission;

            this.formService.form_Create(createDto).subscribe(
                () => {
                    this.loadForms();
                    this.showAlert('Form created', 'success');
                    this.hideDialog();
                },
                () => {
                    this.showAlert('Failed to create form', 'danger');
                }
            );
        }
    }

    exportCSV() {
        this.showAlert('Export functionality coming soon', 'info');
    }
}
