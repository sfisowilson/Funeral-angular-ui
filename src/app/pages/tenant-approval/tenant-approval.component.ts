import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { 
    TenantApprovalService, 
    TenantApprovalListDto, 
    TenantApprovalDetailDto,
    TenantApprovalStatus,
    ApproveTenantDto,
    RejectTenantDto,
    RequestTenantChangeDto
} from '../../core/services/tenant-approval.service';

@Component({
    selector: 'app-tenant-approval',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputTextarea,
        TagModule,
        CardModule
    ],
    templateUrl: './tenant-approval.component.html',
    styleUrl: './tenant-approval.component.scss'
})
export class TenantApprovalComponent implements OnInit {
    tenants = signal<TenantApprovalListDto[]>([]);
    selectedTenant = signal<TenantApprovalDetailDto | null>(null);
    loading = signal(false);
    showDetailDialog = signal(false);
    showApproveDialog = signal(false);
    showRejectDialog = signal(false);
    showRequestChangeDialog = signal(false);
    
    rejectionReason = '';
    changeRequestReason = '';
    
    TenantApprovalStatus = TenantApprovalStatus;

    constructor(private tenantApprovalService: TenantApprovalService) {}

    ngOnInit() {
        this.loadTenants();
    }

    loadTenants() {
        this.loading.set(true);
        this.tenantApprovalService.getAllTenantRequests().subscribe({
            next: (tenants) => {
                this.tenants.set(tenants);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading tenants:', error);
                this.loading.set(false);
            }
        });
    }

    viewTenantDetails(tenantId: string) {
        this.loading.set(true);
        this.tenantApprovalService.getTenantDetail(tenantId).subscribe({
            next: (details) => {
                this.selectedTenant.set(details);
                this.showDetailDialog.set(true);
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error loading tenant details:', error);
                this.loading.set(false);
            }
        });
    }

    openApproveDialog() {
        this.showDetailDialog.set(false);
        this.showApproveDialog.set(true);
    }

    openRejectDialog() {
        this.rejectionReason = '';
        this.showDetailDialog.set(false);
        this.showRejectDialog.set(true);
    }

    openRequestChangeDialog() {
        this.changeRequestReason = '';
        this.showDetailDialog.set(false);
        this.showRequestChangeDialog.set(true);
    }

    approveTenant() {
        const tenant = this.selectedTenant();
        if (!tenant) return;

        const dto = ApproveTenantDto.fromJS({
            tenantId: tenant.id
        });

        this.loading.set(true);
        this.tenantApprovalService.approveTenant(dto).subscribe({
            next: () => {
                this.showApproveDialog.set(false);
                this.selectedTenant.set(null);
                this.loadTenants();
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error approving tenant:', error);
                this.loading.set(false);
            }
        });
    }

    rejectTenant() {
        const tenant = this.selectedTenant();
        if (!tenant || !this.rejectionReason.trim()) {
            return;
        }

        const dto = RejectTenantDto.fromJS({
            tenantId: tenant.id,
            rejectionReason: this.rejectionReason
        });

        this.loading.set(true);
        this.tenantApprovalService.rejectTenant(dto).subscribe({
            next: () => {
                this.showRejectDialog.set(false);
                this.selectedTenant.set(null);
                this.loadTenants();
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error rejecting tenant:', error);
                this.loading.set(false);
            }
        });
    }

    requestChange() {
        const tenant = this.selectedTenant();
        if (!tenant || !this.changeRequestReason.trim()) {
            return;
        }

        const dto = RequestTenantChangeDto.fromJS({
            tenantId: tenant.id,
            changeRequestReason: this.changeRequestReason
        });

        this.loading.set(true);
        this.tenantApprovalService.requestChange(dto).subscribe({
            next: () => {
                this.showRequestChangeDialog.set(false);
                this.selectedTenant.set(null);
                this.loadTenants();
                this.loading.set(false);
            },
            error: (error) => {
                console.error('Error requesting change:', error);
                this.loading.set(false);
            }
        });
    }

    closeAllDialogs() {
        this.showDetailDialog.set(false);
        this.showApproveDialog.set(false);
        this.showRejectDialog.set(false);
        this.showRequestChangeDialog.set(false);
        this.selectedTenant.set(null);
    }

    getStatusSeverity(status: TenantApprovalStatus): string {
        switch (status) {
            case TenantApprovalStatus._0: // Pending
                return 'warning';
            case TenantApprovalStatus._1: // Approved
                return 'success';
            case TenantApprovalStatus._2: // Rejected
                return 'danger';
            case TenantApprovalStatus._3: // ChangeRequested
                return 'info';
            default:
                return 'secondary';
        }
    }

    getStatusLabel(status: TenantApprovalStatus): string {
        switch (status) {
            case TenantApprovalStatus._0: // Pending
                return 'Pending';
            case TenantApprovalStatus._1: // Approved
                return 'Approved';
            case TenantApprovalStatus._2: // Rejected
                return 'Rejected';
            case TenantApprovalStatus._3: // ChangeRequested
                return 'Change Requested';
            default:
                return 'Unknown';
        }
    }

    toDate(dateTime: any): Date | null {
        if (!dateTime) return null;
        if (dateTime.toJSDate) {
            return dateTime.toJSDate();
        }
        return dateTime;
    }
}
