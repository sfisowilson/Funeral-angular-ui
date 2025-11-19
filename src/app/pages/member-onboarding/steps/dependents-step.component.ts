import { Component, OnInit, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CalendarModule } from 'primeng/calendar';
import { InputMaskModule } from 'primeng/inputmask';
import { FileUploadModule } from 'primeng/fileupload';
import { DropdownModule } from 'primeng/dropdown';
import { TabViewModule } from 'primeng/tabview';
import { DependentsService } from '../../../core/services/generated/dependents/dependents.service';
import { MemberProfileCompletionService } from '../../../core/services/generated/member-profile-completion/member-profile-completion.service';
import { FileUploadsService } from '../../../core/services/generated/file-uploads/file-uploads.service';
import { DocumentRequirementsService } from '../../../core/services/generated/document-requirements/document-requirements.service';
import {
    DependentDto,
    PostApiMemberProfileCompletionProfileCompletionUpdateStepBody,
    DocumentRequirement,
    MemberDocumentType,
    FileMetadataDto
} from '../../../core/models';
import { SAIdValidator, SAIdInfo } from '../../../shared/utils/sa-id-validator';
import { AuthService } from '../../../auth/auth-service';

@Component({
    selector: 'app-dependents-step',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
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
    templateUrl: './dependents-step.component.html',
    styleUrl: './dependents-step.component.scss'
})
export class DependentsStepComponent implements OnInit {
    @Input() viewMode: boolean = false;
    @Input() memberId?: string;
    @Input() coverAmount: number = 10000; // Policy cover amount from parent
    @Output() stepComplete = new EventEmitter<void>();

    dependents = signal<DependentDto[]>([]);
    displayDialog = false;
    editMode = signal(false);
    currentDependent: DependentDto = {} as DependentDto;
    loading = signal(false);
    private stepCompleteSubject = new Subject<void>();
    
    // SA ID validation
    idInfo = signal<SAIdInfo | null>(null);
    parsedDateOfBirth = signal<Date | null>(null);
    parsedGender = signal<string | null>(null);

    // Document upload functionality
    requiredDocuments = signal<DocumentRequirement[]>([]);
    uploadedDocuments = signal<FileMetadataDto[]>([]);
    uploading = signal(false);
    currentDependentId = signal<string | undefined>(undefined);
    selectedDocumentType: MemberDocumentType | undefined = undefined;
    selectedFile: File | undefined = undefined;

    documentTypes = [
        { label: 'Birth Certificate', value: MemberDocumentType.BirthCertificate, icon: 'pi-user', description: 'Required for dependent verification' },
        { label: 'ID Document / Passport', value: MemberDocumentType.IdentificationDocument, icon: 'pi-id-card', description: 'South African ID or Passport' },
        { label: 'Marriage Certificate', value: MemberDocumentType.MarriageCertificate, icon: 'pi-heart', description: 'Required for spouse dependent' },
        { label: 'Other Document', value: MemberDocumentType.Other, icon: 'pi-file', description: 'Any other supporting document' }
    ];

    constructor(
        private dependentService: DependentsService,
        private profileService: MemberProfileCompletionService,
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
        this.loadDependents();
    }

