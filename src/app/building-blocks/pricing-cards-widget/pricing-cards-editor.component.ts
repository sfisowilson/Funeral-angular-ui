import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PricingCardsConfig, PricingTier, PricingFeature } from './pricing-cards-widget.component';

@Component({
  selector: 'app-pricing-cards-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pricing-cards-editor.component.html',
  styleUrl: './pricing-cards-editor.component.scss'
})
export class PricingCardsEditorComponent implements OnInit {
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
  @Output() configChange = new EventEmitter<PricingCardsConfig>();
  @Output() update = new EventEmitter<any>();


  ngOnInit() {
    if (!this.config.title) {
      this.config.title = 'Choose Your Plan';
    }
    if (!this.config.subtitle) {
      this.config.subtitle = 'Select the perfect plan for your funeral service business';
    }
    if (!this.config.tiers || this.config.tiers.length === 0) {
      this.config.tiers = [
        {
          name: 'Starter',
          description: 'Perfect for small funeral homes',
          price: 'R2,999',
          pricePeriod: '/ month',
          features: [
            { text: 'Up to 50 member profiles', included: true },
            { text: 'Basic website builder', included: true },
            { text: 'Payment processing', included: true },
            { text: 'Email support', included: true },
            { text: 'Custom domain', included: false },
            { text: 'Advanced analytics', included: false },
            { text: 'Priority support', included: false }
          ],
          ctaText: 'Start Free Trial',
          ctaLink: '#',
          isPopular: false
        },
        {
          name: 'Professional',
          description: 'Most popular choice',
          price: 'R5,999',
          pricePeriod: '/ month',
          originalPrice: 'R7,999',
          features: [
            { text: 'Up to 500 member profiles', included: true },
            { text: 'Advanced website builder', included: true },
            { text: 'Payment processing', included: true },
            { text: 'Priority email & phone support', included: true },
            { text: 'Custom domain', included: true },
            { text: 'Advanced analytics', included: true },
            { text: 'WhatsApp integration', included: true },
            { text: 'Multi-user access', included: false }
          ],
          ctaText: 'Start Free Trial',
          ctaLink: '#',
          isPopular: true
        },
        {
          name: 'Enterprise',
          description: 'For established businesses',
          price: 'R12,999',
          pricePeriod: '/ month',
          features: [
            { text: 'Unlimited member profiles', included: true },
            { text: 'Enterprise website builder', included: true },
            { text: 'Payment processing', included: true },
            { text: 'Dedicated account manager', included: true },
            { text: 'Custom domain & branding', included: true },
            { text: 'Advanced analytics & reporting', included: true },
            { text: 'WhatsApp & SMS integration', included: true },
            { text: 'Multi-user access with roles', included: true },
            { text: 'Custom integrations', included: true },
            { text: 'SLA guarantee', included: true }
          ],
          ctaText: 'Contact Sales',
          ctaLink: '#',
          isPopular: false
        }
      ];
    }
    if (!this.config.settings) {
      this.config.settings = {
        showBillingToggle: false,
        billingLabel: 'Monthly / Annual',
        columns: 3
      };
    }
    this.emitChange();
  }

  emitChange() {
    this.configChange.emit(this.config);
  }

  addTier() {
    this.config.tiers.push({
      name: 'New Plan',
      description: 'Plan description',
      price: 'R0',
      pricePeriod: '/ month',
      features: [
        { text: 'Feature 1', included: true },
        { text: 'Feature 2', included: true },
        { text: 'Feature 3', included: false }
      ],
      ctaText: 'Get Started',
      ctaLink: '#',
      isPopular: false
    });
    this.emitChange();
  }

  removeTier(index: number) {
    this.config.tiers.splice(index, 1);
    this.emitChange();
  }

  moveTierUp(index: number) {
    if (index > 0) {
      const temp = this.config.tiers[index];
      this.config.tiers[index] = this.config.tiers[index - 1];
      this.config.tiers[index - 1] = temp;
      this.emitChange();
    }
  }

  moveTierDown(index: number) {
    if (index < this.config.tiers.length - 1) {
      const temp = this.config.tiers[index];
      this.config.tiers[index] = this.config.tiers[index + 1];
      this.config.tiers[index + 1] = temp;
      this.emitChange();
    }
  }

  addFeature(tier: PricingTier) {
    tier.features.push({
      text: 'New feature',
      included: true
    });
    this.emitChange();
  }

  removeFeature(tier: PricingTier, index: number) {
    tier.features.splice(index, 1);
    this.emitChange();
  }

  moveFeatureUp(tier: PricingTier, index: number) {
    if (index > 0) {
      const temp = tier.features[index];
      tier.features[index] = tier.features[index - 1];
      tier.features[index - 1] = temp;
      this.emitChange();
    }
  }

  moveFeatureDown(tier: PricingTier, index: number) {
    if (index < tier.features.length - 1) {
      const temp = tier.features[index];
      tier.features[index] = tier.features[index + 1];
      tier.features[index + 1] = temp;
      this.emitChange();
    }
  }

  onSave() {
    this.update.emit(this.config.settings);
  }
}
