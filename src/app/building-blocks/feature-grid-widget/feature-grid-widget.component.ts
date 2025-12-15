import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FeatureGridItem {
    icon: string;
    title: string;
    description: string;
}

@Component({
    selector: 'app-feature-grid-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './feature-grid-widget.component.html',
    styleUrls: ['./feature-grid-widget.component.scss']
})
export class FeatureGridWidgetComponent {
    @Input() config: any;

    get settings() {
        return this.config?.settings || {};
    }

    get title(): string {
        return this.settings.title || '';
    }

    get subtitle(): string {
        return this.settings.subtitle || '';
    }

    get features(): FeatureGridItem[] {
        return this.settings.features || [];
    }

    get columns(): number {
        return this.settings.columns || 3;
    }

    get titleColor(): string {
        return this.settings.titleColor || '#000000';
    }

    get subtitleColor(): string {
        return this.settings.subtitleColor || '#6c757d';
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || '#ffffff';
    }

    get cardBackgroundColor(): string {
        return this.settings.cardBackgroundColor || '#f8f9fa';
    }

    get iconColor(): string {
        return this.settings.iconColor || '#0d6efd';
    }

    get iconBackgroundColor(): string {
        return this.settings.iconBackgroundColor || '#e7f1ff';
    }

    get titleTextColor(): string {
        return this.settings.titleTextColor || '#212529';
    }

    get descriptionTextColor(): string {
        return this.settings.descriptionTextColor || '#6c757d';
    }

    get padding(): number {
        return this.settings.padding || 60;
    }

    get hoverEffect(): boolean {
        return this.settings.hoverEffect !== false;
    }

    get iconSize(): 'small' | 'medium' | 'large' {
        return this.settings.iconSize || 'large';
    }
}
