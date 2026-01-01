import { Component, Input, OnInit } from '@angular/core';
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
                    {{ title }}
                </h2>
                
                <div *ngIf="statistics.length === 0" class="text-center p-8">
                    <p class="text-muted">No statistics available. Configure your widget to display impact metrics.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div *ngFor="let stat of statistics" class="stat-card text-center p-6 rounded-lg shadow-lg" [style.background-color]="config.cardBackgroundColor">
                        <i [class]="stat.icon || 'pi pi-chart-bar'" [style.font-size.px]="config.iconSize || 48" [style.color]="config.iconColor" class="block mb-4"></i>
                        <div class="stat-number text-3xl font-bold mb-2" [style.color]="config.numberColor">
                            {{ stat.value || '0' }}
                        </div>
                        <div class="stat-label" [style.color]="config.labelColor" [style.font-size.px]="config.labelSize">
                            {{ stat.label || 'Metric' }}
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
export class StatisticsWidgetComponent implements OnInit {
    @Input() config: any = {};

    constructor() {
        console.log('StatisticsWidgetComponent initialized');
    }

    ngOnInit() {
        console.log('Statistics widget config:', this.config);
        console.log('Statistics:', this.statistics);
    }

    get title(): string {
        return this.config.title || 'Our Impact';
    }

    get statistics(): any[] {
        const statistics = this.config.statistics || [];
        console.log('Getting statistics:', statistics);
        
        // If no statistics provided, show default ones
        if (statistics.length === 0) {
            console.log('No statistics found, showing defaults');
            return [
                { icon: 'pi pi-users', value: '10,000+', label: 'Active Members', description: 'Growing monthly' },
                { icon: 'pi pi-check-circle', value: '5,000+', label: 'Claims Processed', description: 'Successfully paid out' },
                { icon: 'pi pi-shield', value: '15+', label: 'Years Experience', description: 'Serving communities' },
                { icon: 'pi pi-heart', value: '99%', label: 'Satisfaction Rate', description: 'Customer feedback' }
            ];
        }
        
        return statistics;
    }
}
