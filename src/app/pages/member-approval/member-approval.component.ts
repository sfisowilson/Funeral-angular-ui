import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
    MemberApprovalServiceProxy,
    PendingMemberDto,
    MemberApprovalDetailDto,
    ApproveMemberRequest,
    RejectMemberRequest,
    RequestMemberUpdatesRequest
} from '../../core/services/service-proxies';

@Component({
    selector: 'app-member-approval',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [MemberApprovalServiceProxy],
    templateUrl: './member-approval.component.html',
    styleUrl: './member-approval.component.scss'
})
export class MemberApprovalComponent implements OnInit {
    pendingMembers = signal<PendingMemberDto[]>([]);
    stats = signal<any>(null);
    selectedMember = signal<MemberApprovalDetailDto | null>(null);
    loading = signal(false);
    showDetailModal = signal(false);
    showApproveModal = signal(false);
    showRejectModal = signal(false);
    showRequestUpdatesModal = signal(false);
    
    approvalNotes = '';
    rejectionReason = '';
    updateRequestMessage = '';
    updateRequestFields: string[] = [];
    
    alert = signal<{ type: 'success' | 'danger' | 'warning'; message: string } | null>(null);

    constructor(private memberApprovalService: MemberApprovalServiceProxy) {}

    ngOnInit() {
        this.loadPendingMembers();
        this.loadStats();
    }

    loadPendingMembers() {
        this.loading.set(true);
        this.memberApprovalService.memberApproval_GetPendingMembers().subscribe({
            next: (members) => {
                this.pendingMembers.set(members);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading pending members:', error);
                this.showAlert('danger', 'Failed to load pending members');
                this.loading.set(false);
            }
        });
    }

    loadStats() {
        // Stats endpoint returns void, commenting out for now
        // TODO: Update backend to return stats DTO
        this.stats.set({ totalPending: 0, approvedToday: 0, rejectedToday: 0, waitingMoreThan7Days: 0 });
    }

    viewMemberDetails(id: string) {
        this.loading.set(true);
        this.memberApprovalService.memberApproval_GetMemberDetail(id).subscribe({
            next: (details) => {
                this.selectedMember.set(details);
                this.showDetailModal.set(true);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading member details:', error);
                this.showAlert('danger', 'Failed to load member details');
                this.loading.set(false);
            }
        });
    }

    openApproveModal() {
        this.approvalNotes = '';
        this.showDetailModal.set(false);
        this.showApproveModal.set(true);
    }

    openRejectModal() {
        this.rejectionReason = '';
        this.showDetailModal.set(false);
        this.showRejectModal.set(true);
    }

    openRequestUpdatesModal() {
        this.updateRequestMessage = '';
        this.updateRequestFields = [];
        this.showDetailModal.set(false);
        this.showRequestUpdatesModal.set(true);
    }

    approveMember() {
        const member = this.selectedMember();
        if (!member) return;

        const request = new ApproveMemberRequest();
        request.memberId = member.id!;
        request.approvalNotes = this.approvalNotes || undefined;

        this.loading.set(true);
        this.memberApprovalService.memberApproval_ApproveMember(request).subscribe({
            next: () => {
                this.showAlert('success', `${member.firstNames} ${member.surname} has been approved successfully`);
                this.showApproveModal.set(false);
                this.selectedMember.set(null);
                this.loadPendingMembers();
                this.loadStats();
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error approving member:', error);
                this.showAlert('danger', 'Failed to approve member');
                this.loading.set(false);
            }
        });
    }

    rejectMember() {
        const member = this.selectedMember();
        if (!member || !this.rejectionReason.trim()) {
            this.showAlert('warning', 'Rejection reason is required');
            return;
        }

        const request = new RejectMemberRequest();
        request.memberId = member.id!;
        request.rejectionReason = this.rejectionReason;

        this.loading.set(true);
        this.memberApprovalService.memberApproval_RejectMember(request).subscribe({
            next: () => {
                this.showAlert('success', `${member.firstNames} ${member.surname} has been rejected`);
                this.showRejectModal.set(false);
                this.selectedMember.set(null);
                this.loadPendingMembers();
                this.loadStats();
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error rejecting member:', error);
                this.showAlert('danger', 'Failed to reject member');
                this.loading.set(false);
            }
        });
    }

    requestUpdates() {
        const member = this.selectedMember();
        if (!member || !this.updateRequestMessage.trim()) {
            this.showAlert('warning', 'Update request message is required');
            return;
        }

        const request = new RequestMemberUpdatesRequest();
        request.memberId = member.id!;
        request.updatesRequired = this.updateRequestMessage;
        request.requiredFields = this.updateRequestFields.length > 0 ? this.updateRequestFields : undefined;

        this.loading.set(true);
        this.memberApprovalService.memberApproval_RequestUpdates(request).subscribe({
            next: () => {
                this.showAlert('success', `Update request sent to ${member.firstNames} ${member.surname}`);
                this.showRequestUpdatesModal.set(false);
                this.selectedMember.set(null);
                this.loadPendingMembers();
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error requesting updates:', error);
                this.showAlert('danger', 'Failed to send update request');
                this.loading.set(false);
            }
        });
    }

    closeAllModals() {
        this.showDetailModal.set(false);
        this.showApproveModal.set(false);
        this.showRejectModal.set(false);
        this.showRequestUpdatesModal.set(false);
        this.selectedMember.set(null);
    }

    showAlert(type: 'success' | 'danger' | 'warning', message: string) {
        this.alert.set({ type, message });
        setTimeout(() => this.alert.set(null), 5000);
    }

    toggleUpdateField(field: string) {
        const index = this.updateRequestFields.indexOf(field);
        if (index > -1) {
            this.updateRequestFields.splice(index, 1);
        } else {
            this.updateRequestFields.push(field);
        }
    }

    isFieldSelected(field: string): boolean {
        return this.updateRequestFields.includes(field);
    }
}
