import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DependentsService } from '../../core/services/generated/dependents/dependents.service';
import { DependentDto, DependentType } from '../../core/models';
import { IdentityVerificationFormComponent } from '../../shared/components/identity-verification/identity-verification-form.component';
import { VerificationStatusComponent } from '../../shared/components/verification-status/verification-status.component';

@Component({
    selector: 'app-dependents',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        ToastModule,
        ConfirmDialogModule,
        ToolbarModule,
        TagModule,
        IconFieldModule,
        InputIconModule,
        DropdownModule,
        CalendarModule,
        IdentityVerificationFormComponent,
        VerificationStatusComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './dependents.component.html'
})
export class DependentsComponent implements OnInit, OnChanges {
    @Input() memberId!: string;
    dependents: DependentDto[] = [];
    selectedDependents: DependentDto[] = [];
    dependent: DependentDto = {} as DependentDto;
    dependentDialog: boolean = false;
    verificationDialog: boolean = false;
    submitted: boolean = false;
    cols: any[] = [];
    maxDate: Date = new Date(); // Phase 3: Maximum date for date picker

    // Phase 3: Dependent Classification dropdown options
    dependentTypeOptions = [
        { label: 'Spouse', value: 1 },
        { label: 'Child', value: 2 },
        { label: 'Extended Family', value: 3 }
    ];

    constructor(
        private dependentService: DependentsService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadDependents();

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'email', header: 'Email' },
            { field: 'identificationNumber', header: 'ID Number' },
            { field: 'dependentType', header: 'Type' }
        ];
    }

    ngOnChanges(changes: SimpleChanges) {
        // Reload dependents when memberId changes
        if (changes['memberId'] && !changes['memberId'].firstChange) {
            this.loadDependents();
        }
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    loadDependents() {
        if (this.memberId) {
            this.dependentService.getApiDependentDependentGetAllDependents().subscribe((result) => {
                this.dependents = result;
            });
        }
    }

    openNew() {
        this.dependent = {} as DependentDto; // Reset for new entry
        this.submitted = false;
        this.dependentDialog = true;
    }

    deleteSelectedDependents() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected dependents?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedDependents.map((d) => d.id);
                ids.forEach((id) => {
                    this.dependentService.deleteApiDependentDependentDeleteDependentId(id).subscribe(() => {
                        this.dependents = this.dependents.filter((val) => val.id !== id);
                    });
                });
                this.selectedDependents = [];
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Dependents Deleted', life: 3000 });
            }
        });
    }

    editDependent(dependent: DependentDto) {
        this.dependent = { ...dependent };
        this.dependentDialog = true;
    }

    deleteDependent(dependent: DependentDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + dependent['name'] + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.dependentService.deleteApiDependentDependentDeleteDependentId(dependent.id).subscribe(() => {
                    this.dependents = this.dependents.filter((val) => val.id !== dependent.id);
                    this.dependent = {} as DependentDto;
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Dependent Deleted', life: 3000 });
                });
            }
        });
    }

    hideDialog() {
        this.dependentDialog = false;
        this.submitted = false;
    }

    saveDependent() {
        this.submitted = true;

        if (this.dependent['name']?.trim()) {
            if (this.dependent.id) {
                this.dependentService.putApiDependentDependentUpdateDependent(this.dependent).subscribe({
                    next: (result) => {
                        this.dependents[this.findIndexById(this.dependent.id)] = result;
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Dependent Updated', life: 3000 });
                        this.dependents = [...this.dependents];
                        this.dependentDialog = false;
                        this.dependent = {} as DependentDto;
                    },
                    error: (error: any) => {
                        console.error('Error updating dependent:', error);
                        const errorMessage = error?.result?.message || error?.message || 'Failed to update dependent';
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
                    }
                });
            } else {
                this.dependentService.postApiDependentDependentCreateDependent(this.dependent).subscribe({
                    next: (success) => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Dependent Created', life: 3000 });
                        this.loadDependents();
                        this.dependentDialog = false;

                        // Prompt for identity verification for new dependents
                        if (success && this.dependent.identificationNumber) {
                            const dependentForVerification = { ...this.dependent };
                            setTimeout(() => {
                                this.dependent = dependentForVerification;
                                this.openVerificationDialog();
                            }, 500);
                        } else {
                            this.dependent = {} as DependentDto;
                        }
                    },
                    error: (error: any) => {
                        console.error('Error creating dependent:', error);
                        const errorMessage = error?.result?.message || error?.message || 'Failed to create dependent';
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
                    }
                });
            }
        }
    }

    verifyDependentIdentity(dependent: DependentDto) {
        this.dependent = { ...dependent };
        this.openVerificationDialog();
    }

    openVerificationDialog() {
        this.verificationDialog = true;
    }

    closeVerificationDialog() {
        this.verificationDialog = false;
        this.dependent = {} as DependentDto;
    }

    onVerificationComplete(result: any) {
        if (result.success) {
            this.messageService.add({
                severity: 'success',
                summary: 'Identity Verified',
                detail: 'Dependent identity has been successfully verified'
            });
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Verification Failed',
                detail: result.error || 'Identity verification was not successful'
            });
        }
        this.closeVerificationDialog();
    }

    onVerificationStarted() {
        this.messageService.add({
            severity: 'info',
            summary: 'Verification Started',
            detail: 'Processing identity verification request...'
        });
    }

    findIndexById(id: string): number {
        let index = -1;
        for (let i = 0; i < this.dependents.length; i++) {
            if (this.dependents[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    }

    // Phase 3: Get dependent type label for display
    getDependentTypeLabel(type: string | DependentType | undefined): string {
        if (!type) return 'Not Specified';
        const numType = typeof type === 'string' ? parseInt(type) : type;
        const option = this.dependentTypeOptions.find(opt => opt.value === numType);
        return option ? option.label : 'Not Specified';
    }

    // Phase 3: Get age limit warning message based on selected type
    getAgeLimitWarning(type: string | DependentType | undefined): string {
        if (!type) return '';
        const numType = typeof type === 'string' ? parseInt(type) : type;
        if (numType === 1 || numType === 2) {
            return 'Maximum age: 74 years';
        } else if (numType === 3) {
            return 'Maximum age: 84 years';
        }
        return '';
    }

    // Phase 3: Get extended family count for the current member
    getExtendedFamilyCount(): number {
        return this.dependents.filter(d => d.dependentType === '3' || d.dependentType === 3 as any).length;
    }

    // Check if dependent is extended family
    isExtendedFamily(dependent: DependentDto): boolean {
        return dependent.dependentType === '3' || dependent.dependentType === 3 as any;
    }

    // Calculate age from date of birth
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
