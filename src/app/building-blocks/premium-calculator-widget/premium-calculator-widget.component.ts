import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
    PremiumCalculationServiceProxy,
    PremiumCalculationSettingsDto,
    PolicyCoverRowDto,
    DependentCountTierDto,
    PolicyCoverAgeBracketDto,
    ExtendedFamilyBenefitRowDto
} from '../../core/services/service-proxies';

interface AgeBracketInput {
    maxAge: number;
    label: string;
    count: number;
    isExtendedFamily?: boolean;
}

interface ExtendedFamilyBracketInput {
    minAge: number;
    maxAge: number;
    label: string;
    count: number;
    premium: number;
}

interface BreakdownItem {
    label: string;
    amount: number;
    showAmount?: boolean; // Whether to show the amount column
}

@Component({
    selector: 'app-premium-calculator-widget',
    standalone: true,
    imports: [CommonModule, FormsModule],
    providers: [PremiumCalculationServiceProxy],
    template: `
        <div [ngStyle]="{
            backgroundColor: config.settings?.backgroundColor,
            padding: config.settings?.padding + 'px'
        }">
            <div class="contents">
                <div class="text-center mb-4">
                    <h2 [ngStyle]="{
                        fontSize: config.settings?.titleSize + 'px',
                        color: config.settings?.titleColor,
                        fontWeight: 'bold',
                        marginBottom: '16px'
                    }">{{ config.settings?.title }}</h2>
                    <p [ngStyle]="{
                        fontSize: config.settings?.subtitleSize + 'px',
                        color: config.settings?.subtitleColor
                    }">{{ config.settings?.subtitle }}</p>
                </div>

                <div class="card" [ngStyle]="{
                    backgroundColor: config.settings?.cardBackgroundColor
                }">
                    <div class="card-body">
                        <!-- Cover Amount Selection -->
                        <div class="mb-4">
                            <label class="form-label fw-semibold" [ngStyle]="{ color: config.settings?.labelColor }">
                                Select Cover Amount
                            </label>
                            <select 
                                class="form-select"
                                [(ngModel)]="selectedCoverRow" 
                                (ngModelChange)="onCoverAmountChange()">
                                <option [ngValue]="null">Choose cover amount</option>
                                <option *ngFor="let option of coverOptions" [ngValue]="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>

                        <!-- Immediate Family Age Bracket Inputs -->
                        <div class="mb-4" *ngIf="ageBracketInputs.length > 0">
                            <label class="form-label fw-semibold" [ngStyle]="{ color: config.settings?.labelColor }">
                                Immediate Family - Enter Number of People by Age Group
                            </label>
                            <div class="row g-3">
                                <div *ngFor="let bracket of ageBracketInputs" class="col-md-6">
                                    <label class="form-label small" [ngStyle]="{ color: config.settings?.labelColor }">
                                        {{ bracket.label }}
                                    </label>
                                    <input 
                                        type="number" 
                                        class="form-control"
                                        [(ngModel)]="bracket.count" 
                                        [min]="0" 
                                        [max]="getMaxAllowedDependents()"
                                        (ngModelChange)="onDependentCountChange()">
                                </div>
                            </div>
                        </div>

                        <!-- Extended Family Age Bracket Inputs -->
                        <div class="mb-4" *ngIf="extendedFamilyBracketInputs.length > 0">
                            <label class="form-label fw-semibold d-flex align-items-center" [ngStyle]="{ color: config.settings?.labelColor }">
                                Extended Family - Enter Number of People by Age Group
                                <span class="badge bg-warning text-dark ms-2">
                                    Max {{ settings()?.maxExtendedFamilyMembers || 4 }} members
                                </span>
                            </label>
                            <div class="row g-3">
                                <div *ngFor="let bracket of extendedFamilyBracketInputs" class="col-md-6">
                                    <label class="form-label small d-flex align-items-center gap-2" [ngStyle]="{ color: config.settings?.labelColor }">
                                        {{ bracket.label }}
                                        <span class="text-muted small">
                                            (+{{ config.settings?.currency }}{{ bracket.premium }} per person)
                                        </span>
                                    </label>
                                    <input 
                                        type="number" 
                                        class="form-control"
                                        [(ngModel)]="bracket.count" 
                                        [min]="0" 
                                        [max]="settings()?.maxExtendedFamilyMembers || 4"
                                        (ngModelChange)="onExtendedFamilyCountChange()">
                                </div>
                            </div>
                        </div>

                        <!-- Result Display -->
                        <div *ngIf="calculatedPremium() !== null" class="mt-4 p-4 rounded border"
                            [ngStyle]="{
                                backgroundColor: config.settings?.resultBackgroundColor,
                                borderColor: config.settings?.resultBorderColor,
                                borderWidth: '2px'
                            }">
                            <div class="text-center">
                                <p class="fs-5 mb-2" [ngStyle]="{ color: config.settings?.resultLabelColor }">
                                    {{ config.settings?.resultLabel }}
                                </p>
                                <p class="display-3 fw-bold mb-1" [ngStyle]="{ color: config.settings?.resultAmountColor }">
                                    {{ config.settings?.currency }}{{ calculatedPremium()!.toFixed(2) }}
                                </p>
                                <p class="small" [ngStyle]="{ color: config.settings?.resultPeriodColor }">
                                    {{ config.settings?.resultPeriod }}
                                </p>

                                <!-- Breakdown -->
                                <div *ngIf="breakdown().length > 0" class="mt-3 pt-3 border-top"
                                    [ngStyle]="{ borderColor: config.settings?.resultBorderColor }">
                                    <p class="fw-semibold mb-2" [ngStyle]="{ color: config.settings?.resultLabelColor }">
                                        Breakdown:
                                    </p>
                                    <div *ngFor="let item of breakdown()" class="d-flex justify-content-between py-1">
                                        <span [ngStyle]="{ color: config.settings?.resultLabelColor }">{{ item.label }}</span>
                                        <span *ngIf="item.showAmount !== false" [ngStyle]="{ color: config.settings?.resultAmountColor }">{{ config.settings?.currency }}{{ item.amount.toFixed(2) }}</span>
                                    </div>
                                </div>

                                <!-- Sign Up Button -->
                                <div class="mt-4">
                                    <button 
                                        type="button"
                                        class="btn btn-lg px-4"
                                        [ngStyle]="{
                                                backgroundColor: config.settings?.signupButtonColor || 'var(--success-color, #28a745)',
                                                borderColor: config.settings?.signupButtonColor || 'var(--success-color, #28a745)',
                                                color: config.settings?.signupButtonTextColor || 'var(--primary-contrast-color, #ffffff)'
                                        }"
                                        (click)="navigateToSignup()">
                                        {{ config.settings?.signupButtonText || 'Sign Up Now' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .card {
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .form-control, .form-select {
            width: 100%;
        }
    `]
})
export class PremiumCalculatorWidgetComponent implements OnInit {
    @Input() config: any;

