import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { PremiumCalculationServiceProxy, PolicyCoverPremiumTableDto } from '../../core/services/service-proxies';

@Component({
  selector: 'app-policy-cover-premium-table-widget',
  standalone: true,
  imports: [CommonModule, TableModule],
  providers: [PremiumCalculationServiceProxy],
  template: `
    <div *ngIf="tableData && tableData.rows && tableData.rows.length > 0" class="policy-cover-premium-table-widget p-4">
        <h2 *ngIf="settings.title" class="text-center mb-4 text-2xl font-bold">{{ settings.title }}</h2>
        <p *ngIf="settings.subtitle" class="text-center mb-8 text-lg text-gray-600">{{ settings.subtitle }}</p>
        <p-table [value]="tableData.rows" styleClass="p-datatable-striped">
            <ng-template pTemplate="header">
                <tr>
                    <th class="text-left">Cover Amount</th>
                    <th class="text-right">1-5 Dependents (Under 65)</th>
                    <th class="text-right">1-5 Dependents (Under 70)</th>
                    <th class="text-right">1-5 Dependents (Under 75)</th>
                    <th class="text-right">75+</th>
                </tr>
            </ng-template>
            <ng-template pTemplate="body" let-row>
                <tr>
                    <td class="text-left font-semibold">{{ row.coverAmount | currency:'R':'symbol':'1.2-2' }}</td>
                    <td class="text-right">{{ row.premium_1To5Dependents_Under65 | currency:'R':'symbol':'1.2-2' }}</td>
                    <td class="text-right">{{ row.premium_1To5Dependents_Under70 | currency:'R':'symbol':'1.2-2' }}</td>
                    <td class="text-right">{{ row.premium_1To5Dependents_Under75 | currency:'R':'symbol':'1.2-2' }}</td>
                    <td class="text-right">{{ row.premium_1To5Dependents_75Plus | currency:'R':'symbol':'1.2-2' }}</td>
                </tr>
            </ng-template>
        </p-table>
    </div>
  `,
})
export class PolicyCoverPremiumTableWidgetComponent implements OnInit {
    @Input() config: any = {};
    
    settings: any = {};
    tableData: PolicyCoverPremiumTableDto | undefined;

    constructor(private premiumService: PremiumCalculationServiceProxy) {}

    ngOnInit(): void {
        this.settings = this.config.settings || {};
        this.premiumService.premiumCalculation_GetSettings().subscribe(settings => {
            this.tableData = settings.policyCoverTable;
        });
    }
}
