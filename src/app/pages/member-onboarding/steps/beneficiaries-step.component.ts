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
import { 
    BeneficiaryServiceProxy,
    BeneficiaryDto,
    FileUploadServiceProxy,
    DocumentRequirementServiceProxy,
    DocumentRequirement,
    MemberDocumentType,
    FileMetadataDto
} from '../../../core/services/service-proxies';
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
        MessageService,
        FileUploadServiceProxy,
        DocumentRequirementServiceProxy
    ],
    templateUrl: './beneficiaries-step.component.html',
    styleUrl: './beneficiaries-step.component.scss'
})
export class BeneficiariesStepComponent implements OnInit {
        // Used for ngFor trackBy on uploadedDocuments
        trackByDocId(index: number, doc: any): any {
            return doc.id;
        }
    @Input() viewMode: boolean = false;
    @Input() memberId?: string;
    @Output() stepComplete = new EventEmitter<void>();

    beneficiaries = signal<BeneficiaryDto[]>([]);
    displayDialog = false;
    editMode = signal(false);
    currentBeneficiary: BeneficiaryDto = {} as BeneficiaryDto;
    loading = signal(false);
    private stepCompleteSubject = new Subject<void>();
    activeTab: 'info' | 'docs' = 'info'; // Track active tab in modal
    
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
        { label: 'ID Document / Passport', value: MemberDocumentType._1, icon: 'pi-id-card', description: 'Beneficiary identification' },
        { label: 'Birth Certificate', value: MemberDocumentType._6, icon: 'pi-user', description: 'For beneficiary verification' },
        { label: 'Banking Document', value: MemberDocumentType._8, icon: 'pi-money-bill', description: 'Bank account details for payout' },
        { label: 'Other Document', value: MemberDocumentType._99, icon: 'pi-file', description: 'Any other supporting document' }
    ];

    constructor(
        private beneficiaryService: BeneficiaryServiceProxy,
        private messageService: MessageService,
        private fileUploadService: FileUploadServiceProxy,
        private documentRequirementService: DocumentRequirementServiceProxy,
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
            ? this.beneficiaryService.beneficiary_GetBeneficiariesByMemberId(this.memberId)
            : this.beneficiaryService.beneficiary_GetMyBeneficiaries();
        
        beneficiariesObservable.subscribe({
            next: (data) => {
                this.beneficiaries.set(data);
                this.checkCompletion();
                this.loading.set(false);
            },
            error: (error) => {
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
        this.activeTab = 'info'; // Reset to info tab
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
        this.activeTab = 'info'; // Reset to info tab
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
            this.beneficiaryService.beneficiary_UpdateBeneficiary(this.currentBeneficiary).subscribe({
                next: () => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Beneficiary updated successfully' 
                    });
                    this.loadBeneficiaries();
                    this.displayDialog = false;
                    this.clearBeneficiaryForm();
                },
                error: (error) => {
                    console.error('Error updating beneficiary:', error);
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: 'Failed to update beneficiary' 
                    });
                }
            });
        } else {
            this.beneficiaryService.beneficiary_CreateBeneficiary(this.currentBeneficiary).subscribe({
                next: (createdBeneficiary) => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Beneficiary added successfully' 
                    });
                    
                    // Reload beneficiaries
                    this.loadBeneficiaries();
                    
                    // Close dialog and clear form to allow adding another beneficiary
                    this.displayDialog = false;
                    this.clearBeneficiaryForm();
                },
                error: (error) => {
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
            this.beneficiaryService.beneficiary_DeleteBeneficiary(id).subscribe({
                next: () => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Beneficiary deleted successfully' 
                    });
                    this.loadBeneficiaries();
                },
                error: (error) => {
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
            ? this.fileUploadService.file_GetFilesByMemberId(this.memberId)
            : this.fileUploadService.file_GetMyFiles();
        
        filesObservable.subscribe({
            next: (files) => {
                // Filter files for this beneficiary
                const beneficiaryFiles = files.filter(f => 
                    f.entityType === 'Beneficiary' && f.entityId === beneficiaryId
                );
                this.uploadedDocuments.set(beneficiaryFiles);
            },
            error: (error) => {
                console.error('Error loading beneficiary documents:', error);
            }
        });
    }

    onFileSelect(event: any) {
        // Handle both PrimeNG fileUpload (event.files) and native input (event.target.files)
        const files = event.files || (event.target && event.target.files);
        if (files && files.length > 0) {
            this.selectedFile = files[0];
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

        const fileParameter = {
            data: this.selectedFile,
            fileName: this.selectedFile.name
        };

        this.fileUploadService.file_UploadFile(
            "Beneficiary",  // entityType
            this.currentBeneficiaryId()!,  // entityId (beneficiary ID)
            undefined,  // documentType (legacy)
            this.selectedDocumentType,  // memberDocumentType
            false,  // isRequired flag (typically optional for beneficiaries)
            fileParameter
        ).subscribe({
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
            error: (error) => {
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
            this.fileUploadService.file_DeleteFile(fileId).subscribe({
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
                error: (error) => {
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
    
    /**the beneficiary entry form (after individual save)
     */
    clearBeneficiaryForm() {
        console.log('[BeneficiariesStep] Clearing beneficiary entry form...');
        
        // Reset current beneficiary
        this.currentBeneficiary = {} as BeneficiaryDto;
        this.currentBeneficiaryId.set(undefined);
        this.editMode.set(false);
        
        // Clear SA ID validation
        this.idInfo.set(null);
        this.parsedDateOfBirth.set(null);
        this.parsedGender.set(null);
        
        // Reset form - no form group in this component, using ngModel
        // Clear file upload states
        this.uploading.set(false);
        this.selectedFile = undefined;
        this.selectedDocumentType = undefined;
        
        console.log('[BeneficiariesStep] Beneficiary entry form cleared');
    }
    
    /**
     * Clear all form data after successful onboarding completion
     */
    clearForm() {
        console.log('[BeneficiariesStep] Clearing all form data...');
        
        // Clear beneficiaries array
        this.beneficiaries.set([]);
        
        // Clear the entry form
        this.clearBeneficiaryForm();
        
        // Clear dialogs and states
        this.displayDialog = false;
        
        console.log('[BeneficiariesStep] All form data cleared successfully');
    }
}
