import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ProcessStep {
    number: number;
    icon: string;
    title: string;
    description: string;
}

@Component({
    selector: 'app-process-steps-widget',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './process-steps-widget.component.html',
    styleUrls: ['./process-steps-widget.component.scss']
})
export class ProcessStepsWidgetComponent {
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

    get steps(): ProcessStep[] {
        return this.settings.steps || [];
    }

    get layout(): 'horizontal' | 'vertical' {
        return this.settings.layout || 'horizontal';
    }

    get showConnectors(): boolean {
        return this.settings.showConnectors !== false;
    }

    get titleColor(): string {
        return this.settings.titleColor || 'var(--text-color, #000000)';
    }

    get subtitleColor(): string {
        return this.settings.subtitleColor || 'var(--muted-color, #6c757d)';
    }

    get backgroundColor(): string {
        return this.settings.backgroundColor || 'var(--surface-card, #ffffff)';
    }

    get stepBackgroundColor(): string {
        return this.settings.stepBackgroundColor || 'var(--surface-ground, #f8f9fa)';
    }

    get stepNumberColor(): string {
        return this.settings.stepNumberColor || 'var(--primary-color, #0d6efd)';
    }

    get iconColor(): string {
        return this.settings.iconColor || 'var(--primary-color, #0d6efd)';
    }

    get connectorColor(): string {
        return this.settings.connectorColor || 'var(--surface-border, #dee2e6)';
    }

    get padding(): number {
        return this.settings.padding || 40;
    }

    get showCTA(): boolean {
        return this.settings.showCTA && this.settings.ctaText;
    }

    get ctaText(): string {
        return this.settings.ctaText || '';
    }

    get ctaUrl(): string {
        return this.settings.ctaUrl || '#';
    }

    get ctaStyle(): 'primary' | 'success' | 'outline' {
        return this.settings.ctaStyle || 'primary';
    }
}
