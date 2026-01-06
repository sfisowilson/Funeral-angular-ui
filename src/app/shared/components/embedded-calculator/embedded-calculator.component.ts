import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';

export interface PremiumRate {
    ageFrom: number;
    ageTo: number;
    rate: number;
    category: string;
}

export interface CalculatorConfig {
    title?: string;
    showBreakdown?: boolean;
    autoCalculate?: boolean;
    basePremiumOptions?: { label: string; value: number; coverAmount: number }[];
    dependentRates?: PremiumRate[];
    extendedFamilyRates?: PremiumRate[];
    watchFieldKeys?: string[]; // Field keys to watch for auto-calculation
}

export interface CalculatorResult {
    totalMonthlyPremium: number;
    basePremium: number;
    dependentsPremium: number;
    extendedFamilyPremium: number;
    coverAmount: number;
    dependentsCount: number;
    extendedFamilyCount: number;
    dependentBreakdown?: any[];
    extendedFamilyBreakdown?: any[];
}

@Component({
    selector: 'app-embedded-calculator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        InputNumberModule,
        ButtonModule,
        TableModule,
        DropdownModule
    ],
    template: `
        <div class="embedded-calculator">
            <p-card [header]="config().title || 'Your Estimated Premium'">
                <div *ngIf="config().autoCalculate" class="auto-calc-notice">
                    <i class="pi pi-info-circle"></i>
                    <span>Premium automatically calculated based on your selections</span>
                </div>

                <!-- Results Section -->
                <div *ngIf="result()" class="calculator-results mt-4">
                    <div class="total-premium-display">
                        <div class="premium-label">Estimated Monthly Premium</div>
                        <div class="premium-amount">R{{ result()!.totalMonthlyPremium | number:'1.2-2' }}</div>
                    </div>

                    <!-- Breakdown Table -->
                    <div *ngIf="config().showBreakdown !== false" class="breakdown-section mt-3">
                        <h6>Premium Breakdown</h6>
                        <p-table [value]="getBreakdownData()" styleClass="p-datatable-sm">
                            <ng-template pTemplate="header">
                                <tr>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th class="text-end">Amount</th>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="body" let-item>
                                <tr>
                                    <td>{{ item.label }}</td>
                                    <td>{{ item.quantity }}</td>
                                    <td class="text-end">R{{ item.amount | number:'1.2-2' }}</td>
                                </tr>
                            </ng-template>
                            <ng-template pTemplate="footer">
                                <tr>
                                    <td colspan="2"><strong>Total Monthly Premium</strong></td>
                                    <td class="text-end"><strong>R{{ result()!.totalMonthlyPremium | number:'1.2-2' }}</strong></td>
                                </tr>
                            </ng-template>
                        </p-table>
                    </div>
                </div>

                <!-- Empty State -->
                <div *ngIf="!result()" class="empty-state text-center py-4">
                    <i class="pi pi-calculator" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="mt-2 text-muted">Configure your coverage and click "Calculate Premium"</p>
                </div>
            </p-card>
        </div>
    `,
    styles: [`
        .embedded-calculator {
            width: 100%;
        }

        .auto-calc-notice {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1rem;
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            border-radius: 4px;
            margin-bottom: 1rem;
            font-size: 0.9rem;
            color: #0d47a1;
        }

        .calculator-inputs {
            padding: 1rem;
            background-color: #f8f9fa;
            border-radius: 8px;
        }

        .field-label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #333;
        }

        .form-text {
            display: block;
            margin-top: 0.25rem;
            font-size: 0.875rem;
        }

        .calculator-results {
            border-top: 1px solid #e0e0e0;
            padding-top: 1rem;
        }

        .total-premium-display {
            text-align: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .premium-label {
            font-size: 0.95rem;
            opacity: 0.95;
            margin-bottom: 0.5rem;
        }

        .premium-amount {
            font-size: 2.5rem;
            font-weight: 700;
        }

        .breakdown-section h6 {
            font-weight: 600;
            margin-bottom: 1rem;
            color: #333;
        }

        .empty-state {
            padding: 2rem;
        }

        :host ::ng-deep .p-inputnumber {
            width: 100%;
        }

        :host ::ng-deep .p-inputnumber-input {
            width: 100%;
        }

        :host ::ng-deep .p-dropdown {
            width: 100%;
        }
    `]
})
export class EmbeddedCalculatorComponent implements OnInit, OnChanges {
    @Input() config = signal<CalculatorConfig>({
        title: 'Premium Calculator',
        showBreakdown: true,
        autoCalculate: true,
        basePremiumOptions: [
            { label: 'R5,000 Cover', value: 50, coverAmount: 5000 },
            { label: 'R10,000 Cover', value: 100, coverAmount: 10000 },
            { label: 'R15,000 Cover', value: 150, coverAmount: 15000 },
            { label: 'R20,000 Cover', value: 200, coverAmount: 20000 },
            { label: 'R25,000 Cover', value: 250, coverAmount: 25000 }
        ],
        dependentRates: [
            { ageFrom: 0, ageTo: 5, rate: 15, category: 'Child (0-5)' },
            { ageFrom: 6, ageTo: 17, rate: 20, category: 'Child (6-17)' },
            { ageFrom: 18, ageTo: 64, rate: 30, category: 'Adult (18-64)' },
            { ageFrom: 65, ageTo: 120, rate: 50, category: 'Senior (65+)' }
        ],
        extendedFamilyRates: [
            { ageFrom: 0, ageTo: 17, rate: 25, category: 'Child' },
            { ageFrom: 18, ageTo: 64, rate: 40, category: 'Adult' },
            { ageFrom: 65, ageTo: 120, rate: 60, category: 'Senior' }
        ],
        watchFieldKeys: ['dependents']
    });

