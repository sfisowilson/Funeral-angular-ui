import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimelineOption, TimelineStep } from './timeline-comparison-widget.component';

@Component({
    selector: 'app-timeline-comparison-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './timeline-comparison-editor.component.html',
    styleUrls: ['./timeline-comparison-editor.component.scss']
})
export class TimelineComparisonEditorComponent implements OnInit {
    @Input() config: any = {};
    @Output() update = new EventEmitter<any>();

    ngOnInit() {
        if (!this.config.settings) {
            this.config.settings = {
                title: 'Time to Market Comparison',
                subtitle: 'See how fast you can get your business online',
                showSteps: true,
                highlightRecommended: true,
                titleColor: '#000000',
                subtitleColor: '#6c757d',
                cardBackgroundColor: '#ffffff',
                cardBackgroundOpacity: 1,
                headerBackgroundColor: '#f8f9fa',
                headerTextColor: '#000000',
                stepLabelColor: '#333333',
                stepDurationColor: '#6c757d',
                recommendedBadgeColor: '#28a745',
                recommendedBadgeTextColor: '#ffffff'
            };
        } else {
            if (this.config.settings.titleColor === undefined) this.config.settings.titleColor = '#000000';
            if (this.config.settings.subtitleColor === undefined) this.config.settings.subtitleColor = '#6c757d';
            if (this.config.settings.cardBackgroundColor === undefined) this.config.settings.cardBackgroundColor = '#ffffff';
            if (this.config.settings.cardBackgroundOpacity === undefined) this.config.settings.cardBackgroundOpacity = 1;
            if (this.config.settings.headerBackgroundColor === undefined) this.config.settings.headerBackgroundColor = '#f8f9fa';
            if (this.config.settings.headerTextColor === undefined) this.config.settings.headerTextColor = '#000000';
            if (this.config.settings.stepLabelColor === undefined) this.config.settings.stepLabelColor = '#333333';
            if (this.config.settings.stepDurationColor === undefined) this.config.settings.stepDurationColor = '#6c757d';
            if (this.config.settings.recommendedBadgeColor === undefined) this.config.settings.recommendedBadgeColor = '#28a745';
            if (this.config.settings.recommendedBadgeTextColor === undefined) this.config.settings.recommendedBadgeTextColor = '#ffffff';
        }

        if (!this.config.options || this.config.options.length === 0) {
            this.config.options = [
                {
                    title: 'Traditional Website Development',
                    subtitle: 'The conventional approach',
                    duration: '2-4',
                    durationUnit: 'months',
                    steps: [
                        { label: 'Domain registration & DNS setup', duration: '2-3 days' },
                        { label: 'Design discussions & mockups', duration: '1-2 weeks' },
                        { label: 'Development & revisions', duration: '4-12 weeks' },
                        { label: 'Content creation & population', duration: '1-2 weeks' },
                        { label: 'Testing & launch', duration: '1 week' }
                    ],
                    totalLabel: 'Total Time: 2-4 months',
                    isRecommended: false
                },
                {
                    title: 'Our Platform',
                    subtitle: 'Modern, efficient approach',
                    duration: '10',
                    durationUnit: 'minutes',
                    steps: [
                        { label: 'Sign up & choose subdomain', duration: '2 minutes' },
                        { label: 'Select professional template', duration: '1 minute' },
                        { label: 'Customize with drag-and-drop', duration: '5-10 minutes' },
                        { label: 'Publish your site', duration: '1 click' }
                    ],
                    totalLabel: 'Total Time: Under 10 minutes',
                    isRecommended: true,
                    highlightColor: 'var(--success-color, #28a745)'
                }
            ];
        }
    }

    addOption() {
        const newOption: TimelineOption = {
            title: 'New Option',
            subtitle: '',
            duration: '1',
            durationUnit: 'hour',
            steps: [],
            totalLabel: '',
            isRecommended: false
        };
        this.config.options.push(newOption);
    }

    removeOption(index: number) {
        this.config.options.splice(index, 1);
    }

    addStep(option: TimelineOption) {
        if (!option.steps) {
            option.steps = [];
        }
        option.steps.push({
            label: 'New step',
            duration: '1 day'
        });
    }

    removeStep(option: TimelineOption, stepIndex: number) {
        option.steps.splice(stepIndex, 1);
    }

    moveStepUp(option: TimelineOption, index: number) {
        if (index > 0) {
            const temp = option.steps[index];
            option.steps[index] = option.steps[index - 1];
            option.steps[index - 1] = temp;
        }
    }

    moveStepDown(option: TimelineOption, index: number) {
        if (index < option.steps.length - 1) {
            const temp = option.steps[index];
            option.steps[index] = option.steps[index + 1];
            option.steps[index + 1] = temp;
        }
    }

    onSave() {
        this.update.emit(this.config.settings);
    }
}
