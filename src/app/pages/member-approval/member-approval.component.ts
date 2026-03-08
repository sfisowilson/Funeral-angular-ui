import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MemberApprovalServiceProxy, PendingMemberDto, MemberApprovalDetailDto, ApproveMemberRequest, RejectMemberRequest, RequestMemberUpdatesRequest } from '../../core/services/service-proxies';
import { TenantSettingsService } from '../../core/services/tenant-settings.service';
import { environment } from '../../../environments/environment';

interface AdminMappedAttachmentFile {
    id: string;
    fileName: string;
    contentType?: string;
    size?: number;
    entityType?: string;
    sourceLabels?: string[];
    fieldKeys?: string[];
    downloadUrl?: string;
}

interface AdminMappedAttachmentGroup {
    entityType: string;
    files: AdminMappedAttachmentFile[];
}

@Component({
    selector: 'app-member-approval',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [],
    templateUrl: './member-approval.component.html',
    styleUrl: './member-approval.component.scss'
})
export class MemberApprovalComponent implements OnInit {
    private http = inject(HttpClient);
    // ... existing signals
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
    mappedAttachments: AdminMappedAttachmentFile[] = [];
    mappedAttachmentGroups: AdminMappedAttachmentGroup[] = [];
    loadingMappedAttachments = false;
    mappedAttachmentsError = '';

    alert = signal<{ type: 'success' | 'danger' | 'warning'; message: string } | null>(null);

    memberNumberLabel = 'Member Number';

    constructor(
        private memberApprovalService: MemberApprovalServiceProxy,
        private tenantSettingsService: TenantSettingsService
    ) {}

    ngOnInit() {
        this.loadPendingMembers();
        this.loadStats();

         // Load configurable label for member number
        try {
            this.memberNumberLabel = this.tenantSettingsService.getMemberNumberLabel();
        } catch (error) {
            console.error('Error getting member number label from tenant settings:', error);
            this.memberNumberLabel = 'Member Number';
        }
    }

    loadPendingMembers() {
        this.loading.set(true);
        this.memberApprovalService.memberApproval_GetPendingMembers().subscribe({
            next: (response) => {
                this.pendingMembers.set(response?.result || []);
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
            next: (response) => {
                this.selectedMember.set(response?.result || null);
                this.loadMappedAttachmentsForMember(id);
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
        this.mappedAttachments = [];
        this.mappedAttachmentGroups = [];
        this.loadingMappedAttachments = false;
        this.mappedAttachmentsError = '';
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

    downloadContract(memberId: string) {
        this.loading.set(true);
        const url = `${environment.apiUrl}/api/OnboardingPdf/OnboardingPdf_DownloadPdf?memberId=${memberId}`;
        
        this.http.get(url, { responseType: 'blob' }).subscribe({
            next: (blob) => {
                const objectUrl = window.URL.createObjectURL(blob);
                window.open(objectUrl, '_blank');
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error downloading contract:', err);
                this.showAlert('danger', 'Failed to download contract PDF. It may not be generated yet.');
                this.loading.set(false);
            }
        });
    }

    private loadMappedAttachmentsForMember(memberId: string): void {
        this.loadingMappedAttachments = true;
        this.mappedAttachmentsError = '';
        this.mappedAttachments = [];
        this.mappedAttachmentGroups = [];

        const url = `${environment.apiUrl}/api/OnboardingPdf/OnboardingPdf_MappedAttachments`;
        const payload = {
            memberId,
            attachmentMappings: []
        };

        this.http.post<any[]>(url, payload).subscribe({
            next: (response) => {
                const rows = Array.isArray(response) ? response : [];
                this.mappedAttachments = rows.map((row: any) => ({
                    id: String(row.id || ''),
                    fileName: String(row.fileName || 'Unnamed file'),
                    contentType: row.contentType || undefined,
                    size: typeof row.size === 'number' ? row.size : undefined,
                    entityType: row.entityType || undefined,
                    sourceLabels: Array.isArray(row.sourceLabels) ? row.sourceLabels.filter((v: any) => !!v).map((v: any) => String(v)) : [],
                    fieldKeys: Array.isArray(row.fieldKeys) ? row.fieldKeys.filter((v: any) => !!v).map((v: any) => String(v)) : [],
                    downloadUrl: `${environment.apiUrl}/api/FileUpload/File_DownloadFile/${String(row.id || '')}`
                }));

                this.mappedAttachmentGroups = this.groupMappedAttachments(this.mappedAttachments);
                this.loadingMappedAttachments = false;
            },
            error: (err) => {
                console.error('Error loading mapped attachments for member approval:', err);
                this.mappedAttachmentsError = 'Failed to load mapped attachments.';
                this.loadingMappedAttachments = false;
            }
        });
    }

    private groupMappedAttachments(files: AdminMappedAttachmentFile[]): AdminMappedAttachmentGroup[] {
        const grouped = new Map<string, AdminMappedAttachmentFile[]>();

        for (const file of files) {
            const key = (file.entityType || '').trim() || 'Other';
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }

            grouped.get(key)!.push(file);
        }

        return Array.from(grouped.entries()).map(([entityType, items]) => ({
            entityType,
            files: items
        }));
    }

    isPdfAttachment(file: AdminMappedAttachmentFile): boolean {
        const contentType = (file.contentType || '').toLowerCase();
        const fileName = (file.fileName || '').toLowerCase();
        return contentType.includes('pdf') || fileName.endsWith('.pdf');
    }

    isImageAttachment(file: AdminMappedAttachmentFile): boolean {
        const contentType = (file.contentType || '').toLowerCase();
        const fileName = (file.fileName || '').toLowerCase();

        if (contentType.startsWith('image/')) {
            return true;
        }

        return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'].some((ext) => fileName.endsWith(ext));
    }

    formatFileSize(bytes: number | undefined): string {
        if (!bytes || bytes <= 0) {
            return '';
        }

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        const kb = bytes / 1024;
        if (kb < 1024) {
            return `${kb.toFixed(1)} KB`;
        }

        const mb = kb / 1024;
        return `${mb.toFixed(1)} MB`;
    }
}