    @Input() value: CalculatorResult | null = null;
    @Input() formData: any = {}; // Watch form data for auto-calculation
    @Output() valueChange = new EventEmitter<CalculatorResult>();
    @Output() calculated = new EventEmitter<CalculatorResult>();

    result = signal<CalculatorResult | null>(null);
    
    // Calculation inputs
    selectedBasePremium: number = 100; // Default R10,000 cover
    dependents: any[] = [];
    extendedFamily: any[] = [];

    basePremiumOptions = signal<{ label: string; value: number; coverAmount: number }[]>([
        { label: 'R5,000 Cover', value: 50, coverAmount: 5000 },
        { label: 'R10,000 Cover', value: 100, coverAmount: 10000 },
        { label: 'R15,000 Cover', value: 150, coverAmount: 15000 },
        { label: 'R20,000 Cover', value: 200, coverAmount: 20000 },
        { label: 'R25,000 Cover', value: 250, coverAmount: 25000 }
    ]);

    ngOnInit() {
        // Use provided config or defaults
        if (this.config().basePremiumOptions) {
            this.basePremiumOptions.set(this.config().basePremiumOptions!);
        }

        // Load from value if provided
        if (this.value) {
            this.result.set(this.value);
            this.selectedBasePremium = this.value.basePremium;
        }

        // Auto-calculate on init if form data is present
        if (this.config().autoCalculate && this.formData) {
            this.extractFormDataAndCalculate();
        }
    }
    
    ngOnChanges(changes: SimpleChanges) {
        // When form data changes, recalculate
        if (changes['formData'] && !changes['formData'].firstChange && this.config().autoCalculate) {
            this.extractFormDataAndCalculate();
        }
    }
    
    extractFormDataAndCalculate() {
        // Extract dependents from form data
        const watchKeys = this.config().watchFieldKeys || ['dependents'];
        this.dependents = [];
        this.extendedFamily = [];

        watchKeys.forEach(key => {
            if (this.formData[key]) {
                let items = this.formData[key];
                
                // Parse if it's a JSON string
                if (typeof items === 'string') {
                    try {
                        items = JSON.parse(items);
                    } catch (e) {
                        console.error('Error parsing form data:', e);
                        return;
                    }
                }

                if (Array.isArray(items)) {
                    items.forEach((item: any) => {
                        const age = this.calculateAge(item.dateOfBirth || item.dob || item.idNumber);
                        const relationship = (item.relationship || '').toLowerCase();
                        
                        if (relationship.includes('extended') || relationship.includes('family')) {
                            this.extendedFamily.push({ ...item, age });
                        } else {
                            this.dependents.push({ ...item, age });
                        }
                    });
                }
            }
        });

        // Auto-calculate
        this.calculate();
    }

