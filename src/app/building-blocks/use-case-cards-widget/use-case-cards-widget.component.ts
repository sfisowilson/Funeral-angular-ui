import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface UseCaseCard {
  icon: string;
  title: string;
  description: string;
  features: string[];
  ctaText?: string;
  ctaLink?: string;
}

export interface UseCaseSettings {
  title?: string;
  subtitle?: string;
  columns?: number;
  showFeatures?: boolean;
  showCta?: boolean;
}

@Component({
  selector: 'app-use-case-cards-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './use-case-cards-widget.component.html',
  styleUrls: ['./use-case-cards-widget.component.scss']
})
export class UseCaseCardsWidgetComponent {
  @Input() config: any = {};

  get title(): string {
    return this.config.settings?.title || 'Ideal For';
  }

  get subtitle(): string {
    return this.config.settings?.subtitle || '';
  }

  get cards(): UseCaseCard[] {
    return this.config.cards || [];
  }

  get settings(): UseCaseSettings {
    return this.config.settings || {};
  }

  get columns(): number {
    return this.settings.columns || 3;
  }

  get showFeatures(): boolean {
    return this.settings.showFeatures !== false;
  }

  get showCta(): boolean {
    return this.settings.showCta !== false;
  }

  get columnClass(): string {
    const colMap: { [key: number]: string } = {
      2: 'col-md-6',
      3: 'col-lg-4',
      4: 'col-lg-3'
    };
    return colMap[this.columns] || 'col-lg-4';
  }
}
