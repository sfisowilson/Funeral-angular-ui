import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../../core/services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule],
    template: `<div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Total Claims</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats()?.totalClaims || 0 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-file text-blue-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ stats()?.pendingClaims || 0 }} pending </span>
                <span class="text-muted-color">claims awaiting review</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Claim Value</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats()?.totalClaimAmount || 0 | currency }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-dollar text-orange-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ stats()?.approvedClaims || 0 }} approved </span>
                <span class="text-muted-color">claims processed</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Members</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats()?.totalMembers || 0 }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-users text-cyan-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ stats()?.totalPolicies || 0 }} </span>
                <span class="text-muted-color">active policies</span>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex justify-between mb-4">
                    <div>
                        <span class="block text-muted-color font-medium mb-4">Monthly Revenue</span>
                        <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ stats()?.monthlyRevenue || 0 | currency }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                        <i class="pi pi-chart-line text-purple-500 !text-xl"></i>
                    </div>
                </div>
                <span class="text-primary font-medium">{{ stats()?.rejectedClaims || 0 }} </span>
                <span class="text-muted-color">claims rejected</span>
            </div>
        </div>`
})
export class StatsWidget implements OnInit {
    stats = signal<DashboardStats | null>(null);

    constructor(private dashboardService: DashboardService) {}

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.dashboardService.getDashboardData().subscribe({
            next: (data) => this.stats.set(data),
            error: (error) => console.error('Failed to load dashboard stats:', error)
        });
    }
}
