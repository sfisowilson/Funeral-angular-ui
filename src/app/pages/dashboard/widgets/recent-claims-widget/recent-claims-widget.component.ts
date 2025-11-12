import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

interface Claim {
    id: string;
    memberName: string;
    policyNumber: string;
    amount: number;
    status: string;
    date: Date;
}

@Component({
    selector: 'app-recent-claims-widget',
    standalone: true,
    imports: [CommonModule, CardModule, TableModule, TagModule],
    templateUrl: './recent-claims-widget.component.html',
    styleUrl: './recent-claims-widget.component.scss'
})
export class RecentClaimsWidgetComponent implements OnInit {
    claims = signal<Claim[]>([]);
    loading = signal(true);

    ngOnInit() {
        this.loadClaims();
    }

    loadClaims() {
        // TODO: Replace with actual API call
        setTimeout(() => {
            this.claims.set([
                {
                    id: 'CLM-001',
                    memberName: 'John Doe',
                    policyNumber: 'POL-2024-001',
                    amount: 15000,
                    status: 'Pending',
                    date: new Date('2025-10-05')
                },
                {
                    id: 'CLM-002',
                    memberName: 'Jane Smith',
                    policyNumber: 'POL-2024-002',
                    amount: 25000,
                    status: 'Approved',
                    date: new Date('2025-10-04')
                },
                {
                    id: 'CLM-003',
                    memberName: 'Mike Johnson',
                    policyNumber: 'POL-2024-003',
                    amount: 18000,
                    status: 'Under Review',
                    date: new Date('2025-10-03')
                }
            ]);
            this.loading.set(false);
        }, 500);
    }

    getStatusSeverity(status: string): string {
        const severityMap: Record<string, string> = {
            'Approved': 'success',
            'Pending': 'warning',
            'Under Review': 'info',
            'Rejected': 'danger'
        };
        return severityMap[status] || 'info';
    }
}
