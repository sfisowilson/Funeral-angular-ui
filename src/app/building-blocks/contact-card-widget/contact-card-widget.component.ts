import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
    iconColor?: string;
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
        return this.settings.backgroundColor || 'var(--surface-ground, #f8f9fa)';
    }

    get iconColor(): string {
        return this.settings.iconColor || 'var(--primary-color, #007bff)';
    }

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
