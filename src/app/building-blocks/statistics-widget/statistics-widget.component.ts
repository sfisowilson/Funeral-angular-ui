import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';

@Component({
    selector: 'app-statistics-widget',
    standalone: true,
    imports: [CommonModule, CardModule],
    template: `
        <div class="statistics-widget" [style.background-color]="config.backgroundColor" [style.padding.px]="config.padding">
            <div class="container mx-auto">
                <h2 class="text-center mb-8" [style.color]="config.titleColor" [style.font-size.px]="config.titleSize">
                    {{ config.title }}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div *ngFor="let stat of config.statistics" class="stat-card text-center p-6 rounded-lg shadow-lg" [style.background-color]="config.cardBackgroundColor">
                        <i [class]="stat.icon" [style.font-size.px]="config.iconSize" [style.color]="config.iconColor" class="block mb-4"></i>
                        <div class="stat-number text-3xl font-bold mb-2" [style.color]="config.numberColor">
                            {{ stat.value }}
                        </div>
                        <div class="stat-label" [style.color]="config.labelColor" [style.font-size.px]="config.labelSize">
                            {{ stat.label }}
                        </div>
                        <div *ngIf="stat.description" class="stat-description text-sm mt-2" [style.color]="config.descriptionColor">
                            {{ stat.description }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            .stat-card {
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }
            .stat-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            }
        `
    ]
})
export class StatisticsWidgetComponent {
    @Input() config: any = {};
}
