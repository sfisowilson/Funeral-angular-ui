import { Component, Input , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { hexToRgba } from '../widget-color.utils';

export interface TimelineOption {
    title: string;
    subtitle?: string;
    duration: string;
    durationUnit?: string;
    steps: TimelineStep[];
    totalLabel?: string;
    isRecommended?: boolean;
    highlightColor?: string;
}

export interface TimelineStep {
    label: string;
    duration: string;
}

export interface TimelineComparisonSettings {
    title?: string;
    subtitle?: string;
    showSteps?: boolean;
    highlightRecommended?: boolean;
}

@Component({
    selector: 'app-timeline-comparison-widget',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule],
    templateUrl: './timeline-comparison-widget.component.html',
    styleUrls: ['./timeline-comparison-widget.component.scss']
})
export class TimelineComparisonWidgetComponent {
    @Input() config: any = {};

    get title(): string {
        return this.config.settings?.title || 'Time Comparison';
    }

    get subtitle(): string {
        return this.config.settings?.subtitle || '';
    }

    get options(): TimelineOption[] {
        return this.config.options || [];
    }

    get settings(): TimelineComparisonSettings {
        return this.config.settings || {};
    }

    get showSteps(): boolean {
        return this.settings.showSteps !== false;
    }

    get highlightRecommended(): boolean {
        return this.settings.highlightRecommended !== false;
    }

    get widgetTitleColor(): string {
        return this.config.settings?.titleColor || 'var(--text-color, #000000)';
    }

    get widgetSubtitleColor(): string {
        return this.config.settings?.subtitleColor || 'var(--muted-color, #6c757d)';
    }

    get cardBackgroundColor(): string {
        const base = this.config.settings?.cardBackgroundColor || '#ffffff';
        const opacity = this.config.settings?.cardBackgroundOpacity ?? 1;
        return hexToRgba(base, opacity);
    }

    get headerBackgroundColor(): string {
        return this.config.settings?.headerBackgroundColor || '#f8f9fa';
    }

    get headerTextColor(): string {
        return this.config.settings?.headerTextColor || '#000000';
    }

    get stepLabelColor(): string {
        return this.config.settings?.stepLabelColor || 'var(--text-color, #333333)';
    }

    get stepDurationColor(): string {
        return this.config.settings?.stepDurationColor || 'var(--muted-color, #6c757d)';
    }

    get recommendedBadgeColor(): string {
        return this.config.settings?.recommendedBadgeColor || '#28a745';
    }

    get recommendedBadgeTextColor(): string {
        return this.config.settings?.recommendedBadgeTextColor || '#ffffff';
    }
}
