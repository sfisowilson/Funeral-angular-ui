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
import { MessageService, ConfirmationService } from 'primeng/api';
import { BeneficiaryDto, BeneficiaryServiceProxy } from '../../core/services/service-proxies';
import { IdentityVerificationFormComponent } from '../../shared/components/identity-verification/identity-verification-form.component';
import { VerificationStatusComponent } from '../../shared/components/verification-status/verification-status.component';

@Component({
    selector: 'app-beneficiaries',
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
        IdentityVerificationFormComponent,
        VerificationStatusComponent
    ],
    providers: [MessageService, ConfirmationService, BeneficiaryServiceProxy],
    templateUrl: './beneficiaries.component.html'
})
export class BeneficiariesComponent implements OnInit, OnChanges {
    @Input() memberId!: string;
    beneficiaries: BeneficiaryDto[] = [];
    selectedBeneficiaries: BeneficiaryDto[] = [];
    beneficiary: BeneficiaryDto = new BeneficiaryDto();
    beneficiaryDialog: boolean = false;
    verificationDialog: boolean = false;
    submitted: boolean = false;
    cols: any[] = [];

    constructor(
        private beneficiaryService: BeneficiaryServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadBeneficiaries();

        this.cols = [
            { field: 'name', header: 'Name' },
            { field: 'email', header: 'Email' },
            { field: 'identificationNumber', header: 'ID Number' }
        ];
    }

    ngOnChanges(changes: SimpleChanges) {
        // Reload beneficiaries when memberId changes
        if (changes['memberId'] && !changes['memberId'].firstChange) {
            this.loadBeneficiaries();
        }
    }

    loadBeneficiaries() {
        if (this.memberId) {
            this.beneficiaryService.beneficiary_GetAllBeneficiaries(this.memberId, undefined, undefined, undefined, undefined).subscribe((result) => {
                this.beneficiaries = result;
            });
        }
    }

    onGlobalFilter(table: any, event: Event) {
        table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
    }

    openNew() {
        this.beneficiary = new BeneficiaryDto();
        this.submitted = false;
        this.beneficiaryDialog = true;
    }

    deleteSelectedBeneficiaries() {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete the selected beneficiaries?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                const ids = this.selectedBeneficiaries.map((b) => b.id);
                ids.forEach((id) => {
                    this.beneficiaryService.beneficiary_DeleteBeneficiary(id).subscribe(() => {
                        this.beneficiaries = this.beneficiaries.filter((val) => val.id !== id);
                    });
                });
                this.selectedBeneficiaries = [];
                this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Beneficiaries Deleted', life: 3000 });
            }
        });
    }

    editBeneficiary(beneficiary: BeneficiaryDto) {
        this.beneficiary = new BeneficiaryDto(beneficiary);
        this.beneficiaryDialog = true;
    }

    deleteBeneficiary(beneficiary: BeneficiaryDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + beneficiary.name + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.beneficiaryService.beneficiary_DeleteBeneficiary(beneficiary.id).subscribe(() => {
                    this.beneficiaries = this.beneficiaries.filter((val) => val.id !== beneficiary.id);
                    this.beneficiary = new BeneficiaryDto();
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Beneficiary Deleted', life: 3000 });
                });
            }
        });
    }

    hideDialog() {
        this.beneficiaryDialog = false;
        this.submitted = false;
    }

    saveBeneficiary() {
        this.submitted = true;

        if (this.beneficiary.name?.trim()) {
            if (this.beneficiary.id) {
                this.beneficiaryService.beneficiary_UpdateBeneficiary(this.beneficiary).subscribe((result) => {
                    this.beneficiaries[this.findIndexById(this.beneficiary.id)] = result;
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Beneficiary Updated', life: 3000 });
                    this.beneficiaries = [...this.beneficiaries];
                    this.beneficiaryDialog = false;
                    this.beneficiary = new BeneficiaryDto();
                });
            } else {
                // This is incorrect, but will be fixed later
                this.beneficiaryService.beneficiary_CreateBeneficiary(this.beneficiary).subscribe((success) => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Beneficiary Created', life: 3000 });
                    this.loadBeneficiaries();
                    this.beneficiaryDialog = false;

                    // Prompt for identity verification for new beneficiaries
                    if (success && this.beneficiary.identificationNumber) {
                        const beneficiaryForVerification = new BeneficiaryDto(this.beneficiary);
                        setTimeout(() => {
                            this.beneficiary = beneficiaryForVerification;
                            this.openVerificationDialog();
                        }, 500);
                    } else {
                        this.beneficiary = new BeneficiaryDto();
                    }
                });
            }
        }
    }

    verifyBeneficiaryIdentity(beneficiary: BeneficiaryDto) {
        this.beneficiary = new BeneficiaryDto(beneficiary);
        this.openVerificationDialog();
    }

    openVerificationDialog() {
        this.verificationDialog = true;
    }

    closeVerificationDialog() {
        this.verificationDialog = false;
        this.beneficiary = new BeneficiaryDto();
    }

    onVerificationComplete(result: any) {
        if (result.success) {
            this.messageService.add({
                severity: 'success',
                summary: 'Identity Verified',
                detail: 'Beneficiary identity has been successfully verified'
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
        for (let i = 0; i < this.beneficiaries.length; i++) {
            if (this.beneficiaries[i].id === id) {
                index = i;
                break;
            }
        }
        return index;
    }
}
