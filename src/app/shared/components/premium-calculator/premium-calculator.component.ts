import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
    selector: 'app-premium-calculator',
    standalone: true,
    imports: [
        CommonModule,
        CardModule,
        TableModule,
        TagModule,
        ProgressSpinnerModule,
        ButtonModule,
        ToastModule
    ],
    providers: [MessageService],
    template: `
        <p-toast></p-toast>
        
        <div class="premium-calculator">
            <p-card header="Your Monthly Premium Breakdown">
                <div *ngIf="loading()" class="loading-state">
                    <p-progressSpinner></p-progressSpinner>
                    <p>Calculating your premium...</p>
                </div>

                <div *ngIf="!loading() && premiumResult()">
                    <!-- Total Premium Display -->
                    <div class="total-premium-card">
                        <div class="premium-label">Total Monthly Premium</div>
                        <div class="premium-amount">R{{ premiumResult()!.totalMonthlyPremium | number:'1.2-2' }}</div>
                        <div class="premium-note">{{ premiumResult()!.message }}</div>
                    </div>

                    <!-- Premium Breakdown Table -->
                    <div class="breakdown-section">
                        <h4>Premium Breakdown</h4>
                        <p-table [value]="premiumResult()!.breakdown" styleClass="p-datatable-sm">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Description</th>
                                    <th>Details</th>
                                    <th>Category</th>
                                    <th class="text-right">Amount</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td>{{ item.description }}</td>
                                    <td>{{ item.details }}</td>
                                    <td>
                                        <p-tag 
                                            [value]="item.category === 'Base' ? 'Base Premium' : 'Extended Family'" 
                                            [severity]="item.category === 'Base' ? 'info' : 'success'">
                                        </p-tag>
                                    </td>
                                    <td class="text-right">R{{ item.amount | number:'1.2-2' }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="summary">
                                <tr class="summary-row">
                                    <td colspan="3"><strong>Total Monthly Premium</strong></td>
                                    <td class="text-right">
                                        <strong>R{{ premiumResult()!.totalMonthlyPremium | number:'1.2-2' }}</strong>
                                    </td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>

                    <!-- Summary Cards -->
                    <div class="summary-cards">
                        <div class="summary-card">
                            <div class="summary-label">Base Premium</div>
                            <div class="summary-value">R{{ premiumResult()!.basePremium | number:'1.2-2' }}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Extended Family</div>
                            <div class="summary-value">R{{ premiumResult()!.extendedFamilyPremium | number:'1.2-2' }}</div>
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button 
                            pButton 
                            label="Refresh Calculation" 
                            icon="pi pi-refresh" 
                            (click)="refreshCalculation()"
                            class="p-button-outlined">
                        </button>
                    </div>
                </div>

                <div *ngIf="!loading() && !premiumResult()" class="empty-state">
                    <i class="pi pi-calculator" style="font-size: 3rem; color: var(--text-color-secondary);"></i>
                    <p>No premium calculation available</p>
                    <button 
                        pButton 
                        label="Calculate Premium" 
                        icon="pi pi-calculator" 
                        (click)="refreshCalculation()">
                    </button>
                </div>
            </p-card>
        </div>
    `,
    styles: [`
        .premium-calculator {
            max-width: 900px;
            margin: 0 auto;
        }

        .loading-state {
            text-align: center;
            padding: 3rem;
        }

        .total-premium-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 2rem;
        }

        .premium-label {
            font-size: 1rem;
            opacity: 0.9;
            margin-bottom: 0.5rem;
        }

        .premium-amount {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }

        .premium-note {
            font-size: 0.9rem;
            opacity: 0.8;
        }

        .breakdown-section {
            margin: 2rem 0;
        }

        .breakdown-section h4 {
            margin-bottom: 1rem;
            color: var(--text-color);
        }

        .text-right {
            text-align: right;
        }

        .summary-row td {
            border-top: 2px solid var(--surface-border);
            padding-top: 1rem !important;
        }

        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }

        .summary-card {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
        }

        .summary-label {
            font-size: 0.9rem;
            color: var(--text-color-secondary);
            margin-bottom: 0.5rem;
        }

        .summary-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: var(--primary-color);
        }

        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
        }

        .empty-state {
            text-align: center;
            padding: 3rem;
        }

        .empty-state i {
            display: block;
            margin-bottom: 1rem;
        }

        .empty-state p {
            color: var(--text-color-secondary);
            margin-bottom: 1.5rem;
        }
    `]
})
export class PremiumCalculatorComponent implements OnInit {
    @Input() memberId?: string;
    @Input() autoLoad: boolean = true;
    
    loading = signal(false);
    premiumResult = signal<any>(null);

    constructor(
        private messageService: MessageService
    ) {}

    ngOnInit() {
        if (this.autoLoad) {
            this.loadPremium();
        }
    }

    async loadPremium() {
        this.loading.set(true);
        try {
            // This will be implemented once service proxies are generated
            // const result = await this.premiumService.premiumCalculation_GetMyPremium();
            // this.premiumResult.set(result);
            
            // Temporary mock data for demonstration
            this.premiumResult.set({
                basePremium: 220,
                extendedFamilyPremium: 90,
                totalMonthlyPremium: 310,
                message: 'Premium calculated for R10,000 cover with 2 dependents and 1 extended family member.',
                breakdown: [
                    {
                        description: 'Base Premium - R10,000 Cover',
                        amount: 220,
                        category: 'Base',
                        details: '1-5 dependents under age 65 (2 dependents)'
                    },
                    {
                        description: 'Extended Family - John Doe',
                        amount: 90,
                        category: 'ExtendedFamily',
                        details: 'Age 45 (23-64), R10,000 cover'
                    }
                ]
            });
        } catch (error: any) {
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to calculate premium'
            });
        } finally {
            this.loading.set(false);
        }
    }

    refreshCalculation() {
        this.loadPremium();
    }
}
