import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { hexToRgba } from '../widget-color.utils';

export interface LogoItem {
    name: string;
    imageUrl: string;
    link?: string;
    altText?: string;
}

export interface LogoCloudSettings {
    title?: string;
    subtitle?: string;
    layout?: 'grid' | 'centered';
    columns?: number;
    grayscale?: boolean;
    hoverColor?: boolean;
    logoSize?: 'small' | 'medium' | 'large';
}

@Component({
    selector: 'app-logo-cloud-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './logo-cloud-widget.component.html',
    styleUrls: ['./logo-cloud-widget.component.scss']
})
export class LogoCloudWidgetComponent {
    @Input() config: any = {};

    get title(): string {
        return this.config.settings?.title || '';
    }

    get subtitle(): string {
        return this.config.settings?.subtitle || '';
    }

    get backgroundColor(): string { return hexToRgba(this.config.settings?.backgroundColor || '#ffffff', this.config.settings?.backgroundOpacity ?? 1); }
    get titleColor(): string { return this.config.settings?.titleColor || '#1a1a1a'; }
    get subtitleColor(): string { return this.config.settings?.subtitleColor || '#6c757d'; }
    get cardBackgroundColor(): string { return hexToRgba(this.config.settings?.cardBackgroundColor || '#ffffff', this.config.settings?.cardBackgroundOpacity ?? 1); }

    get logos(): LogoItem[] {
        return this.config.logos || [];
    }

    get settings(): LogoCloudSettings {
        return this.config.settings || {};
    }

    get layout(): string {
        return this.settings.layout || 'grid';
    }

    get columns(): number {
        return this.settings.columns || 4;
    }

    get grayscale(): boolean {
        return this.settings.grayscale !== false;
    }

    get hoverColor(): boolean {
        return this.settings.hoverColor !== false;
    }

    get logoSize(): string {
        return this.settings.logoSize || 'medium';
    }

    get columnClass(): string {
        const colMap: { [key: number]: string } = {
            3: 'col-md-4',
            4: 'col-md-3',
            5: 'col-lg-2 col-md-4',
            6: 'col-lg-2 col-md-3'
        };
        return colMap[this.columns] || 'col-md-3';
    }

    trackByIndex(index: number): number {
        return index;
    }
}
