import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { 
    RequiredDocumentServiceProxy,
    RequiredDocumentDto,
    RequiredDocumentType,
    RequiredDocumentEntityType
} from '../../../core/services/service-proxies';

@Component({
    selector: 'app-required-documents',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputSwitchModule,
        DropdownModule,
        InputNumberModule,
        ToastModule,
        ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService, RequiredDocumentServiceProxy],
    templateUrl: './required-documents.component.html',
    styleUrl: './required-documents.component.scss'
})
export class RequiredDocumentsComponent implements OnInit {
    documents = signal<RequiredDocumentDto[]>([]);
    loading = signal(false);
    showDialog = signal(false);
    isEditMode = signal(false);
    
    currentDocument: RequiredDocumentDto = new RequiredDocumentDto();

    documentTypeOptions = [
        { label: 'Member ID Document', value: RequiredDocumentType._0 },
        { label: 'Member Proof of Address', value: RequiredDocumentType._1 },
        { label: 'Dependent ID Document', value: RequiredDocumentType._2 },
        { label: 'Dependent Birth Certificate', value: RequiredDocumentType._3 },
        { label: 'Beneficiary ID Document', value: RequiredDocumentType._4 },
        { label: 'Policy Document', value: RequiredDocumentType._5 },
        { label: 'Other', value: RequiredDocumentType._6 }
    ];

    entityTypeOptions = [
        { label: 'Member', value: RequiredDocumentEntityType._0 },
        { label: 'Dependent', value: RequiredDocumentEntityType._1 },
        { label: 'Beneficiary', value: RequiredDocumentEntityType._2 },
        { label: 'Policy', value: RequiredDocumentEntityType._3 }
    ];

    constructor(
        private requiredDocService: RequiredDocumentServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadDocuments();
    }

    loadDocuments() {
        this.loading.set(true);
        this.requiredDocService.requiredDocument_GetAll().subscribe({
            next: (result) => {
                this.documents.set(result);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading required documents:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load required documents'
                });
                this.loading.set(false);
            }
        });
    }

    openNewDialog() {
        this.currentDocument = new RequiredDocumentDto({
            id: '00000000-0000-0000-0000-000000000000',
            documentName: '',
            description: '',
            documentType: RequiredDocumentType._6,
            entityType: RequiredDocumentEntityType._0,
            isRequired: true,
            allowedFileTypes: 'pdf,jpg,jpeg,png',
            maxFileSizeBytes: 5242880 // 5MB
        });
        this.isEditMode.set(false);
        this.showDialog.set(true);
    }

    editDocument(doc: RequiredDocumentDto) {
        this.currentDocument = RequiredDocumentDto.fromJS(doc.toJSON());
        this.isEditMode.set(true);
        this.showDialog.set(true);
    }

    saveDocument() {
        if (!this.currentDocument.documentName) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please provide a document name'
            });
            return;
        }

        this.loading.set(true);
        
        if (this.isEditMode()) {
            this.requiredDocService.requiredDocument_Update(this.currentDocument).subscribe({
                next: (result) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Document updated successfully'
                    });
                    this.showDialog.set(false);
                    this.loadDocuments();
                },
                error: (error) => {
                    console.error('Error saving document:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save document configuration'
                    });
                    this.loading.set(false);
                }
            });
        } else {
            this.requiredDocService.requiredDocument_Create(this.currentDocument).subscribe({
                next: (result) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Document created successfully'
                    });
                    this.showDialog.set(false);
                    this.loadDocuments();
                },
                error: (error) => {
                    console.error('Error saving document:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to save document configuration'
                    });
                    this.loading.set(false);
                }
            });
        }
    }

    deleteDocument(doc: RequiredDocumentDto) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${doc.documentName}"?`,
            header: 'Delete Confirmation',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.loading.set(true);
                this.requiredDocService.requiredDocument_Delete(doc.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Document deleted successfully'
                        });
                        this.loadDocuments();
                    },
                    error: (error) => {
                        console.error('Error deleting document:', error);
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Failed to delete document'
                        });
                        this.loading.set(false);
                    }
                });
            }
        });
    }

    cancel() {
        this.showDialog.set(false);
    }

    getDocumentTypeName(type: RequiredDocumentType): string {
        const option = this.documentTypeOptions.find(opt => opt.value === type);
        return option?.label || 'Unknown';
    }

    getEntityTypeName(type: RequiredDocumentEntityType): string {
        const option = this.entityTypeOptions.find(opt => opt.value === type);
        return option?.label || 'Unknown';
    }

    formatFileSize(bytes: number | undefined): string {
        if (!bytes) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    }
}
