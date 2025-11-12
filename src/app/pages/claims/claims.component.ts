import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ClaimServiceProxy, ClaimDto, CreateClaimDto, MemberServiceProxy, PolicyServiceProxy } from '../../core/services/service-proxies';
import { WorkflowHistoryComponent } from '../../shared/components/workflow-history/workflow-history.component';

@Component({
    selector: 'app-claims',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        TableModule,
        DialogModule,
        InputTextModule,
        DropdownModule,
        CalendarModule,
        InputNumberModule,
        InputTextarea,
        ToastModule,
        ConfirmDialogModule,
        TagModule,
        TooltipModule,
        WorkflowHistoryComponent
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './claims.component.html',
    styleUrl: './claims.component.scss'
})
export class ClaimsComponent implements OnInit {
    claims = signal<ClaimDto[]>([]);
    members = signal<any[]>([]);
    policies = signal<any[]>([]);
    loading = signal(false);

    claimDialog = signal(false);
    submitted = signal(false);
    historyDialogVisible = false;
    selectedClaimId: string | number | null = null;

    claim: Partial<ClaimDto> = {};

    statuses = [
        { label: 'Pending', value: 'Pending' },
        { label: 'In Review', value: 'InReview' },
        { label: 'Documents Required', value: 'DocumentsRequired' },
        { label: 'Approved', value: 'Approved' },
        { label: 'Rejected', value: 'Rejected' },
        { label: 'Paid', value: 'Paid' }
    ];

    constructor(
        private claimService: ClaimServiceProxy,
        private memberService: MemberServiceProxy,
        private policyService: PolicyServiceProxy,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit() {
        this.loadClaims();
        this.loadMembers();
        this.loadPolicies();
    }

    loadClaims() {
        this.loading.set(true);
        this.claimService.claim_GetAllClaims(undefined, undefined, undefined, undefined, undefined).subscribe({
            next: (data) => {
                this.claims.set(data);
                this.loading.set(false);
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load claims' });
                this.loading.set(false);
            }
        });
    }

    loadMembers() {
        this.memberService.member_GetAllMembers(undefined, undefined, undefined, undefined, undefined).subscribe({
            next: (data) => this.members.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load members' })
        });
    }

    loadPolicies() {
        this.policyService.policy_GetAllPolicies(undefined, undefined, undefined, undefined, undefined).subscribe({
            next: (data) => this.policies.set(data),
            error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load policies' })
        });
    }

    openNew() {
        this.claim = { status: 'Pending' };
        this.submitted.set(false);
        this.claimDialog.set(true);
    }

    editClaim(claim: ClaimDto) {
        this.claim = { ...claim };
        this.claimDialog.set(true);
    }

    deleteClaim(claim: ClaimDto) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete this claim?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.claimService.claim_DeleteClaim(claim.id!).subscribe({
                    next: () => {
                        this.loadClaims();
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Claim Deleted' });
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete claim' })
                });
            }
        });
    }

    saveClaim() {
        this.submitted.set(true);

        if (this.claim.memberId && this.claim.policyId && this.claim.claimAmount) {
            const claimDto = new CreateClaimDto();
            claimDto.memberId = this.claim.memberId;
            claimDto.policyId = this.claim.policyId;
            claimDto.requestedAmount = this.claim.claimAmount;
            claimDto.description = this.claim.description;
            claimDto.dateOfDeath = DateTime.now(); // Add required field
            claimDto.beneficiaryId = this.claim.memberId; // Use memberId as beneficiary for now
            claimDto.hasDeathCertificate = false;
            claimDto.hasIdentityDocuments = false;
            claimDto.hasMedicalReports = false;
            claimDto.requiresPoliceReport = false;

            this.claimService.claim_CreateClaim(claimDto).subscribe({
                next: () => {
                    this.loadClaims();
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Claim Created' });
                    this.claimDialog.set(false);
                },
                error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create claim' })
            });
        }
    }

    hideDialog() {
        this.claimDialog.set(false);
        this.submitted.set(false);
    }

    getSeverity(status: string): string {
        switch (status) {
            case 'Approved':
                return 'success';
            case 'Rejected':
                return 'danger';
            case 'Paid':
                return 'info';
            case 'InReview':
                return 'warning';
            case 'DocumentsRequired':
                return 'warning';
            default:
                return 'secondary';
        }
    }

    getMemberName(memberId: number): string {
        const member = this.members().find((m) => m.id === memberId);
        return member ? `${member.firstName} ${member.lastName}` : 'Unknown Member';
    }

    getPolicyName(policyId: number): string {
        const policy = this.policies().find((p) => p.id === policyId);
        return policy ? policy.name : 'Unknown Policy';
    }

    get claimDialogVisible() {
        return this.claimDialog();
    }

    set claimDialogVisible(value: boolean) {
        this.claimDialog.set(value);
    }

    viewHistory(claim: ClaimDto) {
        this.selectedClaimId = claim.id || null;
        this.historyDialogVisible = true;
    }

    hideHistoryDialog() {
        this.historyDialogVisible = false;
        this.selectedClaimId = null;
    }
}
