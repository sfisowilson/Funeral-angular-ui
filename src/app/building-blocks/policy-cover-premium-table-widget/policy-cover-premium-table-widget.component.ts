import { Component, Input, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PremiumCalculationServiceProxy, PolicyCoverPremiumTableDto } from '../../core/services/service-proxies';
import { hexToRgba } from '../widget-color.utils';

@Component({
    selector: 'app-policy-cover-premium-table-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, TableModule],
    providers: [],
    template: `
        <div *ngIf="tableData && tableData.rows && tableData.rows.length > 0" class="policy-cover-premium-table-widget p-4" [style.background-color]="backgroundColor">
            <h2 *ngIf="settings.title" class="text-center mb-4 text-2xl font-bold" [style.color]="titleColor">{{ settings.title }}</h2>
            <p *ngIf="settings.subtitle" class="text-center mb-8 text-lg" [style.color]="subtitleColor">{{ settings.subtitle }}</p>
            <p-table [value]="tableData.rows" styleClass="p-datatable-striped">
                <ng-template pTemplate="header">
                    <tr>
                        <th class="text-left" [style.background-color]="headerBackgroundColor" [style.color]="headerTextColor">Cover Amount</th>
                        <th class="text-right" [style.background-color]="headerBackgroundColor" [style.color]="headerTextColor">1-5 Dependents (Under 65)</th>
                        <th class="text-right" [style.background-color]="headerBackgroundColor" [style.color]="headerTextColor">1-5 Dependents (Under 70)</th>
                        <th class="text-right" [style.background-color]="headerBackgroundColor" [style.color]="headerTextColor">1-5 Dependents (Under 75)</th>
                        <th class="text-right" [style.background-color]="headerBackgroundColor" [style.color]="headerTextColor">75+</th>
                    </tr>
                </ng-template>
                <ng-template pTemplate="body" let-row>
                    <tr>
                        <td class="text-left font-semibold" [style.color]="cellTextColor">{{ row.coverAmount | currency: 'R' : 'symbol' : '1.2-2' }}</td>
                        <td class="text-right" [style.color]="cellTextColor">{{ row.premium_1To5Dependents_Under65 | currency: 'R' : 'symbol' : '1.2-2' }}</td>
                        <td class="text-right" [style.color]="cellTextColor">{{ row.premium_1To5Dependents_Under70 | currency: 'R' : 'symbol' : '1.2-2' }}</td>
                        <td class="text-right" [style.color]="cellTextColor">{{ row.premium_1To5Dependents_Under75 | currency: 'R' : 'symbol' : '1.2-2' }}</td>
                        <td class="text-right" [style.color]="cellTextColor">{{ row.premium_1To5Dependents_75Plus | currency: 'R' : 'symbol' : '1.2-2' }}</td>
                    </tr>
                </ng-template>
            </p-table>
        </div>
    `
})
export class PolicyCoverPremiumTableWidgetComponent implements OnInit {
    @Input() config: any = {};

    settings: any = {};
    tableData: PolicyCoverPremiumTableDto | undefined;

    constructor(private premiumService: PremiumCalculationServiceProxy) {}

    ngOnInit(): void {
        this.settings = this.config.settings || {};
        this.premiumService.premiumCalculation_GetSettings().subscribe((response) => {
            this.tableData = response?.result?.policyCoverTable;
        });
    }

    get backgroundColor(): string {
        return hexToRgba(this.settings.backgroundColor || '#ffffff', this.settings.backgroundOpacity ?? 1);
    }
    get titleColor(): string { return this.settings.titleColor || '#333333'; }
    get subtitleColor(): string { return this.settings.subtitleColor || '#6b7280'; }
    get headerBackgroundColor(): string { return this.settings.headerBackgroundColor || '#f3f4f6'; }
    get headerTextColor(): string { return this.settings.headerTextColor || '#374151'; }
    get cellTextColor(): string { return this.settings.cellTextColor || '#374151'; }
}
