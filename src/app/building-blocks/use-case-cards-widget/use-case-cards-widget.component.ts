import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { hexToRgba } from '../widget-color.utils';

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
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    get backgroundColor(): string { return hexToRgba(this.config.settings?.backgroundColor || '#ffffff', this.config.settings?.backgroundOpacity ?? 1); }
    get titleColor(): string { return this.config.settings?.titleColor || '#1a1a1a'; }
    get subtitleColor(): string { return this.config.settings?.subtitleColor || '#6c757d'; }
    get cardBackgroundColor(): string { return hexToRgba(this.config.settings?.cardBackgroundColor || '#ffffff', this.config.settings?.cardBackgroundOpacity ?? 1); }
    get iconColor(): string { return this.config.settings?.iconColor || '#0d6efd'; }
    get cardTitleColor(): string { return this.config.settings?.cardTitleColor || '#1a1a1a'; }
    get cardTextColor(): string { return this.config.settings?.cardTextColor || '#495057'; }
    get checkmarkColor(): string { return this.config.settings?.checkmarkColor || '#198754'; }
    get ctaColor(): string { return this.config.settings?.ctaColor || '#0d6efd'; }
    get ctaTextColor(): string { return this.config.settings?.ctaTextColor || '#0d6efd'; }
}
