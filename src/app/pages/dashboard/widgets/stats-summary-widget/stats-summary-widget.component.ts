import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

interface StatCard {
    title: string;
    value: string;
    icon: string;
    trend: string;
    trendUp: boolean;
    color: string;
}

@Component({
    selector: 'app-stats-summary-widget',
    standalone: true,
    imports: [CommonModule, CardModule],
    templateUrl: './stats-summary-widget.component.html',
    styleUrl: './stats-summary-widget.component.scss'
})
export class StatsSummaryWidgetComponent implements OnInit {
    stats = signal<StatCard[]>([]);
    loading = signal(true);

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        // TODO: Replace with actual API call
        setTimeout(() => {
            this.stats.set([
                {
                    title: 'Total Members',
                    value: '1,245',
                    icon: 'pi-users',
                    trend: '+12.5%',
                    trendUp: true,
                    color: '#667eea'
                },
                {
                    title: 'Active Policies',
                    value: '892',
                    icon: 'pi-file',
                    trend: '+8.2%',
                    trendUp: true,
                    color: '#10b981'
                },
                {
                    title: 'Pending Claims',
                    value: '23',
                    icon: 'pi-exclamation-circle',
                    trend: '-5.3%',
                    trendUp: false,
                    color: '#f59e0b'
                },
                {
                    title: 'Revenue (MTD)',
                    value: 'R 125,430',
                    icon: 'pi-dollar',
                    trend: '+15.8%',
                    trendUp: true,
                    color: '#8b5cf6'
                }
            ]);
            this.loading.set(false);
        }, 500);
    }
}
