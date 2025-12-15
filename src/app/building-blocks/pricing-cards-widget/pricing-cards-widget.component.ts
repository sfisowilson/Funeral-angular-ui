import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  get title(): string {
    return this.config.title || '';
  }

  get subtitle(): string {
    return this.config.subtitle || '';
  }

  get tiers(): PricingTier[] {
    return this.config.tiers || [];
  }

  get settings(): PricingCardsSettings {
    return this.config.settings || {};
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
}
