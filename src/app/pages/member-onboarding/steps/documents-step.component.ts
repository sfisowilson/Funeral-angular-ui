import { Component, OnInit, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { 
    FileUploadServiceProxy,
    RequiredDocumentServiceProxy,
    RequiredDocumentDto,
    FileMetadataDto,
    DocumentRequirementServiceProxy,
    DocumentRequirement,
    DocumentComplianceStatus,
    MemberDocumentType,
    DocumentVerificationStatus
} from '../../../core/services/service-proxies';
import { AuthService } from '../../../auth/auth-service';

interface DocumentUpload {
    documentType: MemberDocumentType | undefined;
    entityType: string;
    entityId?: string;
    file?: File;
}

@Component({
    selector: 'app-documents-step',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        DropdownModule,
        FileUploadModule,
        ToastModule
    ],
    providers: [
        MessageService,
        FileUploadServiceProxy,
        RequiredDocumentServiceProxy,
        DocumentRequirementServiceProxy
    ],
    templateUrl: './documents-step.component.html',
    styleUrl: './documents-step.component.scss'
})
export class DocumentsStepComponent implements OnInit {
    @Input() viewMode: boolean = false;
    @Input() memberId?: string;
    @Output() stepComplete = new EventEmitter<void>();
    private stepCompleteSubject = new Subject<void>();

    requiredDocuments = signal<DocumentRequirement[]>([]);
    uploadedDocuments = signal<FileMetadataDto[]>([]);
    complianceStatus = signal<DocumentComplianceStatus | null>(null);
    displayDialog = false;
    loading = signal(false);
    uploading = signal(false);
    
    currentUpload: DocumentUpload = {
        documentType: undefined,
        entityType: 'Member'
    };

    // Phase 4: MemberDocumentType enum mapping
    documentTypes = [
        { label: 'ID Document / Passport', value: MemberDocumentType._1, icon: 'pi-id-card', description: 'South African ID or International Passport' },
        { label: 'Proof of Residential Address', value: MemberDocumentType._2, icon: 'pi-home', description: 'Utility bill, bank statement, or lease agreement' },
        { label: 'Marriage Certificate', value: MemberDocumentType._3, icon: 'pi-heart', description: 'Required if you have a spouse dependent' },
        { label: 'Valid Passport', value: MemberDocumentType._4, icon: 'pi-globe', description: 'Required for foreign nationals' },
        { label: 'Work Permit / Visa', value: MemberDocumentType._5, icon: 'pi-briefcase', description: 'Required for foreign nationals in South Africa' },
        { label: 'Birth Certificate', value: MemberDocumentType._6, icon: 'pi-user', description: 'Optional supporting document' },
        { label: 'Death Certificate', value: MemberDocumentType._7, icon: 'pi-file', description: 'For claims processing' },
        { label: 'Banking Document', value: MemberDocumentType._8, icon: 'pi-money-bill', description: 'Bank account details' },
        { label: 'Other Document', value: MemberDocumentType._99, icon: 'pi-file', description: 'Any other supporting document' }
    ];

