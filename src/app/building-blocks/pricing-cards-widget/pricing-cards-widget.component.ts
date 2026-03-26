import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { hexToRgba } from '../widget-color.utils';

export interface PricingFeature {
    text: string;
    included: boolean;
}

export interface PricingTier {
    name: string;
    description?: string;
    price: string;
    pricePeriod?: string;
    originalPrice?: string;
    features: PricingFeature[];
    ctaText?: string;
    ctaLink?: string;
    isPopular?: boolean;
    highlightColor?: string;
}

export interface PricingCardsSettings {
    showBillingToggle?: boolean;
    billingLabel?: string;
    columns?: number;
    // Colors
    backgroundColor?: string;
    backgroundOpacity?: number;
    titleColor?: string;
    subtitleColor?: string;
    cardBackgroundColor?: string;
    planNameColor?: string;
    priceColor?: string;
    periodColor?: string;
    descriptionColor?: string;
    featureTextColor?: string;
    featureExcludedColor?: string;
    checkmarkColor?: string;
    crossColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    featuredButtonColor?: string;
    featuredButtonTextColor?: string;
    popularBadgeBackgroundColor?: string;
    popularBadgeTextColor?: string;
    originalPriceColor?: string;
}

export interface PricingCardsConfig {
    title?: string;
    subtitle?: string;
    tiers: PricingTier[];
    settings: PricingCardsSettings;
}

@Component({
    selector: 'app-pricing-cards-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './pricing-cards-widget.component.html',
    styleUrl: './pricing-cards-widget.component.scss'
})
export class PricingCardsWidgetComponent {
    @Input() config: PricingCardsConfig = {
        title: '',
        subtitle: '',
        tiers: [],
        settings: {
            showBillingToggle: false,
            billingLabel: 'Monthly / Annual',
            columns: 3
        }
    };

    // Support both direct PricingCardsConfig (landing page builder)
    // and WidgetConfig wrapper (DynamicPageComponent) where props land in config.settings
    private get _s(): any { return (this.config as any).settings || {}; }

    get title(): string {
        return this.config.title || this._s.title || '';
    }

    get subtitle(): string {
        return this.config.subtitle || this._s.subtitle || '';
    }

    get tiers(): PricingTier[] {
        return this.config.tiers || this._s.tiers || [];
    }

    get settings(): PricingCardsSettings {
        return this.config.settings || this._s.settings || {};
    }

    get showBillingToggle(): boolean {
        return this.settings.showBillingToggle || false;
    }

    get billingLabel(): string {
        return this.settings.billingLabel || 'Monthly / Annual';
    }

    get columns(): number {
        return this.settings.columns || 3;
    }

    get columnClass(): string {
        const colMap: { [key: number]: string } = {
            2: 'col-lg-6',
            3: 'col-lg-4',
            4: 'col-lg-3'
        };
        return colMap[this.columns] || 'col-lg-4';
    }

    private get _sc(): any { return (this.config as any).settings?.colorConfig || (this.config as any).colorConfig || {}; }
    get backgroundColor(): string { return hexToRgba(this._sc.backgroundColor || this._s.backgroundColor || '#ffffff', this._sc.backgroundOpacity ?? this._s.backgroundOpacity ?? 1); }
    get titleColor(): string { return this._sc.titleColor || this._s.titleColor || '#1a1a1a'; }
    get subtitleColor(): string { return this._sc.subtitleColor || this._s.subtitleColor || '#6c757d'; }
    get cardBackgroundColor(): string { return hexToRgba(this._sc.cardBackgroundColor || this._s.cardBackgroundColor || '#ffffff', this._sc.cardBackgroundOpacity ?? this._s.cardBackgroundOpacity ?? 1); }
    get planNameColor(): string { return this._sc.planNameColor || this._s.planNameColor || '#1a1a1a'; }
    get priceColor(): string { return this._sc.priceColor || this._s.priceColor || '#1a1a1a'; }
    get periodColor(): string { return this._sc.periodColor || this._s.periodColor || '#6c757d'; }
    get descriptionColor(): string { return this._sc.descriptionColor || this._s.descriptionColor || '#6c757d'; }
    get featureTextColor(): string { return this._sc.featureTextColor || this._s.featureTextColor || '#212529'; }
    get featureExcludedColor(): string { return this._sc.featureExcludedColor || this._s.featureExcludedColor || '#9ca3af'; }
    get checkmarkColor(): string { return this._sc.checkmarkColor || this._s.checkmarkColor || '#198754'; }
    get crossColor(): string { return this._sc.crossColor || this._s.crossColor || '#dc3545'; }
    get buttonColor(): string { return hexToRgba(this._sc.buttonColor || this._s.buttonColor || '#0d6efd', 1); }
    get buttonTextColor(): string { return this._sc.buttonTextColor || this._s.buttonTextColor || '#ffffff'; }
    get featuredButtonColor(): string { return hexToRgba(this._sc.featuredButtonColor || this._s.featuredButtonColor || '#0d6efd', 1); }
    get featuredButtonTextColor(): string { return this._sc.featuredButtonTextColor || this._s.featuredButtonTextColor || '#ffffff'; }
    get popularBadgeBackgroundColor(): string { return hexToRgba(this._sc.popularBadgeBackgroundColor || this._s.popularBadgeBackgroundColor || '#f59e0b', 1); }
    get popularBadgeTextColor(): string { return this._sc.popularBadgeTextColor || this._s.popularBadgeTextColor || '#ffffff'; }
    get originalPriceColor(): string { return this._sc.originalPriceColor || this._s.originalPriceColor || '#9ca3af'; }}