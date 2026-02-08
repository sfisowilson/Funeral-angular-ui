import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { DynamicEntityServiceProxy } from '@app/core/services/service-proxies';

@Component({
    selector: 'app-dynamic-entity-count-widget',
    standalone: true,
    imports: [CommonModule],
    providers: [DynamicEntityServiceProxy],
    templateUrl: './dynamic-entity-count-widget.component.html',
    styleUrl: './dynamic-entity-count-widget.component.scss'
})
export class DynamicEntityCountWidgetComponent implements OnInit {
    @Input() title: string = 'Premium Types';
    @Input() entityTypeKey: string = 'PremiumType';

    count = signal<number | null>(null);
    loading = signal<boolean>(true);
    error = signal<string | null>(null);

    constructor(private dynamicEntityService: DynamicEntityServiceProxy) {}

    ngOnInit(): void {
        this.loadCount();
    }

    private loadCount(): void {
        this.loading.set(true);
        this.error.set(null);

        // Use the existing paged list endpoint but only fetch 1 record; rely on TotalCount for the metric.
        this.dynamicEntityService.record_List(this.entityTypeKey, 1, 1, undefined).subscribe({
            next: (response) => {
                const total = response?.result?.totalCount ?? 0;
                this.count.set(total);
                this.loading.set(false);
            },
            error: (err) => {
                console.error('Error loading dynamic entity count widget:', err);
                this.error.set('Unable to load data');
                this.loading.set(false);
            }
        });
    }
}
