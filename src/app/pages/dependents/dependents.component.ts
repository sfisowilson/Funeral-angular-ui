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
import { DependentDto, DependentServiceProxy, DependentType } from '../../core/services/service-proxies';
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
    providers: [MessageService, ConfirmationService, DependentServiceProxy],
    templateUrl: './dependents.component.html'
})
export class DependentsComponent implements OnInit, OnChanges {
    @Input() memberId!: string;
    dependents: DependentDto[] = [];
    selectedDependents: DependentDto[] = [];
    dependent: DependentDto = new DependentDto();
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
        private dependentService: DependentServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadDependents();

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'email', header: 'Email' },
            { field: 'identificationNumber', header: 'ID Number' },
            { field: 'dependentType', header: 'Type' },
            { field: 'calculatedAge', header: 'Age' }
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
            this.dependentService.dependent_GetAllDependents(this.memberId, undefined, undefined, undefined, undefined).subscribe((result) => {
                this.dependents = result;
            });
        }
    }

    openNew() {
        this.dependent = new DependentDto(); // Reset for new entry
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
                    this.dependentService.dependent_DeleteDependent(id).subscribe(() => {
                        this.dependents = this.dependents.filter((val) => val.id !== id);
                    });
                });
                this.selectedDependents = [];
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Dependents Deleted', life: 3000 });
            }
        });
    }

    editDependent(dependent: DependentDto) {
        this.dependent = new DependentDto(dependent);
        this.dependentDialog = true;
    }

    deleteDependent(dependent: DependentDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + dependent.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.dependentService.dependent_DeleteDependent(dependent.id).subscribe(() => {
                    this.dependents = this.dependents.filter((val) => val.id !== dependent.id);
                    this.dependent = new DependentDto();
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

        if (this.dependent.name?.trim()) {
            if (this.dependent.id) {
                this.dependentService.dependent_UpdateDependent(this.dependent).subscribe({
                    next: (result) => {
                        this.dependents[this.findIndexById(this.dependent.id)] = result;
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Dependent Updated', life: 3000 });
                        this.dependents = [...this.dependents];
                        this.dependentDialog = false;
                        this.dependent = new DependentDto();
                    },
                    error: (error) => {
                        console.error('Error updating dependent:', error);
                        const errorMessage = error?.result?.message || error?.message || 'Failed to update dependent';
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
                    }
                });
            } else {
                this.dependentService.dependent_CreateDependent(this.dependent).subscribe({
                    next: (success) => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Dependent Created', life: 3000 });
                        this.loadDependents();
                        this.dependentDialog = false;

                        // Prompt for identity verification for new dependents
                        if (success && this.dependent.identificationNumber) {
                            const dependentForVerification = new DependentDto(this.dependent);
                            setTimeout(() => {
                                this.dependent = dependentForVerification;
                                this.openVerificationDialog();
                            }, 500);
                        } else {
                            this.dependent = new DependentDto();
                        }
                    },
                    error: (error) => {
                        console.error('Error creating dependent:', error);
                        const errorMessage = error?.result?.message || error?.message || 'Failed to create dependent';
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMessage, life: 5000 });
                    }
                });
            }
        }
    }

    verifyDependentIdentity(dependent: DependentDto) {
        this.dependent = new DependentDto(dependent);
        this.openVerificationDialog();
    }

    openVerificationDialog() {
        this.verificationDialog = true;
    }

    closeVerificationDialog() {
        this.verificationDialog = false;
        this.dependent = new DependentDto();
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
    getDependentTypeLabel(type: DependentType | undefined): string {
        if (!type) return 'Not Specified';
        const option = this.dependentTypeOptions.find(opt => opt.value === type);
        return option ? option.label : 'Not Specified';
    }

    // Phase 3: Get age limit warning message based on selected type
    getAgeLimitWarning(type: DependentType | undefined): string {
        if (!type) return '';
        if (type === 1 || type === 2) {
            return 'Maximum age: 74 years';
        } else if (type === 3) {
            return 'Maximum age: 84 years';
        }
        return '';
    }

    // Phase 3: Get extended family count for the current member
    getExtendedFamilyCount(): number {
        return this.dependents.filter(d => d.dependentType === 3).length;
    }
}
