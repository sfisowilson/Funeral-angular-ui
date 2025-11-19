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
import { RequiredDocumentService } from '../../../core/services/generated/required-document/required-document.service';
import { RequiredDocumentDto } from '../../../core/models';

// TODO: Move to backend when migrated
export enum RequiredDocumentType {
    _0 = 0, // Member ID Document
    _1 = 1, // Member Proof of Address
    _2 = 2, // Dependent ID Document
    _3 = 3, // Dependent Birth Certificate
    _4 = 4, // Beneficiary ID Document
    _5 = 5, // Policy Document
    _6 = 6  // Other
}

export enum RequiredDocumentEntityType {
    _0 = 0, // Member
    _1 = 1, // Dependent
    _2 = 2, // Beneficiary
    _3 = 3  // Policy
}

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
    providers: [MessageService, ConfirmationService],
    templateUrl: './required-documents.component.html',
    styleUrl: './required-documents.component.scss'
})
export class RequiredDocumentsComponent implements OnInit {
    documents = signal<RequiredDocumentDto[]>([]);
    loading = signal(false);
    showDialog = signal(false);
    isEditMode = signal(false);
    
    currentDocument: RequiredDocumentDto = {} as RequiredDocumentDto;

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
        private requiredDocService: RequiredDocumentService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadDocuments();
    }

    loadDocuments() {
        this.loading.set(true);
        this.requiredDocService.getRequiredDocumentRequiredDocumentGetAll().subscribe({
            next: (result) => {
                this.documents.set(result);
                this.loading.set(false);
            },
            error: (error: any) => {
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
        this.currentDocument = {
            id: '00000000-0000-0000-0000-000000000000',
            tenantId: '',
            documentName: '',
            description: '',
            documentType: RequiredDocumentType._6.toString(),
            entityType: RequiredDocumentEntityType._0.toString(),
            isRequired: true,
            isActive: true,
            allowedFileTypes: 'pdf,jpg,jpeg,png',
            maxFileSizeBytes: 5242880, // 5MB
            createdBy: '',
            updatedBy: '',
            createdAt: new Date() as any,
            updatedAt: new Date() as any
        } as RequiredDocumentDto;
        this.isEditMode.set(false);
        this.showDialog.set(true);
    }

    editDocument(doc: RequiredDocumentDto) {
        this.currentDocument = { ...doc };
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
            this.requiredDocService.putRequiredDocumentRequiredDocumentUpdate(this.currentDocument).subscribe({
                next: (result) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Document updated successfully'
                    });
                    this.showDialog.set(false);
                    this.loadDocuments();
                },
                error: (error: any) => {
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
            this.requiredDocService.postRequiredDocumentRequiredDocumentCreate(this.currentDocument).subscribe({
                next: (result) => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Document created successfully'
                    });
                    this.showDialog.set(false);
                    this.loadDocuments();
                },
                error: (error: any) => {
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
                this.requiredDocService.deleteRequiredDocumentRequiredDocumentDeleteId(doc.id).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Document deleted successfully'
                        });
                        this.loadDocuments();
                    },
                    error: (error: any) => {
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