    settings = signal<PremiumCalculationSettingsDto | null>(null);
    coverOptions: any[] = [];
    selectedCoverRow: PolicyCoverRowDto | null = null;
    
    tierOptions: any[] = [];
    selectedTier: DependentCountTierDto | null = null;
    
    ageBracketInputs: AgeBracketInput[] = [];
    extendedFamilyBracketInputs: ExtendedFamilyBracketInput[] = [];
    
    calculatedPremium = signal<number | null>(null);
    breakdown = signal<BreakdownItem[]>([]);

    constructor(
        private premiumService: PremiumCalculationServiceProxy,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadPremiumSettings();
    }

    loadPremiumSettings(): void {
        console.log('=== LOADING PREMIUM SETTINGS ===');
        this.premiumService.premiumCalculation_GetSettings().subscribe({
            next: (settings) => {
                console.log('Settings loaded:', settings);
                this.settings.set(settings);
                this.buildCoverOptions();
            },
            error: (error) => {
                console.error('Error loading premium settings:', error);
                // Failed to load premium settings
            }
        });
    }

    buildCoverOptions(): void {
        console.log('=== BUILDING COVER OPTIONS ===');
        const rows = this.settings()?.policyCoverTable?.rows || [];
        console.log('Rows from settings:', rows);
        const currency = this.config?.currency || 'R';
        console.log('Currency:', currency);
        this.coverOptions = rows.map(row => ({
            label: `${currency}${row.coverAmount?.toLocaleString()} Cover`,
            value: row
        }));
        console.log('Cover options built:', this.coverOptions);
    }

