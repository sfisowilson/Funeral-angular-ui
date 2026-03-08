import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EmbeddedCalculatorComponent, CalculatorConfig, CalculatorResult } from '../../shared/components/embedded-calculator/embedded-calculator.component';
import { WidgetConfig } from '../widget-config';
import { OnboardingCalculatorAggregatorService } from '../../core/services/onboarding-calculator-aggregator.service';

@Component({
    selector: 'app-onboarding-global-calculator-widget',
    standalone: true,
    imports: [CommonModule, EmbeddedCalculatorComponent],
    templateUrl: './onboarding-global-calculator-widget.component.html',
    styleUrls: ['./onboarding-global-calculator-widget.component.scss']
})
export class OnboardingGlobalCalculatorWidgetComponent implements OnInit, OnDestroy {
    @Input() config!: WidgetConfig;

    calculatorConfig: CalculatorConfig | null = null;
    calculatorFormData: any = {};
    calculatorResult: CalculatorResult | null = null;

    private sub: Subscription | null = null;

    constructor(private aggregator: OnboardingCalculatorAggregatorService) {}

    ngOnInit(): void {
        const settings = (this.config && this.config.settings) || {};

        // Accept either raw CalculatorConfig object or JSON string.
        let rawConfig: any = settings.calculatorConfig;
        if (!rawConfig && typeof settings.calculatorConfigJson === 'string') {
            try {
                rawConfig = JSON.parse(settings.calculatorConfigJson);
            } catch {
                rawConfig = null;
            }
        }

        if (rawConfig && typeof rawConfig === 'object') {
            const base: CalculatorConfig = {
                title: settings.title || 'Your Estimated Price',
                showBreakdown: true,
                autoCalculate: true
            };
            this.calculatorConfig = { ...base, ...rawConfig };
        }

        // Subscribe to aggregated formData so this widget reflects
        // all onboarding entities contributing to the calculator.
        this.calculatorFormData = this.aggregator.getFormDataSnapshot();
        this.sub = this.aggregator.formData$.subscribe((data) => {
            this.calculatorFormData = data || {};
        });
    }

    /**
     * Called each time the embedded calculator produces a new result.
     * Pushes the total premium and derived family tier back into the aggregator
     * so the multi-submit completion step can write them to the Policy entity
     * for PDF field mapping.
     */
    onCalculated(result: CalculatorResult): void {
        this.calculatorResult = result;

        const snapshot = this.aggregator.getFormDataSnapshot();
        const dependentCount = ((snapshot['dependents'] as any[]) || []).length;
        const familyTier = dependentCount <= 5 ? '1+5' : '1+9';

        // Guard against re-entrance: only emit if values actually changed.
        if (
            snapshot['totalMonthlyPremium'] !== result.totalMonthlyPremium ||
            snapshot['familyTier'] !== familyTier
        ) {
            this.aggregator.updateGlobals({
                totalMonthlyPremium: result.totalMonthlyPremium,
                familyTier
            });
        }
    }

    ngOnDestroy(): void {
        if (this.sub) {
            this.sub.unsubscribe();
            this.sub = null;
        }
    }
}