    calculateAge(dateOrId: string | Date): number {
        if (!dateOrId) return 0;

        let birthDate: Date | null = null;

        // Try to parse SA ID number (first 6 digits are YYMMDD)
        if (typeof dateOrId === 'string' && dateOrId.length === 13 && /^\d+$/.test(dateOrId)) {
            const year = parseInt(dateOrId.substring(0, 2), 10);
            const month = parseInt(dateOrId.substring(2, 4), 10) - 1;
            const day = parseInt(dateOrId.substring(4, 6), 10);
            
            let fullYear = year < 50 ? 2000 + year : 1900 + year;
            birthDate = new Date(fullYear, month, day);
        } else if (dateOrId instanceof Date) {
            birthDate = dateOrId;
        } else if (typeof dateOrId === 'string') {
            birthDate = new Date(dateOrId);
        }

        if (!birthDate || isNaN(birthDate.getTime())) {
            return 0;
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return Math.max(0, age);
    }

    getPremiumForAge(age: number, isExtendedFamily: boolean = false): number {
        const rates = isExtendedFamily 
            ? (this.config().extendedFamilyRates || [])
            : (this.config().dependentRates || []);

        const rate = rates.find(r => age >= r.ageFrom && age <= r.ageTo);
        return rate ? rate.rate : (isExtendedFamily ? 40 : 30); // Fallback rates
    }

    calculate() {
        const basePremium = this.selectedBasePremium;
        
        // Calculate dependent premiums based on age
        let dependentsPremium = 0;
        let dependentBreakdown: any[] = [];
        
        this.dependents.forEach(dep => {
            const premium = this.getPremiumForAge(dep.age, false);
            dependentsPremium += premium;
            dependentBreakdown.push({
                name: dep.firstName || dep.name || 'Dependent',
                age: dep.age,
                premium: premium,
                relationship: dep.relationship
            });
        });

        // Calculate extended family premiums based on age
        let extendedFamilyPremium = 0;
        let extendedFamilyBreakdown: any[] = [];
        
        this.extendedFamily.forEach(member => {
            const premium = this.getPremiumForAge(member.age, true);
            extendedFamilyPremium += premium;
            extendedFamilyBreakdown.push({
                name: member.firstName || member.name || 'Family Member',
                age: member.age,
                premium: premium,
                relationship: member.relationship
            });
        });

        const totalMonthlyPremium = basePremium + dependentsPremium + extendedFamilyPremium;

        const calculatorResult: CalculatorResult = {
            totalMonthlyPremium,
            basePremium,
            dependentsPremium,
            extendedFamilyPremium,
            coverAmount: this.getSelectedCoverAmount(),
            dependentsCount: this.dependents.length,
            extendedFamilyCount: this.extendedFamily.length,
            dependentBreakdown,
            extendedFamilyBreakdown
        };

        this.result.set(calculatorResult);
        this.valueChange.emit(calculatorResult);
        this.calculated.emit(calculatorResult);
    }

    getSelectedCoverAmount(): number {
        const option = this.basePremiumOptions().find(opt => opt.value === this.selectedBasePremium);
        return option?.coverAmount || 0;
    }

    getBreakdownData(): any[] {
        const result = this.result();
        if (!result) return [];

        const breakdown: any[] = [
            {
                label: 'Base Premium',
                quantity: `R${this.getSelectedCoverAmount().toLocaleString()} cover`,
                amount: result.basePremium
            }
        ];

        // Add dependent details
        if (this.dependents.length > 0) {
            this.dependents.forEach(dep => {
                const premium = this.getPremiumForAge(dep.age, false);
                breakdown.push({
                    label: `${dep.firstName || dep.name || 'Dependent'} (${dep.relationship || 'Dependent'})`,
                    quantity: `Age ${dep.age}`,
                    amount: premium
                });
            });
        } else {
            breakdown.push({
                label: 'Dependents',
                quantity: '0 dependents',
                amount: 0
            });
        }

        // Add extended family details
        if (this.extendedFamily.length > 0) {
            this.extendedFamily.forEach(member => {
                const premium = this.getPremiumForAge(member.age, true);
                breakdown.push({
                    label: `${member.firstName || member.name || 'Family Member'}`,
                    quantity: `Age ${member.age}`,
                    amount: premium
                });
            });
        } else {
            breakdown.push({
                label: 'Extended Family',
                quantity: '0 members',
                amount: 0
            });
        }

        return breakdown;
    }
}
