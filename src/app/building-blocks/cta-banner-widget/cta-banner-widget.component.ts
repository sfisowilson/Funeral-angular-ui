import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CTAButton {
  text: string;
  link: string;
  isPrimary: boolean;
}

export interface CTABannerSettings {
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  backgroundImage?: string;
  overlayOpacity?: number;
  textColor?: 'light' | 'dark';
  alignment?: 'left' | 'center' | 'right';
  paddingSize?: 'small' | 'medium' | 'large';
}

export interface CTABannerConfig {
  headline: string;
  subheadline?: string;
  buttons: CTAButton[];
  settings: CTABannerSettings;
}

@Component({
  selector: 'app-cta-banner-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cta-banner-widget.component.html',
  styleUrl: './cta-banner-widget.component.scss'
})
export class CTABannerWidgetComponent {
  @Input() config: CTABannerConfig = {
    headline: '',
    subheadline: '',
    buttons: [],
      settings: {
      backgroundType: 'gradient',
      backgroundColor: 'var(--primary-color, #007bff)',
      gradientStart: 'var(--primary-color, #007bff)',
      gradientEnd: 'var(--primary-dark, #0056b3)',
      overlayOpacity: 0.5,
      textColor: 'light',
      alignment: 'center',
      paddingSize: 'large'
    }
  };

  get headline(): string {
    return this.config.headline || '';
  }

  get subheadline(): string {
    return this.config.subheadline || '';
  }

  get buttons(): CTAButton[] {
    return this.config.buttons || [];
  }

  get settings(): CTABannerSettings {
    return this.config.settings || {};
  }

  get backgroundType(): string {
    return this.settings.backgroundType || 'gradient';
  }

  get backgroundColor(): string {
    return this.settings.backgroundColor || 'var(--primary-color, #007bff)';
  }

  get gradientStart(): string {
    return this.settings.gradientStart || 'var(--primary-color, #007bff)';
  }

  get gradientEnd(): string {
    return this.settings.gradientEnd || 'var(--primary-dark, #0056b3)';
  }

  get backgroundImage(): string {
    return this.settings.backgroundImage || '';
  }

  get overlayOpacity(): number {
    return this.settings.overlayOpacity !== undefined ? this.settings.overlayOpacity : 0.5;
  }

  get textColor(): string {
    return this.settings.textColor || 'light';
  }

  get alignment(): string {
    return this.settings.alignment || 'center';
  }

  get paddingSize(): string {
    return this.settings.paddingSize || 'large';
  }

  get backgroundStyle(): any {
    if (this.backgroundType === 'color') {
      return { 'background-color': this.backgroundColor };
    } else if (this.backgroundType === 'gradient') {
      return {
        'background': `linear-gradient(135deg, ${this.gradientStart}, ${this.gradientEnd})`
      };
    } else if (this.backgroundType === 'image' && this.backgroundImage) {
      return {
        'background-image': `url(${this.backgroundImage})`,
        'background-size': 'cover',
        'background-position': 'center'
      };
    }
    return {};
  }

  get overlayStyle(): any {
    if (this.backgroundType === 'image' && this.backgroundImage) {
      return {
        'background-color': `rgba(0, 0, 0, ${this.overlayOpacity})`
      };
    }
    return { 'display': 'none' };
  }
}