    loadDependents() {
        console.log('[DependentsStep] Loading dependents...');
        this.loading.set(true);
        
        // Use appropriate method based on whether viewing own or another member's dependents
        const dependentsObservable = this.memberId
            ? this.dependentService.getApiDependentDependentGetDependentsByMemberIdMemberId(this.memberId)
            : this.dependentService.getApiDependentDependentGetMyDependents();
        
        dependentsObservable.subscribe({
            next: (data: any) => {
                console.log('[DependentsStep] Loaded dependents:', data);
                this.dependents.set(data);
                this.checkCompletion();
                this.loading.set(false);
            },
            error: (error: any) => {
                console.error('Error loading dependents:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to load dependents'
                });
                this.loading.set(false);
            }
        });
    }

    showAddDialog() {
        this.editMode.set(false);
        this.currentDependent = {
            id: undefined,
            memberId: undefined, // Will be set by backend from JWT
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
        this.currentDependentId.set(undefined);
        this.uploadedDocuments.set([]);
        this.selectedDocumentType = undefined;
        this.selectedFile = undefined;
        this.displayDialog = true;
    }

    editDependent(dependent: DependentDto) {
        this.editMode.set(true);
        // Create new instance to avoid reference issues
        this.currentDependent = {
            id: dependent.id,
            memberId: dependent.memberId,
            name: dependent.name,
            email: dependent.email,
            address: dependent.address,
            phone1: dependent.phone1,
            phone2: dependent.phone2,
            identificationNumber: dependent.identificationNumber,
            // Phase 3: Include dependent classification fields
            dependentType: dependent.dependentType,
            dateOfBirth: dependent.dateOfBirth,
            calculatedAge: this.getCalculatedAge(dependent)
        } as any;
        
        // Validate ID if present
        if (dependent.identificationNumber) {
            this.validateIdNumber(dependent.identificationNumber);
        }
        
        // Load documents for this dependent
        this.currentDependentId.set(dependent.id);
        if (dependent.id) {
            this.loadDependentDocuments(dependent.id);
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
        this.validateIdNumber(this.currentDependent.identificationNumber);
    }

    saveDependent() {
        if (!this.currentDependent.name || !this.currentDependent.identificationNumber) {
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
            this.dependentService.putApiDependentDependentUpdateDependent(this.currentDependent).subscribe({
                next: () => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Dependent updated successfully' 
                    });
                    this.loadDependents();
                    this.displayDialog = false;
                },
                error: (error: any) => {
                    console.error('Error updating dependent:', error);
                    // Extract error message from API response
                    const errorMessage = error?.result?.message || error?.message || 'Failed to update dependent';
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: errorMessage 
                    });
                }
            });
        } else {
            console.log('[DependentsStep] Creating new dependent:', this.currentDependent);
            this.dependentService.postApiDependentDependentCreateDependent(this.currentDependent).subscribe({
                next: (createdDependent) => {
                    console.log('[DependentsStep] Dependent created successfully:', createdDependent);
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Dependent added successfully' 
                    });
                    
                    // Set the current dependent ID so user can upload documents
                    this.currentDependentId.set(createdDependent.id);
                    this.currentDependent = createdDependent;
                    this.editMode.set(true); // Switch to edit mode
                    
                    // Reload dependents - this will call checkCompletion automatically
                    console.log('[DependentsStep] Reloading dependents after creation...');
                    this.loadDependents();
                },
                error: (error: any) => {
                    console.error('Error adding dependent:', error);
                    // Extract error message from API response
                    const errorMessage = error?.result?.message || error?.message || 'Failed to add dependent';
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: errorMessage 
                    });
                }
            });
        }
    }

    deleteDependent(id: string) {
        if (confirm('Are you sure you want to delete this dependent?')) {
            this.dependentService.deleteApiDependentDependentDeleteDependentId(id).subscribe({
                next: () => {
                    this.messageService.add({ 
                        severity: 'success', 
                        summary: 'Success', 
                        detail: 'Dependent deleted successfully' 
                    });
                    this.loadDependents();
                },
                error: (error: any) => {
                    console.error('Error deleting dependent:', error);
                    // Extract error message from API response
                    const errorMessage = error?.result?.message || error?.message || 'Failed to delete dependent';
                    this.messageService.add({ 
                        severity: 'error', 
                        summary: 'Error', 
                        detail: errorMessage 
                    });
                }
            });
        }
    }

    checkCompletion() {
        const hasAtLeastOne = this.dependents().length > 0;
        console.log('[DependentsStep] CheckCompletion - hasAtLeastOne:', hasAtLeastOne, 'dependents count:', this.dependents().length);
        if (hasAtLeastOne) {
            console.log('[DependentsStep] Emitting stepComplete event (debounced)');
            // Use subject to debounce the emission
            this.stepCompleteSubject.next();
        }
    }

    // Document upload methods
    loadDependentDocuments(dependentId: string) {
        // For now, load all files and filter by dependent ID
        // In production, you'd have a dedicated endpoint
        const memberId = this.authService.getUserId();
        if (!memberId) return;

        const filesObservable = this.memberId
            ? this.fileUploadService.getApiFileUploadFileGetFilesByMemberIdMemberId<FileMetadataDto[]>(this.memberId)
            : this.fileUploadService.getApiFileUploadFileGetMyFiles<FileMetadataDto[]>();
        
        filesObservable.subscribe({
            next: (files:any) => {
                // Filter files for this dependent
                const dependentFiles = files.filter((f: any) => 
                    f.entityType === 'Dependent' && f.entityId === dependentId
                );
                this.uploadedDocuments.set(dependentFiles);
            },
            error: (error: any) => {
                console.error('Error loading dependent documents:', error);
            }
        });
    }

    onFileSelect(event: any) {
        if (event.files && event.files.length > 0) {
            this.selectedFile = event.files[0];
        }
    }

    uploadDependentDocument() {
        if (!this.selectedFile || !this.selectedDocumentType) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Validation Error',
                detail: 'Please select a document type and file'
            });
            return;
        }

        if (!this.currentDependentId()) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Please save the dependent before uploading documents'
            });
            return;
        }

        this.uploading.set(true);

        const fileParameter = {
            data: this.selectedFile,
            fileName: this.selectedFile.name
        };

        // Determine if this document type is required
        const requirement = this.requiredDocuments().find((r:any) => r.documentType === this.selectedDocumentType);
        const isRequired = requirement?.isRequired || false;

        this.fileUploadService.postApiFileUploadFileUploadFile({
            file: this.selectedFile!,
            entityType: "Dependent",
            entityId: this.currentDependentId()!,
            documentType: this.selectedDocumentType?.toString(),
            isRequired: isRequired
        }).subscribe({
            next: (result: any) => {
                this.uploading.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Document uploaded successfully'
                });
                // Reload documents
                this.loadDependentDocuments(this.currentDependentId()!);
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

    /**
     * Calculate the premium impact of adding this dependent based on their age
     * Returns the incremental premium amount for the dependent
     */
    getPremiumImpact(dependent: DependentDto): number | null {
        const age = this.getCalculatedAge(dependent);
        if (!age && age !== 0) {
            return null;
        }

        // Calculate base premium for current dependents list
        const allDependents = this.dependents();
        const totalDependents = allDependents.length;
        
        // If totalDependents is 0, this is the first dependent
        if (totalDependents === 0) {
            return null; // Can't calculate without knowing the full context
        }

        // Find the max age among all dependents (this will determine the premium bracket)
        const maxAge = Math.max(...allDependents.map(d => this.getCalculatedAge(d) || 0));;
        
        // Calculate premium for all dependents vs without this dependent
        const premiumWithDependent = this.calculatePremiumForDependents(totalDependents, maxAge, this.coverAmount);
        
        // Calculate what premium would be without this dependent
        const dependentsWithout = allDependents.filter(d => d.id !== dependent.id);
        const maxAgeWithout = dependentsWithout.length > 0 
            ? Math.max(...dependentsWithout.map(d => this.getCalculatedAge(d) || 0))
            : 0;
        const premiumWithoutDependent = this.calculatePremiumForDependents(
            Math.max(0, totalDependents - 1), 
            maxAgeWithout, 
            this.coverAmount
        );

        return premiumWithDependent - premiumWithoutDependent;
    }

    /**
     * Calculate premium based on dependent count, max age, and cover amount
     * This mirrors the backend PremiumCalculationService logic
     */
    private calculatePremiumForDependents(dependentCount: number, maxAge: number, coverAmount: number): number {
        // Premium table structure (matches backend default values)
        const premiumTable: Record<number, { under65: number; under70: number; under75: number; age75Plus: number }> = {
            5000: { under65: 120, under70: 135, under75: 160, age75Plus: 200 },
            10000: { under65: 220, under70: 250, under75: 290, age75Plus: 585 },
            15000: { under65: 320, under70: 360, under75: 410, age75Plus: 820 },
            20000: { under65: 420, under70: 470, under75: 530, age75Plus: 1060 },
            25000: { under65: 520, under70: 580, under75: 650, age75Plus: 1300 }
        };

        const rates = premiumTable[coverAmount];
        if (!rates) {
            return 0; // Unknown cover amount
        }

        // If no dependents, return 0
        if (dependentCount === 0) {
            return 0;
        }

        // For 1-5 dependents, use age-based premium
        if (dependentCount >= 1 && dependentCount <= 5) {
            if (maxAge < 65) {
                return rates.under65;
            } else if (maxAge < 70) {
                return rates.under70;
            } else if (maxAge < 75) {
                return rates.under75;
            } else {
                return rates.age75Plus;
            }
        }

        // For more than 5 dependents, use base rate (under 65)
        return rates.under65;
    }

    getDocumentTypeLabel(value: MemberDocumentType | number): string {
        const type = this.documentTypes.find(t => t.value === value);
        return type?.label || `Document Type ${value}`;
    }

    deleteDependentDocument(fileId: string) {
        if (confirm('Are you sure you want to delete this document?')) {
            this.fileUploadService.deleteApiFileUploadFileDeleteFileFileId(fileId).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Success',
                        detail: 'Document deleted successfully'
                    });
                    if (this.currentDependentId()) {
                        this.loadDependentDocuments(this.currentDependentId()!);
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

    getCalculatedAge(dependent: DependentDto): number | null {
        if (!dependent.dateOfBirth) return null;
        const dob = new Date(dependent.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }
        return age;
    }
}