    onCoverAmountChange(): void {
        console.log('=== COVER AMOUNT CHANGED ===');
        console.log('Selected cover row:', this.selectedCoverRow);
        
        this.calculatedPremium.set(null);
        this.breakdown.set([]);
        
        if (!this.selectedCoverRow) {
            this.tierOptions = [];
            this.ageBracketInputs = [];
            this.extendedFamilyBracketInputs = [];
            return;
        }

        // Build tier options - always auto-select based on dependent count
        const tiers = this.selectedCoverRow.dependentCountTiers || [];
        console.log('Tiers from cover row:', tiers);
        console.log('Tiers length:', tiers.length);
        
        if (tiers.length > 0) {
            console.log('Tiers detected, building unified age brackets from all tiers');
            // Auto-select the first tier initially
            this.selectedTier = tiers[0];
            console.log('Auto-selected tier:', this.selectedTier);
            // Build unified age brackets from ALL tiers
            this.buildAgeBracketInputsFromAllTiers();
            // Build extended family brackets
            this.buildExtendedFamilyBracketInputs();
        } else {
            console.log('No tiers - using legacy');
            // Fallback to legacy age brackets
            this.selectedTier = null;
            this.buildLegacyAgeBracketInputs();
        }
    }

    onDependentCountChange(): void {
        const totalDependents = this.getTotalDependentCount();
        const maxAllowed = this.getMaxAllowedDependents();
        
        // If total exceeds max, show warning
        if (totalDependents > maxAllowed) {
            console.warn(`Too Many Dependents: Maximum allowed dependents for this cover is ${maxAllowed}. Please reduce the count.`);
            // Clear results if invalid
            this.calculatedPremium.set(null);
            this.breakdown.set([]);
        } else if (this.canCalculate()) {
            // Auto-calculate if valid
            this.calculatePremium();
        } else {
            // Clear results if not ready to calculate
            this.calculatedPremium.set(null);
            this.breakdown.set([]);
        }
    }

    onExtendedFamilyCountChange(): void {
        const totalExtended = this.getTotalExtendedFamilyCount();
        const maxAllowed = this.settings()?.maxExtendedFamilyMembers || 4;
        
        // If total exceeds max, show warning
        if (totalExtended > maxAllowed) {
            console.warn(`Too Many Extended Family Members: Maximum allowed extended family members is ${maxAllowed}. Please reduce the count.`);
            // Clear results if invalid
            this.calculatedPremium.set(null);
            this.breakdown.set([]);
        } else if (this.canCalculate()) {
            // Auto-calculate if valid
            this.calculatePremium();
        } else {
            // Clear results if not ready to calculate
            this.calculatedPremium.set(null);
            this.breakdown.set([]);
        }
    }

    selectAppropriateTier(): void {
        if (!this.selectedCoverRow) return;
        
        const tiers = this.selectedCoverRow.dependentCountTiers || [];
        if (tiers.length === 0) return;
        
        const totalDependents = this.getTotalDependentCount();
        console.log('Auto-selecting tier for', totalDependents, 'dependents');
        console.log('Available tiers:', tiers);
        
        // Find the tier that matches the dependent count
        const matchingTier = tiers.find(t => 
            totalDependents >= (t.minDependents || 0) && 
            totalDependents <= (t.maxDependents || 999)
        );
        
        if (matchingTier) {
            console.log('Found matching tier:', matchingTier);
            this.selectedTier = matchingTier;
        } else {
            console.log('No matching tier found, using first tier');
            this.selectedTier = tiers[0];
        }
    }

