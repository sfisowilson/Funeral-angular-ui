import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PremiumCalculationService } from '../../core/services/generated/premium-calculation/premium-calculation.service';
import {
    PremiumCalculationSettingsDto,
    PolicyCoverRowDto,
    DependentCountTierDto,
    PolicyCoverAgeBracketDto,
    ExtendedFamilyBenefitRowDto
} from '../../core/models';

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
    templateUrl: './premium-calculator-widget.component.html',    
    styleUrls: ['./premium-calculator-widget.component.css']
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
        private premiumService: PremiumCalculationService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadPremiumSettings();
    }

    loadPremiumSettings(): void {
        this.premiumService.getApiPremiumCalculationPremiumCalculationGetSettings().subscribe({
            next: (settings) => {
                this.settings.set(settings);
                this.buildCoverOptions();
            },
            error: (error: any) => {
                console.error('Error loading premium settings:', error);
                // Failed to load premium settings
            }
        });
    }

    buildCoverOptions(): void {
        const rows = (this.settings()?.policyCoverTable?.['rows'] as any[]) || [];
        const currency = this.config?.currency || 'R';
        this.coverOptions = rows.map((row: any) => ({
            label: `${currency}${row.coverAmount?.toLocaleString()} Cover`,
            value: row
        }));
    }

    onCoverAmountChange(): void {
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
        
        if (tiers.length > 0) {
            // Auto-select the first tier initially
            this.selectedTier = tiers[0] as any;
            // Build unified age brackets from ALL tiers
            this.buildAgeBracketInputsFromAllTiers();
            // Build extended family brackets
            this.buildExtendedFamilyBracketInputs();
        } else {
            // Fallback to legacy age brackets
            this.selectedTier = null;
            this.buildLegacyAgeBracketInputs();
        }
        
        // Trigger calculation if all conditions are met
        if (this.canCalculate()) {
            this.calculatePremium();
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
        
        // Find the tier that matches the dependent count
        const matchingTier = tiers.find(t => 
            totalDependents >= ((t as any)['minDependents'] || 0) && 
            totalDependents <= ((t as any)['maxDependents'] || 999)
        );
        
        if (matchingTier) {
            this.selectedTier = matchingTier as any;
        } else {
            this.selectedTier = tiers[0] as any;
        }
    }

    buildAgeBracketInputsFromAllTiers(): void {
        if (!this.selectedCoverRow) {
            this.ageBracketInputs = [];
            return;
        }

        const tiers = this.selectedCoverRow.dependentCountTiers || [];
        
        if (tiers.length === 0) {
            this.ageBracketInputs = [];
            return;
        }

        // Collect all unique age brackets from all tiers
        const allBracketsMap = new Map<number, { label: string; maxAge: number }>();
        
        tiers.forEach((tier, tierIndex) => {
            const ageBrackets = (tier as any)['ageBrackets'];
            
            if (ageBrackets && Object.keys(ageBrackets).length > 0) {
                Object.entries(ageBrackets as any).forEach(([key, value]) => {
                    const maxAge = parseInt(key);
                    const bracketValue = value as any;
                    // Use the label from the first tier that has this age bracket
                    if (!allBracketsMap.has(maxAge)) {
                        allBracketsMap.set(maxAge, {
                            maxAge: maxAge,
                            label: bracketValue.label || `Under ${maxAge + 1}`
                        });
                    }
                });
            }
        });

        // Convert map to sorted array
        const baseBrackets = Array.from(allBracketsMap.values())
            .map(bracket => ({
                maxAge: bracket.maxAge,
                label: bracket.label,
                count: 0,
                isExtendedFamily: false
            }))
            .sort((a, b) => a.maxAge - b.maxAge);

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
        
        if (!this.selectedCoverRow || !this.settings()) {
            this.extendedFamilyBracketInputs = [];
            return;
        }

        const extendedFamilyRows = (this.settings()?.extendedFamilyTable?.['rows'] as any[]) || [];
        const coverAmount = this.selectedCoverRow.coverAmount;
        
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
            this.extendedFamilyBracketInputs = [];
            return;
        }

        // Build extended family bracket inputs
        this.extendedFamilyBracketInputs = extendedFamilyRows.map((row: any) => ({
            minAge: row.minAge || 0,
            maxAge: row.maxAge || 0,
            label: row.ageRange || `${row.minAge}-${row.maxAge}`,
            count: 0,
            premium: (row[premiumField] as number) || 0
        }));
    }

    getMaxAllowedDependents(): number {
        if (!this.selectedCoverRow) return 5; // Default fallback
        const tiers = this.selectedCoverRow.dependentCountTiers || [];
        if (tiers.length === 0) return 5; // Legacy default
        return Math.max(...tiers.map((t: any) => t['maxDependents'] || 5));
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
            return;
        }

        let basePremium = 0;
        const breakdownItems: BreakdownItem[] = [];

        // Calculate base premium based on the highest age bracket with dependents
        const totalDependents = this.ageBracketInputs.reduce((sum, b) => sum + b.count, 0);
        
        if (totalDependents > 0) {
            // Auto-select the appropriate tier based on dependent count
            this.selectAppropriateTier();
            
            const maxBaseAge = Math.max(...this.ageBracketInputs.filter(b => b.count > 0).map(b => b.maxAge));
            
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
                    const bracketPremium = ((this.selectedTier as any)['ageBrackets']?.[bracket.maxAge] as any)?.['premium'] || 0;
                    
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
                // Use tier-based calculation - find the premium for the HIGHEST age bracket
                const sortedBrackets = Object.entries(this.selectedTier.ageBrackets as any || {})
                    .map(([key, value]) => ({ key: parseInt(key), value }))
                    .sort((a, b) => a.key - b.key);

                const matchingBracket = sortedBrackets.find(b => maxBaseAge <= b.key);
                const bracketValue = matchingBracket?.value as any;
                
                if (matchingBracket && bracketValue) {
                    basePremium = bracketValue.premium || 0;
                }
            } else {
                // Legacy calculation - use hardcoded fields
                if (maxBaseAge <= 64) {
                    basePremium = this.selectedCoverRow.premium_1To5Dependents_Under65 || 0;
                } else if (maxBaseAge <= 69) {
                    basePremium = this.selectedCoverRow.premium_1To5Dependents_Under70 || 0;
                } else if (maxBaseAge <= 74) {
                    basePremium = this.selectedCoverRow.premium_1To5Dependents_Under75 || 0;
                } else {
                    basePremium = this.selectedCoverRow.premium_1To5Dependents_75Plus || 0;
                }
            }
        }
        
        // Add extended family premiums
        let extendedFamilyPremium = 0;
        this.extendedFamilyBracketInputs.forEach(bracket => {
            extendedFamilyPremium += bracket.count * bracket.premium;
        });
        
        const totalPremium = basePremium + extendedFamilyPremium;
        
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