    constructor(
        private requiredDocumentService: RequiredDocumentServiceProxy,
        private fileUploadService: FileUploadServiceProxy,
        private documentRequirementService: DocumentRequirementServiceProxy,
        private messageService: MessageService,
        public authService: AuthService
    ) {
        this.stepCompleteSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            this.stepComplete.emit();
        });
    }

    ngOnInit() {
        this.loadRequiredDocuments();
        this.loadMyFiles();
        this.loadComplianceStatus();
    }

    // Public method that parent can call to refresh files
    public refreshFiles() {
        console.log('[DocumentsStep] refreshFiles called');
        console.log('[DocumentsStep] fileUploadService:', this.fileUploadService);
        console.log('[DocumentsStep] authService.getUserId():', this.authService.getUserId());
        this.loadMyFiles();
        this.loadRequiredDocuments(); // Refresh requirements as well
        this.loadComplianceStatus(); // Refresh compliance status
    }

    loadRequiredDocuments() {
        this.loading.set(true);
        const memberId = this.authService.getUserId();
        
        if (!memberId) {
            console.warn('No member ID available for loading required documents');
            this.loading.set(false);
            return;
        }

        // Phase 4: Use new DocumentRequirementService to get conditional requirements
        this.documentRequirementService.documentRequirement_GetRequiredDocuments(memberId).subscribe({
            next: (data: DocumentRequirement[]) => {
                console.log('[Phase 4] Required documents loaded:', data);
                this.requiredDocuments.set(data);
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

    loadComplianceStatus() {
        const memberId = this.authService.getUserId();
        if (!memberId) return;

        // Phase 4: Get comprehensive compliance status
        this.documentRequirementService.documentRequirement_GetComplianceStatus(memberId).subscribe({
            next: (status: DocumentComplianceStatus) => {
                console.log('[Phase 4] Compliance status:', status);
                this.complianceStatus.set(status);
            },
            error: (error: any) => {
                console.error('Error loading compliance status:', error);
            }
        });
    }

    loadMyFiles() {
        console.log('[DocumentsStep] loadMyFiles called');
        
        // Use appropriate method based on whether viewing own or another member's files
        const filesObservable = this.memberId
            ? this.fileUploadService.file_GetFilesByMemberId(this.memberId)
            : this.fileUploadService.file_GetMyFiles();
        
        filesObservable.subscribe({
            next: (files: FileMetadataDto[]) => {
                console.log('[DocumentsStep] Received files from server:', files);
                const fileDtos = files.map(f => {
                    // Use description (document type like "IdDocument") for display
                    // The backend stores document type in the Description field
                    if (f.description) {
                        f.entityType = f.description;
                    }
                    return f;
                });
                console.log('[DocumentsStep] Mapped files:', fileDtos);
                this.uploadedDocuments.set(fileDtos);
                console.log('[DocumentsStep] uploadedDocuments signal updated, count:', fileDtos.length);
                this.checkCompletion();
            },
            error: (error: any) => {
                console.error('[DocumentsStep] Error loading files:', error);
                console.error('[DocumentsStep] Error status:', error?.status);
                console.error('[DocumentsStep] Error message:', error?.message);
            }
        });
    }

    // Check if profile is complete based on uploaded files
    checkCompletion() {
        const files = this.uploadedDocuments();
        // At minimum, user should upload an ID document
        const hasIdDocument = files.some(f => 
            f.entityType?.toLowerCase().includes('id') || 
            f.fileName?.toLowerCase().includes('id')
        );
        
        if (hasIdDocument) {
            this.stepCompleteSubject.next();
        }
    }

    showUploadDialog() {
        this.currentUpload = {
            documentType: undefined,
            entityType: 'Member'
        };
        this.displayDialog = true;
    }

    onFileSelect(event: any) {
        if (event.files && event.files.length > 0) {
            this.currentUpload.file = event.files[0];
        }
    }

    uploadDocument() {
        if (!this.currentUpload.file || !this.currentUpload.documentType) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select a document type and file'
            });
            return;
        }

        // Get current user's ID from JWT token
        const memberId = this.authService.getUserId();
        if (!memberId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Authentication Error',
                detail: 'Could not determine user ID. Please log in again.'
            });
            return;
        }

        this.uploading.set(true);

        // Use the generated service proxy for proper authentication and base URL handling
        const fileParameter = {
            data: this.currentUpload.file,
            fileName: this.currentUpload.file.name
        };

        // Phase 4: Check if this document type is required
        const requirement = this.requiredDocuments().find(r => r.documentType === this.currentUpload.documentType);
        const isRequired = requirement?.isRequired || false;

        // Phase 4: Upload with MemberDocumentType and isRequired flag
        this.fileUploadService.file_UploadFile(
            "Member",  // entityType must be "Member"
            memberId,  // entityId must be the current user's ID
            undefined, // documentType (legacy field - can be undefined)
            this.currentUpload.documentType, // Phase 4: memberDocumentType (enum value)
            isRequired, // Phase 4: isRequired flag
            fileParameter // file data
        ).subscribe({
            next: (result: FileMetadataDto) => {
                this.uploading.set(false);
                const docLabel = this.getDocumentTypeLabel(this.currentUpload.documentType!);
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: `${docLabel} uploaded successfully and pending verification` 
                });
                
                this.displayDialog = false;
                
                // Reload all data to reflect new state
                this.loadMyFiles();
                this.loadRequiredDocuments();
                this.loadComplianceStatus();
            },
            error: (error: any) => {
                this.uploading.set(false);
                console.error('Upload error:', error);
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: error.message || 'Failed to upload document' 
                });
            }
        });
    }

    getDocumentTypeLabel(value: MemberDocumentType | number): string {
        const type = this.documentTypes.find(t => t.value === value);
        return type?.label || `Document Type ${value}`;
    }

    getDocumentTypeInfo(value: MemberDocumentType) {
        return this.documentTypes.find(t => t.value === value);
    }

    getVerificationStatusInfo(status: DocumentVerificationStatus | undefined) {
        switch (status) {
            case DocumentVerificationStatus._0: // Pending
                return { label: 'Pending Verification', severity: 'info', icon: 'pi-clock' };
            case DocumentVerificationStatus._1: // Approved
                return { label: 'Approved', severity: 'success', icon: 'pi-check-circle' };
            case DocumentVerificationStatus._2: // Rejected
                return { label: 'Rejected', severity: 'danger', icon: 'pi-times-circle' };
            case DocumentVerificationStatus._3: // RequiresResubmission
                return { label: 'Requires Resubmission', severity: 'warning', icon: 'pi-refresh' };
            default:
                return { label: 'Unknown', severity: 'secondary', icon: 'pi-question-circle' };
        }
    }

    isRequiredDocumentUploaded(requirement: DocumentRequirement): boolean {
        return requirement.isUploaded;
    }

    getSelectedDocumentRequirement(): DocumentRequirement | undefined {
        if (!this.currentUpload.documentType) return undefined;
        return this.requiredDocuments().find(r => r.documentType === this.currentUpload.documentType);
    }
}
