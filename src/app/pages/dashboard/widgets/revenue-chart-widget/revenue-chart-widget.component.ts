import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
    selector: 'app-revenue-chart-widget',
    standalone: true,
    imports: [CommonModule, CardModule, ChartModule],
    templateUrl: './revenue-chart-widget.component.html',
    styleUrl: './revenue-chart-widget.component.scss'
})
export class RevenueChartWidgetComponent implements OnInit {
    chartData = signal<any>({});
    chartOptions = signal<any>({});
    loading = signal(true);

    ngOnInit() {
        this.loadChartData();
    }

    loadChartData() {
        // TODO: Replace with actual API call
        setTimeout(() => {
            this.chartData.set({
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Revenue',
                        data: [65000, 72000, 68000, 85000, 92000, 105000],
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        borderColor: '#667eea',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            });

            this.chartOptions.set({
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context: any) => {
                                return 'R ' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value: any) => 'R ' + value.toLocaleString()
                        }
                    }
                }
            });

            this.loading.set(false);
        }, 500);
    }
}
