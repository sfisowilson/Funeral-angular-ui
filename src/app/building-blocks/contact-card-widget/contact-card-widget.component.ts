import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { hexToRgba } from '../widget-color.utils';

export interface ContactMethod {
    type: 'phone' | 'email' | 'address' | 'whatsapp' | 'hours' | 'custom';
    icon: string;
    label: string;
    value: string;
    link?: string;
}

export interface ContactCardSettings {
    showMap?: boolean;
    mapEmbedUrl?: string;
    layout?: 'single' | 'split';
    backgroundColor?: string;
    backgroundOpacity?: number;
    iconColor?: string;
    titleColor?: string;
    subtitleColor?: string;
    labelColor?: string;
    valueTextColor?: string;
}

export interface ContactCardConfig {
    title?: string;
    subtitle?: string;
    contactMethods: ContactMethod[];
    settings: ContactCardSettings;
}

@Component({
    selector: 'app-contact-card-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './contact-card-widget.component.html',
    styleUrl: './contact-card-widget.component.scss'
})
export class ContactCardWidgetComponent {
    @Input() config: ContactCardConfig = {
        title: '',
        subtitle: '',
        contactMethods: [],
        settings: {
            showMap: false,
            mapEmbedUrl: '',
            layout: 'single',
            backgroundColor: 'var(--surface-ground, #f8f9fa)',
            iconColor: 'var(--primary-color, #007bff)'
        }
    };

    // Support both direct ContactCardConfig (landing page builder)
    // and WidgetConfig wrapper (DynamicPageComponent) where props land in config.settings
    private get _s(): any { return (this.config as any).settings || {}; }

    get title(): string {
        return this.config.title || this._s.title || '';
    }

    get subtitle(): string {
        return this.config.subtitle || this._s.subtitle || '';
    }

    get contactMethods(): ContactMethod[] {
        return this.config.contactMethods || this._s.contactMethods || [];
    }

    get settings(): ContactCardSettings {
        return ((this.config as any).settings || {}) as ContactCardSettings;
    }

    get showMap(): boolean {
        return this.settings.showMap || false;
    }

    get mapEmbedUrl(): string {
        return this.settings.mapEmbedUrl || '';
    }

    get layout(): string {
        return this.settings.layout || 'single';
    }

    get backgroundColor(): string {
        return hexToRgba(this.settings.backgroundColor || '#f8f9fa', this.settings.backgroundOpacity ?? 1);
    }

    get iconColor(): string {
        return this.settings.iconColor || 'var(--primary-color, #007bff)';
    }

    get titleColor(): string { return this.settings.titleColor || '#212529'; }
    get subtitleColor(): string { return this.settings.subtitleColor || '#6c757d'; }
    get labelColor(): string { return this.settings.labelColor || '#495057'; }
    get valueTextColor(): string { return this.settings.valueTextColor || '#6c757d'; }

    getContactLink(method: ContactMethod): string {
        if (method.link) {
            return method.link;
        }

        switch (method.type) {
            case 'phone':
                return `tel:${method.value.replace(/\s/g, '')}`;
            case 'email':
                return `mailto:${method.value}`;
            case 'whatsapp':
                const cleanNumber = method.value.replace(/\D/g, '');
                return `https://wa.me/${cleanNumber}`;
            default:
                return '#';
        }
    }

    isClickable(method: ContactMethod): boolean {
        return ['phone', 'email', 'whatsapp'].includes(method.type) || !!method.link;
    }
}
