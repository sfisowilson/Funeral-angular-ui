import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { NgoServiceProxy } from '../../core/services/service-proxies';

@Component({
    selector: 'app-ngo-impact-reports-widget',
    standalone: true,
    imports: [CommonModule, ButtonModule, ProgressBarModule],
    template: `
        <div class="impact-reports-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-2" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title || 'Our Impact' }}
                </h2>
                <p *ngIf="config.subtitle" class="text-center mb-8" [style.color]="config.subtitleColor" [style.font-size.px]="config.subtitleSize">
                    {{ config.subtitle }}
                </p>

                <div *ngIf="loading" class="text-center p-8">
                    <p class="text-muted">Loading impact reports...</p>
                </div>

                <div *ngIf="!loading && reports.length === 0" class="text-center p-8">
                    <p class="text-muted">No impact reports available.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div *ngFor="let report of reports" class="report-card rounded-lg p-6 shadow-md" 
                        [style.background-color]="config.cardBackgroundColor"
                        [style.border-left]="'5px solid ' + config.accentColor">
                        
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="font-bold" [style.color]="config.reportTitleColor" [style.font-size.px]="config.reportTitleSize">
                                    {{ report.title }}
                                </h3>
                                <p class="text-sm" [style.color]="config.dateColor">
                                    {{ formatDate(report.reportPeriod) }}
                                </p>
                            </div>
                            <span class="px-3 py-1 rounded-full text-xs font-semibold" 
                                [style.background-color]="report.isPublished ? config.publishedColor : config.draftColor"
                                [style.color]="config.statusTextColor">
                                {{ report.isPublished ? 'Published' : 'Draft' }}
                            </span>
                        </div>

                        <!-- Key Metrics -->
                        <div *ngIf="report.metrics && getMetrics(report.metrics)" class="metrics-grid grid grid-cols-2 gap-4 mb-6">
                            <div *ngFor="let metric of getMetrics(report.metrics)" class="metric-item">
                                <p class="text-sm" [style.color]="config.metricLabelColor">
                                    {{ metric.label }}
                                </p>
                                <p class="font-bold text-lg" [style.color]="config.accentColor">
                                    {{ metric.value }}
                                </p>
                            </div>
                        </div>

                        <!-- Progress/Achievement -->
                        <div *ngIf="report.targetAmount && report.achievedAmount" class="achievement mb-4">
                            <div class="flex justify-between text-sm mb-2">
                                <span [style.color]="config.metricLabelColor">Progress: {{ getProgressPercentage(report.achievedAmount, report.targetAmount) }}%</span>
                            </div>
                            <p-progressBar 
                                [value]="getProgressPercentage(report.achievedAmount, report.targetAmount)" 
                                [style]="{'height': '8px'}"></p-progressBar>
                        </div>

                        <!-- Summary -->
                        <p class="text-sm mb-4" [style.color]="config.summaryColor">
                            {{ truncate(report.summary, 150) }}
                        </p>

                        <!-- Actions -->
                        <div class="flex gap-2">
                            <button pButton 
                                [label]="config.readMoreText || 'View Full Report'" 
                                size="small"
                                [style.background-color]="config.buttonColor" 
                                [style.color]="config.buttonTextColor"
                                (click)="viewReport(report)"></button>
                            
                            <button *ngIf="report.attachmentUrl" pButton 
                                [label]="config.downloadText || 'Download'" 
                                size="small" 
                                severity="secondary"
                                (click)="downloadReport(report)"></button>
                        </div>
                    </div>
                </div>

                <div *ngIf="config.showViewAllButton && !loading" class="text-center mt-12">
                    <button pButton 
                        [label]="config.viewAllButtonText || 'View All Reports'" 
                        [style.background-color]="config.viewAllButtonColor" 
                        [style.color]="config.viewAllButtonTextColor"
                        (click)="viewAllReports()"></button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .report-card {
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .report-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        }
        .metrics-grid {
            background-color: rgba(0, 0, 0, 0.02);
            padding: 12px;
            border-radius: 6px;
        }
    `]
})
export class NgoImpactReportsWidgetComponent implements OnInit {
    @Input() config: any = {
        title: 'Our Impact',
        subtitle: 'See the difference we\'re making together',
        backgroundColor: '#f9fafb',
        padding: 40,
        titleColor: '#111827',
        titleSize: 32,
        subtitleColor: '#6b7280',
        subtitleSize: 16,
        cardBackgroundColor: '#ffffff',
        reportTitleColor: '#111827',
        reportTitleSize: 18,
        dateColor: '#6b7280',
        accentColor: '#0891b2',
        summaryColor: '#4b5563',
        metricLabelColor: '#6b7280',
        publishedColor: '#10b981',
        draftColor: '#f59e0b',
        statusTextColor: '#ffffff',
        buttonColor: '#0891b2',
        buttonTextColor: '#ffffff',
        readMoreText: 'View Full Report',
        downloadText: 'Download',
        viewAllButtonColor: '#0891b2',
        viewAllButtonTextColor: '#ffffff',
        viewAllButtonText: 'View All Reports',
        showViewAllButton: true,
        reportUrl: '/ngo/impact-reports'
    };

    reports: any[] = [];
    loading = true;

    constructor(private ngoService: NgoServiceProxy) {}

    ngOnInit(): void {
        this.loadReports();
    }

    loadReports(): void {
        this.loading = true;
        this.ngoService.getImpactReports().subscribe({
            next: (data: any) => {
                this.reports = (data || []).filter((r: any) => r.isPublished).slice(0, 4);
                this.loading = false;
            },
            error: (error) => {
                console.error('Failed to load impact reports:', error);
                this.loading = false;
            }
        });
    }

    formatDate(date: any): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });
    }

    getMetrics(metricsJson: string): any[] {
        try {
            if (!metricsJson) return [];
            const metrics = typeof metricsJson === 'string' ? JSON.parse(metricsJson) : metricsJson;
            return Object.entries(metrics).map(([label, value]) => ({
                label: label.replace(/([A-Z])/g, ' $1').trim(),
                value: value
            })).slice(0, 4);
        } catch {
            return [];
        }
    }

    getProgressPercentage(achieved: number, target: number): number {
        if (target === 0) return 0;
        return Math.round((achieved / target) * 100);
    }

    truncate(text: string, length: number): string {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    viewReport(report: any): void {
        window.location.href = `${this.config.reportUrl}/${report.id}`;
    }

    downloadReport(report: any): void {
        if (report.attachmentUrl) {
            window.open(report.attachmentUrl, '_blank');
        }
    }

    viewAllReports(): void {
        window.location.href = this.config.reportUrl;
    }
}
