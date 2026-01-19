import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgoServiceProxy } from '../../core/services/service-proxies';

@Component({
    selector: 'app-ngo-grant-applications-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ngo-grant-applications-widget.component.html',
    styleUrls: ['./ngo-grant-applications-widget.component.scss']
})
export class NgoGrantApplicationsWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Funding Opportunities',
        subtitle: 'Explore available grants and funding opportunities',
        backgroundColor: '#f9fafb',
        padding: 40,
        titleColor: '#111827',
        titleSize: 32,
        subtitleColor: '#6b7280',
        subtitleSize: 16,
        cardBackgroundColor: '#ffffff',
        titleTextColor: '#111827',
        appTitleSize: 18,
        funderColor: '#6b7280',
        detailsBackgroundColor: '#f3f4f6',
        labelColor: '#6b7280',
        descriptionColor: '#4b5563',
        accentColor: '#7c3aed',
        statusTextColor: '#ffffff',
        buttonColor: '#7c3aed',
        buttonTextColor: '#ffffff',
        viewDetailsText: 'View Details',
        applyButtonText: 'Apply Now',
        viewAllButtonColor: '#7c3aed',
        viewAllButtonTextColor: '#ffffff',
        viewAllButtonText: 'View All Grants',
        showViewAllButton: true,
        grantsUrl: '/ngo/grant-applications'
    };

    applications: any[] = [];
    loading = true;

    statusColors: any = {
        'submitted': '#3b82f6',
        'under-review': '#f59e0b',
        'approved': '#10b981',
        'rejected': '#ef4444',
        'completed': '#8b5cf6'
    };

    constructor(private ngoService: NgoServiceProxy) {}

    ngOnInit(): void {
        this.loadApplications();
    }

    loadApplications(): void {
        this.loading = true;
        this.ngoService.get_GrantApplications().subscribe({
            next: (response: any) => {
                const data = response?.result || response || [];
                this.applications = (data || []).slice(0, 3);
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load grant applications:', error);
                this.loading = false;
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    formatStatus(status: string): string {
        return status?.replace('-', ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ') || 'Unknown';
    }

    getStatusColor(status: string): string {
        return this.statusColors[status?.toLowerCase()] || '#6b7280';
    }

    getStatusBackgroundColor(status: string): string {
        const color = this.getStatusColor(status);
        // Add opacity to color
        return color + '20';
    }

    getFundingProgress(approved: number, requested: number): number {
        if (requested === 0) return 0;
        return Math.round((approved / requested) * 100);
    }

    truncate(text: string, length: number): string {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    viewApplication(app: any): void {
        window.location.href = `${this.config.grantsUrl}/${app.id}`;
    }

    applyNow(app: any): void {
        if (app.applicationUrl) {
            window.open(app.applicationUrl, '_blank');
        }
    }

    viewAllApplications(): void {
        window.location.href = this.config.grantsUrl;
    }
}