    buildAgeBracketInputsFromAllTiers(): void {
        console.log('=== BUILDING AGE BRACKET INPUTS FROM ALL TIERS ===');
        
        if (!this.selectedCoverRow) {
            this.ageBracketInputs = [];
            return;
        }

        const tiers = this.selectedCoverRow.dependentCountTiers || [];
        console.log('All tiers:', tiers);
        
        if (tiers.length === 0) {
            this.ageBracketInputs = [];
            return;
        }

        // Collect all unique age brackets from all tiers
        const allBracketsMap = new Map<number, { label: string; maxAge: number }>();
        
        tiers.forEach((tier, tierIndex) => {
            console.log(`Processing tier ${tierIndex}:`, tier);
            const ageBrackets = tier.ageBrackets;
            
            if (ageBrackets && Object.keys(ageBrackets).length > 0) {
                Object.entries(ageBrackets).forEach(([key, value]) => {
                    const maxAge = parseInt(key);
                    // Use the label from the first tier that has this age bracket
                    if (!allBracketsMap.has(maxAge)) {
                        allBracketsMap.set(maxAge, {
                            maxAge: maxAge,
                            label: value.label || `Under ${maxAge + 1}`
                        });
                    }
                });
            }
        });

        console.log('Unique age brackets map:', allBracketsMap);

        // Convert map to sorted array
        const baseBrackets = Array.from(allBracketsMap.values())
            .map(bracket => ({
                maxAge: bracket.maxAge,
                label: bracket.label,
                count: 0,
                isExtendedFamily: false
            }))
            .sort((a, b) => a.maxAge - b.maxAge);

        console.log('Unified age brackets created:', baseBrackets);
        this.ageBracketInputs = baseBrackets;
    }

    buildLegacyAgeBracketInputs(): void {
        // Fallback for legacy structure (if no tiers configured)
        this.ageBracketInputs = [
            { maxAge: 64, label: 'Under 65', count: 0 },
            { maxAge: 69, label: 'Under 70', count: 0 },
            { maxAge: 74, label: 'Under 75', count: 0 },
            { maxAge: 999, label: '75 and above', count: 0 }
        ];
    }

    buildExtendedFamilyBracketInputs(): void {
        console.log('=== BUILDING EXTENDED FAMILY BRACKET INPUTS ===');
        
        if (!this.selectedCoverRow || !this.settings()) {
            this.extendedFamilyBracketInputs = [];
            return;
        }

        const extendedFamilyRows = this.settings()?.extendedFamilyTable?.rows || [];
        const coverAmount = this.selectedCoverRow.coverAmount;
        
        console.log('Extended family rows:', extendedFamilyRows);
        console.log('Cover amount:', coverAmount);
        
        if (extendedFamilyRows.length === 0) {
            this.extendedFamilyBracketInputs = [];
            return;
        }

        // Map cover amount to the premium field name
        const premiumFieldMap: { [key: number]: keyof ExtendedFamilyBenefitRowDto } = {
            5000: 'premium_5000_Cover',
            10000: 'premium_10000_Cover',
            15000: 'premium_15000_Cover',
            20000: 'premium_20000_Cover',
            25000: 'premium_25000_Cover'
        };

        const premiumField = premiumFieldMap[coverAmount || 0];
        if (!premiumField) {
            console.log('No premium field found for cover amount:', coverAmount);
            this.extendedFamilyBracketInputs = [];
            return;
        }

        // Build extended family bracket inputs
        this.extendedFamilyBracketInputs = extendedFamilyRows.map(row => ({
            minAge: row.minAge || 0,
            maxAge: row.maxAge || 0,
            label: row.ageRange || `${row.minAge}-${row.maxAge}`,
            count: 0,
            premium: (row[premiumField] as number) || 0
        }));

        console.log('Extended family bracket inputs created:', this.extendedFamilyBracketInputs);
    }

