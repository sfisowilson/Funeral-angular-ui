import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineModule } from 'primeng/timeline';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';

export interface WorkflowHistory {
    id: number;
    claimId: string | number;
    oldStatus: string;
    newStatus: string;
    changedAt: Date;
    changedByName: string;
    comments?: string;
}

@Component({
    selector: 'app-workflow-history',
    standalone: true,
    imports: [CommonModule, TimelineModule, CardModule, TagModule],
    templateUrl: './workflow-history.component.html',
    styleUrl: './workflow-history.component.scss'
})
export class WorkflowHistoryComponent implements OnInit {
    @Input() claimId!: string | number;

    history = signal<WorkflowHistory[]>([]);

    ngOnInit() {
        this.loadWorkflowHistory();
    }

    loadWorkflowHistory() {
        // In a real implementation, this would call an API endpoint
        // For now, we'll show sample data
        const sampleHistory: WorkflowHistory[] = [
            {
                id: 1,
                claimId: this.claimId,
                oldStatus: '',
                newStatus: 'Pending',
                changedAt: new Date('2024-01-01'),
                changedByName: 'System',
                comments: 'Claim submitted by member'
            },
            {
                id: 2,
                claimId: this.claimId,
                oldStatus: 'Pending',
                newStatus: 'InReview',
                changedAt: new Date('2024-01-02'),
                changedByName: 'John Doe',
                comments: 'Assigned to claims officer for review'
            },
            {
                id: 3,
                claimId: this.claimId,
                oldStatus: 'InReview',
                newStatus: 'DocumentsRequired',
                changedAt: new Date('2024-01-03'),
                changedByName: 'John Doe',
                comments: 'Additional documentation required from member'
            },
            {
                id: 4,
                claimId: this.claimId,
                oldStatus: 'DocumentsRequired',
                newStatus: 'Approved',
                changedAt: new Date('2024-01-05'),
                changedByName: 'Jane Smith',
                comments: 'All documents verified and claim approved'
            }
        ];

        this.history.set(sampleHistory);
    }

    formatDate(date: Date): string {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'Pending':
                return '#6c757d';
            case 'InReview':
                return '#ffc107';
            case 'DocumentsRequired':
                return '#fd7e14';
            case 'Approved':
                return '#28a745';
            case 'Rejected':
                return '#dc3545';
            case 'Paid':
                return '#007bff';
            default:
                return '#6c757d';
        }
    }

    getStatusIcon(status: string): string {
        switch (status) {
            case 'Pending':
                return 'pi pi-clock';
            case 'InReview':
                return 'pi pi-eye';
            case 'DocumentsRequired':
                return 'pi pi-file';
            case 'Approved':
                return 'pi pi-check';
            case 'Rejected':
                return 'pi pi-times';
            case 'Paid':
                return 'pi pi-dollar';
            default:
                return 'pi pi-circle';
        }
    }

    getTagSeverity(status: string): string {
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
