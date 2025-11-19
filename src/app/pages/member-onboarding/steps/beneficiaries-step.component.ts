import { Component, OnInit, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CalendarModule } from 'primeng/calendar';
import { InputMaskModule } from 'primeng/inputmask';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { BeneficiariesService } from '../../../core/services/generated/beneficiaries/beneficiaries.service';
import { FileUploadsService } from '../../../core/services/generated/file-uploads/file-uploads.service';
import { DocumentRequirementsService } from '../../../core/services/generated/document-requirements/document-requirements.service';
import {
    BeneficiaryDto,
    DocumentRequirement,
    MemberDocumentType,
    FileMetadataDto
} from '../../../core/models';
import { SAIdValidator, SAIdInfo } from '../../../shared/utils/sa-id-validator';
import { AuthService } from '../../../auth/auth-service';

@Component({
    selector: 'app-beneficiaries-step',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputNumberModule,
        TooltipModule,
        ToastModule,
        CalendarModule,
        InputMaskModule,
        FileUploadModule,
        DropdownModule,
        TabViewModule
    ],
    providers: [
        MessageService
    ],
    templateUrl: './beneficiaries-step.component.html',
    styleUrl: './beneficiaries-step.component.scss'
})
export class BeneficiariesStepComponent implements OnInit {
    @Input() viewMode: boolean = false;
    @Input() memberId?: string;
    @Output() stepComplete = new EventEmitter<void>();

    beneficiaries = signal<BeneficiaryDto[]>([]);
    displayDialog = false;
    editMode = signal(false);
    currentBeneficiary: BeneficiaryDto = {} as BeneficiaryDto;
    loading = signal(false);
    private stepCompleteSubject = new Subject<void>();
    
    // SA ID validation
    idInfo = signal<SAIdInfo | null>(null);
    parsedDateOfBirth = signal<Date | null>(null);
    parsedGender = signal<string | null>(null);

    // Document upload functionality
    uploadedDocuments = signal<FileMetadataDto[]>([]);
    uploading = signal(false);
    currentBeneficiaryId = signal<string | undefined>(undefined);
    selectedDocumentType: MemberDocumentType | undefined = undefined;
    selectedFile: File | undefined = undefined;

    documentTypes = [
        { label: 'ID Document / Passport', value: MemberDocumentType.IdentificationDocument, icon: 'pi-id-card', description: 'Beneficiary identification' },
        { label: 'Birth Certificate', value: MemberDocumentType.BirthCertificate, icon: 'pi-user', description: 'For beneficiary verification' },
        { label: 'Banking Document', value: MemberDocumentType.BankingDocument, icon: 'pi-money-bill', description: 'Bank account details for payout' },
        { label: 'Other Document', value: MemberDocumentType.Other, icon: 'pi-file', description: 'Any other supporting document' }
    ];

    constructor(
        private beneficiaryService: BeneficiariesService,
        private messageService: MessageService,
        private fileUploadService: FileUploadsService,
        private documentRequirementService: DocumentRequirementsService,
        private authService: AuthService
    ) {
        // Debounce step completion to prevent rapid emissions
        this.stepCompleteSubject.pipe(
            debounceTime(500)
        ).subscribe(() => {
            this.stepComplete.emit();
        });
    }

    ngOnInit() {
        this.loadBeneficiaries();
    }