    getMaxAllowedDependents(): number {
        if (!this.selectedCoverRow) return 5; // Default fallback
        const tiers = this.selectedCoverRow.dependentCountTiers || [];
        if (tiers.length === 0) return 5; // Legacy default
        return Math.max(...tiers.map(t => t.maxDependents || 5));
    }

    getTotalDependentCount(): number {
        return this.ageBracketInputs.reduce((sum, b) => sum + b.count, 0);
    }

    getTotalExtendedFamilyCount(): number {
        return this.extendedFamilyBracketInputs.reduce((sum, b) => sum + b.count, 0);
    }

    canCalculate(): boolean {
        const totalDependents = this.getTotalDependentCount();
        const totalExtended = this.getTotalExtendedFamilyCount();
        const maxExtended = this.settings()?.maxExtendedFamilyMembers || 4;
        
        return this.selectedCoverRow !== null && 
               this.ageBracketInputs.length > 0 &&
               totalDependents > 0 &&
               totalDependents <= this.getMaxAllowedDependents() &&
               totalExtended <= maxExtended;
    }

    calculatePremium(): void {
        if (!this.selectedCoverRow) {
            console.error('No cover row selected');
            return;
        }

        let basePremium = 0;
        const breakdownItems: BreakdownItem[] = [];

        // Calculate base premium based on the highest age bracket with dependents
        const totalDependents = this.ageBracketInputs.reduce((sum, b) => sum + b.count, 0);
        
        console.log('Total dependents:', totalDependents);
        console.log('Age bracket inputs:', this.ageBracketInputs);
        console.log('Selected cover row:', this.selectedCoverRow);
        console.log('Selected tier:', this.selectedTier);
        
        if (totalDependents > 0) {
            // Auto-select the appropriate tier based on dependent count
            this.selectAppropriateTier();
            
            console.log('Selected tier AFTER selectAppropriateTier:', this.selectedTier);
            console.log('Selected tier ageBrackets:', this.selectedTier?.ageBrackets);
            
            const maxBaseAge = Math.max(...this.ageBracketInputs.filter(b => b.count > 0).map(b => b.maxAge));
            console.log('Max base age:', maxBaseAge);
            
            // Add total dependent count to breakdown (informational, no amount shown)
            breakdownItems.push({
                label: `Total Dependents: ${totalDependents}`,
                amount: 0,
                showAmount: false
            });
            
            // Add breakdown for each age group with dependents (show info only, no multiplication)
            const dependentsWithCounts = this.ageBracketInputs.filter(b => b.count > 0);
            
            // Get premium for each age bracket from the selected tier
            if (this.selectedTier?.ageBrackets) {
                dependentsWithCounts.forEach(bracket => {
                    // Find the premium for this specific age bracket
                    const bracketPremium = this.selectedTier!.ageBrackets![bracket.maxAge]?.premium || 0;
                    
                    breakdownItems.push({
                        label: `  ${bracket.label}: ${bracket.count} × ${this.config?.currency || 'R'}${bracketPremium}`,
                        amount: 0,
                        showAmount: false
                    });
                });
            } else {
                // For legacy, just show counts without individual calculations
                dependentsWithCounts.forEach(bracket => {
                    breakdownItems.push({
                        label: `  ${bracket.label}: ${bracket.count} ${bracket.count === 1 ? 'person' : 'people'}`,
                        amount: 0,
                        showAmount: false
                    });
                });
            }

            // Add extended family to breakdown
            const extendedWithCounts = this.extendedFamilyBracketInputs.filter(b => b.count > 0);
            if (extendedWithCounts.length > 0) {
                const totalExtended = this.getTotalExtendedFamilyCount();
                breakdownItems.push({
                    label: `Extended Family Members: ${totalExtended}`,
                    amount: 0,
                    showAmount: false
                });
                
                extendedWithCounts.forEach(bracket => {
                    const extendedCost = bracket.count * bracket.premium;
                    breakdownItems.push({
                        label: `  ${bracket.label}: ${bracket.count} × ${this.config?.currency || 'R'}${bracket.premium}`,
                        amount: extendedCost,
                        showAmount: true
                    });
                });
            }
            
            if (this.selectedTier?.ageBrackets) {
                console.log('Using tier-based calculation');
                // Use tier-based calculation - find the premium for the HIGHEST age bracket
                const sortedBrackets = Object.entries(this.selectedTier.ageBrackets || {})
                    .map(([key, value]) => ({ key: parseInt(key), value }))
                    .sort((a, b) => a.key - b.key);

                console.log('Sorted brackets:', sortedBrackets);
                const matchingBracket = sortedBrackets.find(b => maxBaseAge <= b.key);
                console.log('Matching bracket:', matchingBracket);
                console.log('Matching bracket value:', matchingBracket?.value);
                console.log('Matching bracket value.premium:', matchingBracket?.value?.premium);
                
                if (matchingBracket) {
                    basePremium = matchingBracket.value.premium || 0;
                    console.log('Base premium from bracket:', basePremium);
                }
            } else {
                console.log('Using legacy calculation');
                // Legacy calculation - use hardcoded fields
                if (maxBaseAge <= 64) {
                    basePremium = this.selectedCoverRow.premium_1To5Dependents_Under65 || 0;
                    console.log('Under 65 premium:', basePremium);
                } else if (maxBaseAge <= 69) {
                    basePremium = this.selectedCoverRow.premium_1To5Dependents_Under70 || 0;
                    console.log('Under 70 premium:', basePremium);
                } else if (maxBaseAge <= 74) {
                    basePremium = this.selectedCoverRow.premium_1To5Dependents_Under75 || 0;
                    console.log('Under 75 premium:', basePremium);
                } else {
                    basePremium = this.selectedCoverRow.premium_1To5Dependents_75Plus || 0;
                    console.log('75+ premium:', basePremium);
                }
            }
        }
        
        // Add extended family premiums
        let extendedFamilyPremium = 0;
        this.extendedFamilyBracketInputs.forEach(bracket => {
            extendedFamilyPremium += bracket.count * bracket.premium;
        });
        
        const totalPremium = basePremium + extendedFamilyPremium;
        
        console.log('Base premium:', basePremium);
        console.log('Extended family premium:', extendedFamilyPremium);
        console.log('Total premium:', totalPremium);
        
        // Add the premium totals to breakdown after calculating everything
        if (basePremium > 0) {
            if (this.selectedTier?.ageBrackets) {
                // For tier-based, show subtotal for immediate family
                const tierLabel = this.selectedTier.label || `${this.selectedTier.minDependents}-${this.selectedTier.maxDependents} dependents`;
                breakdownItems.push({
                    label: `Immediate Family Subtotal (${tierLabel})`,
                    amount: basePremium,
                    showAmount: true
                });
            } else {
                // Legacy - determine label based on maxBaseAge
                const maxBaseAge = Math.max(...this.ageBracketInputs.filter(b => b.count > 0).map(b => b.maxAge));
                let ageLabel = '';
                if (maxBaseAge <= 64) ageLabel = 'Under 65';
                else if (maxBaseAge <= 69) ageLabel = 'Under 70';
                else if (maxBaseAge <= 74) ageLabel = 'Under 75';
                else ageLabel = '75+';
                
                breakdownItems.push({ 
                    label: `Base Premium (1-5 dependents, ${ageLabel})`, 
                    amount: basePremium,
                    showAmount: true
                });
            }
        }
        
        // Add total line at the end
        if (breakdownItems.length > 0) {
            breakdownItems.push({
                label: `Total Monthly Premium`,
                amount: totalPremium,
                showAmount: true
            });
        }
        
        this.calculatedPremium.set(totalPremium);
        this.breakdown.set(breakdownItems);
    }

    navigateToSignup(): void {
        const signupUrl = this.config.settings?.signupUrl || '/auth/register';
        this.router.navigateByUrl(signupUrl);
    }
}
