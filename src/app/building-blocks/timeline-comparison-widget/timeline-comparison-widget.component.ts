import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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
}
