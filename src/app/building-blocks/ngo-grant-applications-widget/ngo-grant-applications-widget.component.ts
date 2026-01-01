import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { NgoServiceProxy } from '../../core/services/service-proxies';

@Component({
    selector: 'app-ngo-grant-applications-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, TagModule, ProgressBarModule],
    template: `
        <div class="grant-applications-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-2" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title || 'Funding Opportunities' }}
                </h2>
                <p *ngIf="config.subtitle" class="text-center mb-8" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ config.subtitle }}
                </p>

                <div *ngIf="loading" class="text-center p-8">
                    <p class="text-muted">Loading grant applications...</p>
                </div>

                <div *ngIf="!loading && applications.length === 0" class="text-center p-8">
                    <p class="text-muted">No grant applications available.</p>
                </div>

                <div class="space-y-6">
                    <div *ngFor="let app of applications" class="grant-card rounded-lg p-6 shadow-md" 
                        [style.background-color]="config.cardBackgroundColor"
                        [style.border-left]="'4px solid ' + getStatusColor(app.status)">
                        
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex-1">
                                <h3 class="font-bold mb-2" [style.color]="config.titleTextColor" [style.font-size.px]="config.appTitleSize">
                                    {{ app.projectName }}
                                </h3>
                                <p class="text-sm mb-2" [style.color]="config.funderColor">
                                    Funder: <span class="font-semibold">{{ app.funderName }}</span>
                                </p>
                            </div>

                            <span class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4" 
                                [style.background-color]="getStatusBackgroundColor(app.status)" 
                                [style.color]="config.statusTextColor">
                                {{ formatStatus(app.status) }}
                            </span>
                        </div>

                        <!-- Funding Details -->
                        <div class="grid grid-cols-3 gap-4 mb-4 p-4 rounded" [style.background-color]="config.detailsBackgroundColor">
                            <div>
                                <p class="text-xs" [style.color]="config.labelColor">Requested Amount</p>
                                <p class="font-bold" [style.color]="config.accentColor">
                                    {{ app.requestedAmount | currency:'ZAR':'symbol':'1.0-0' }}
                                </p>
                            </div>
                            <div>
                                <p class="text-xs" [style.color]="config.labelColor">Approved Amount</p>
                                <p class="font-bold" [style.color]="config.accentColor">
                                    {{ app.approvedAmount | currency:'ZAR':'symbol':'1.0-0' }}
                                </p>
                            </div>
                            <div>
                                <p class="text-xs" [style.color]="config.labelColor">Deadline</p>
                                <p class="font-bold" [style.color]="config.accentColor">
                                    {{ formatDate(app.deadline) }}
                                </p>
                            </div>
                        </div>

                        <!-- Progress Bar for Funding -->
                        <div *ngIf="app.requestedAmount > 0" class="mb-4">
                            <div class="flex justify-between text-xs mb-2">
                                <span [style.color]="config.labelColor">Funding Progress</span>
                                <span [style.color]="config.accentColor" class="font-semibold">
                                    {{ getFundingProgress(app.approvedAmount, app.requestedAmount) }}%
                                </span>
                            </div>
                            <p-progressBar 
                                [value]="getFundingProgress(app.approvedAmount, app.requestedAmount)" 
                                [style]="{'height': '6px'}"></p-progressBar>
                        </div>

                        <!-- Description -->
                        <p class="text-sm mb-4" [style.color]="config.descriptionColor">
                            {{ truncate(app.projectDescription, 150) }}
                        </p>

                        <!-- Actions -->
                        <div class="flex gap-2">
                            <button pButton 
                                [label]="config.viewDetailsText || 'View Details'" 
                                size="small"
                                [style.background-color]="config.buttonColor" 
                                [style.color]="config.buttonTextColor"
                                (click)="viewApplication(app)"></button>
                            
                            <button *ngIf="app.applicationUrl" pButton 
                                [label]="config.applyButtonText || 'Apply Now'" 
                                size="small" 
                                severity="success"
                                (click)="applyNow(app)"></button>
                        </div>
                    </div>
                </div>

                <div *ngIf="config.showViewAllButton && !loading" class="text-center mt-12">
                    <button pButton 
                        [label]="config.viewAllButtonText || 'View All Grants'" 
                        [style.background-color]="config.viewAllButtonColor" 
                        [style.color]="config.viewAllButtonTextColor"
                        (click)="viewAllApplications()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .grant-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .grant-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
    `]
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
        this.ngoService.getGrantApplications().subscribe({
            next: (data: any) => {
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
