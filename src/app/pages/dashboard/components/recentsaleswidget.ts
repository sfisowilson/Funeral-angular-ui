import { Component, OnInit, signal } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { DashboardService, DashboardStats } from '../../../core/services/dashboard.service';
import { ClaimDto } from '../../../core/services/service-proxies';

@Component({
    standalone: true,
    selector: 'app-recent-sales-widget',
    imports: [CommonModule, TableModule, ButtonModule, RippleModule, TagModule],
    template: `<div class="card !mb-8">
        <div class="font-semibold text-xl mb-4">Recent Claims</div>
        <p-table [value]="recentClaims()" [paginator]="true" [rows]="5" responsiveLayout="scroll">
            <ng-template #header>
                <tr>
                    <th>ID</th>
                    <th pSortableColumn="claimAmount">Amount <p-sortIcon field="claimAmount"></p-sortIcon></th>
                    <th pSortableColumn="claimDate">Date <p-sortIcon field="claimDate"></p-sortIcon></th>
                    <th pSortableColumn="status">Status <p-sortIcon field="status"></p-sortIcon></th>
                    <th>Action</th>
                </tr>
            </ng-template>
            <ng-template #body let-claim>
                <tr>
                    <td style="width: 15%; min-width: 3rem;">#{{ claim.id }}</td>
                    <td style="width: 25%; min-width: 6rem;">{{ claim.claimAmount | currency: 'USD' }}</td>
                    <td style="width: 25%; min-width: 6rem;">{{ formatDate(claim.claimDate) }}</td>
                    <td style="width: 20%; min-width: 5rem;">
                        <p-tag [value]="claim.status" [severity]="getSeverity(claim.status)"></p-tag>
                    </td>
                    <td style="width: 15%;">
                        <button pButton pRipple type="button" icon="pi pi-eye" class="p-button p-component p-button-text p-button-icon-only" title="View Details"></button>
                    </td>
                </tr>
            </ng-template>
            <ng-template #emptymessage>
                <tr>
                    <td colspan="5" class="text-center py-4">No recent claims found</td>
                </tr>
            </ng-template>
        </p-table>
    </div>`
})
export class RecentSalesWidget implements OnInit {
    recentClaims = signal<ClaimDto[]>([]);

    constructor(private dashboardService: DashboardService) {}

    ngOnInit() {
        this.loadRecentClaims();
    }

    loadRecentClaims() {
        this.dashboardService.getDashboardData().subscribe({
            next: (data) => this.recentClaims.set(data.recentClaims),
            error: (error) => console.error('Failed to load recent claims:', error)
        });
    }

    formatDate(date: any): string {
        if (!date) return 'N/A';
        try {
            return new Date(date.toString()).toLocaleDateString();
        } catch {
            return 'Invalid Date';
        }
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
}
