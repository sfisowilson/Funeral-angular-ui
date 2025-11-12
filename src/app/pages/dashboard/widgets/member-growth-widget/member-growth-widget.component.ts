import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';

@Component({
    selector: 'app-member-growth-widget',
    standalone: true,
    imports: [CommonModule, CardModule, ChartModule],
    templateUrl: './member-growth-widget.component.html',
    styleUrl: './member-growth-widget.component.scss'
})
export class MemberGrowthWidgetComponent implements OnInit {
    chartData = signal<any>({});
    chartOptions = signal<any>({});

    ngOnInit() {
        this.chartData.set({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'New Members',
                    data: [42, 55, 48, 67, 72, 85],
                    backgroundColor: '#10b981',
                    borderRadius: 8
                }
            ]
        });

        this.chartOptions.set({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        });
    }
}