    loadBeneficiaries() {
        this.loading.set(true);
        
        // Use appropriate method based on whether viewing own or another member's beneficiaries
        const beneficiariesObservable = this.memberId
            ? this.beneficiaryService.getApiBeneficiaryBeneficiaryGetBeneficiariesByMemberIdMemberId(this.memberId)
            : this.beneficiaryService.getApiBeneficiaryBeneficiaryGetMyBeneficiaries();
        
        beneficiariesObservable.subscribe({
            next: (data: any) => {
                this.beneficiaries.set(data);
                this.checkCompletion();
                this.loading.set(false);
            },
            error: (error: any) => {
                console.error('Error loading beneficiaries:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load beneficiaries'
                });
                this.loading.set(false);
            }
        });
    }

    showAddDialog() {
        this.editMode.set(false);
        this.currentBeneficiary = {
            id: undefined,
            name: undefined,
            email: undefined,
            address: undefined,
            phone1: undefined,
            phone2: undefined,
            identificationNumber: undefined
        } as any;
        this.idInfo.set(null);
        this.parsedDateOfBirth.set(null);
        this.parsedGender.set(null);
        this.currentBeneficiaryId.set(undefined);
        this.uploadedDocuments.set([]);
        this.selectedDocumentType = undefined;
        this.selectedFile = undefined;
        this.displayDialog = true;
    }

    editBeneficiary(beneficiary: BeneficiaryDto) {
        this.editMode.set(true);
        this.currentBeneficiary = { ...beneficiary as any };
        
        // Validate ID if present
        if (beneficiary.identificationNumber) {
            this.validateIdNumber(beneficiary.identificationNumber);
        }
        
        // Load documents for this beneficiary
        this.currentBeneficiaryId.set(beneficiary.id);
        if (beneficiary.id) {
            this.loadBeneficiaryDocuments(beneficiary.id);
        }
        
        this.displayDialog = true;
    }

    validateIdNumber(idNumber: string | undefined) {
        if (!idNumber) {
            this.idInfo.set(null);
            this.parsedDateOfBirth.set(null);
            this.parsedGender.set(null);
            return;
        }

        const info = SAIdValidator.validate(idNumber);
        this.idInfo.set(info);

        if (info.isValid) {
            this.parsedDateOfBirth.set(info.dateOfBirth);
            this.parsedGender.set(info.gender);
        } else {
            this.parsedDateOfBirth.set(null);
            this.parsedGender.set(null);
        }
    }

    onIdNumberChange() {
        this.validateIdNumber(this.currentBeneficiary.identificationNumber);
    }

    saveBeneficiary() {
        if (!this.currentBeneficiary.name || !this.currentBeneficiary.identificationNumber) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Name and ID Number are required'
            });
            return;
        }

        // Validate SA ID
        const info = this.idInfo();
        if (!info || !info.isValid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Invalid ID Number',
                detail: info?.errorMessage || 'Please enter a valid South African ID number'
            });
            return;
        }

        if (this.editMode()) {
            this.beneficiaryService.putApiBeneficiaryBeneficiaryUpdateBeneficiary(this.currentBeneficiary).subscribe({
                next: () => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Beneficiary updated successfully' 
                    });
                    this.loadBeneficiaries();
                    this.displayDialog = false;
                },
                error: (error: any) => {
                    console.error('Error updating beneficiary:', error);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: 'Failed to update beneficiary' 
                    });
                }
            });
        } else {
            this.beneficiaryService.postApiBeneficiaryBeneficiaryCreateBeneficiary(this.currentBeneficiary).subscribe({
                next: (createdBeneficiary: any) => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Beneficiary added successfully' 
                    });
                    
                    // Set the current beneficiary ID so user can upload documents
                    this.currentBeneficiaryId.set(createdBeneficiary.id);
                    this.currentBeneficiary = createdBeneficiary;
                    this.editMode.set(true); // Switch to edit mode
                    
                    // Reload beneficiaries
                    this.loadBeneficiaries();
                },
                error: (error: any) => {
                    console.error('Error adding beneficiary:', error);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: 'Failed to add beneficiary' 
                    });
                }
            });
        }
    }

    deleteBeneficiary(id: string) {
        if (confirm('Are you sure you want to delete this beneficiary?')) {
            this.beneficiaryService.deleteApiBeneficiaryBeneficiaryDeleteBeneficiaryId(id).subscribe({
                next: () => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Beneficiary deleted successfully' 
                    });
                    this.loadBeneficiaries();
                },
                error: (error: any) => {
                    console.error('Error deleting beneficiary:', error);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: 'Failed to delete beneficiary' 
                    });
                }
            });
        }
    }

    checkCompletion() {
        const hasAtLeastOne = this.beneficiaries().length > 0;
        if (hasAtLeastOne) {
            // Use subject to debounce the emission
            this.stepCompleteSubject.next();
        }
    }

    // Document upload methods
    loadBeneficiaryDocuments(beneficiaryId: string) {
        const memberId = this.authService.getUserId();
        if (!memberId) return;

        const filesObservable = this.memberId
            ? this.fileUploadService.getApiFileUploadFileGetFilesByMemberIdMemberId<FileMetadataDto[]>(this.memberId)
            : this.fileUploadService.getApiFileUploadFileGetMyFiles<FileMetadataDto[]>();
        
        filesObservable.subscribe({
            next: (files: any) => {
                // Filter files for this beneficiary
                const beneficiaryFiles = files.filter((f: any) => 
                    f.entityType === 'Beneficiary' && f.entityId === beneficiaryId
                );
                this.uploadedDocuments.set(beneficiaryFiles);
            },
            error: (error: any) => {
                console.error('Error loading beneficiary documents:', error);
            }
        });
    }

    onFileSelect(event: any) {
        if (event.files && event.files.length > 0) {
            this.selectedFile = event.files[0];
        }
    }

    uploadBeneficiaryDocument() {
        if (!this.selectedFile || !this.selectedDocumentType) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select a document type and file'
            });
            return;
        }

        if (!this.currentBeneficiaryId()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please save the beneficiary before uploading documents'
            });
            return;
        }

        this.uploading.set(true);

        this.fileUploadService.postApiFileUploadFileUploadFile({
            file: this.selectedFile,
            entityType: "Beneficiary",
            entityId: this.currentBeneficiaryId()!,
            memberDocumentType: this.selectedDocumentType,
            isRequired: false
        }).subscribe({
            next: (result) => {
                this.uploading.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Document uploaded successfully'
                });
                // Reload documents
                this.loadBeneficiaryDocuments(this.currentBeneficiaryId()!);
                this.selectedFile = undefined;
                this.selectedDocumentType = undefined;
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

    deleteBeneficiaryDocument(fileId: string) {
        if (confirm('Are you sure you want to delete this document?')) {
            this.fileUploadService.deleteApiFileUploadFileDeleteFileFileId(fileId).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Document deleted successfully'
                    });
                    if (this.currentBeneficiaryId()) {
                        this.loadBeneficiaryDocuments(this.currentBeneficiaryId()!);
                    }
                },
                error: (error: any) => {
                    console.error('Error deleting document:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Failed to delete document'
                    });
                }
            });
        }
    }
}
