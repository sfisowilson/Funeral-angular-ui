import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StatCounter } from './stats-counter-widget.component';

@Component({
    selector: 'app-stats-counter-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stats-counter-editor.component.html',
    styleUrls: ['./stats-counter-editor.component.scss']
})
export class StatsCounterEditorComponent implements OnInit {
    @Input() config: any;
    @Output() update = new EventEmitter<any>();

    ngOnInit() {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Initialize defaults
        if (!this.config.settings.title) {
            this.config.settings.title = 'Our Platform by the Numbers';
        }

        if (!this.config.settings.subtitle) {
            this.config.settings.subtitle = 'Trusted by funeral service providers nationwide';
        }

        if (!this.config.settings.stats || this.config.settings.stats.length === 0) {
            this.config.settings.stats = [
                {
                    icon: 'bi bi-clock-fill',
                    value: '10',
                    label: 'Minutes to Setup',
                    prefix: '',
                    suffix: ' min'
                },
                {
                    icon: 'bi bi-check-circle-fill',
                    value: '99.9',
                    label: 'Uptime Guarantee',
                    prefix: '',
                    suffix: '%'
                },
                {
                    icon: 'bi bi-currency-dollar',
                    value: '15,000',
                    label: 'Average Savings',
                    prefix: 'R',
                    suffix: '+'
                },
                {
                    icon: 'bi bi-people-fill',
                    value: '500',
                    label: 'Active Users',
                    prefix: '',
                    suffix: '+'
                }
            ];
        }

        if (this.config.settings.columns === undefined) {
            this.config.settings.columns = 4;
        }

        if (this.config.settings.titleColor === undefined) {
            this.config.settings.titleColor = 'var(--text-color, #000000)';
        }

        if (this.config.settings.subtitleColor === undefined) {
            this.config.settings.subtitleColor = 'var(--muted-color, #6c757d)';
        }

        if (this.config.settings.backgroundColor === undefined) {
            this.config.settings.backgroundColor = 'var(--surface-ground, #f8f9fa)';
        }

        if (this.config.settings.statBackgroundColor === undefined) {
            this.config.settings.statBackgroundColor = 'var(--surface-card, #ffffff)';
        }

        if (this.config.settings.valueColor === undefined) {
            this.config.settings.valueColor = 'var(--primary-color, #0d6efd)';
        }

        if (this.config.settings.labelColor === undefined) {
            this.config.settings.labelColor = 'var(--muted-color, #495057)';
        }

        if (this.config.settings.iconColor === undefined) {
            this.config.settings.iconColor = 'var(--primary-color, #0d6efd)';
        }

        if (this.config.settings.padding === undefined) {
            this.config.settings.padding = 60;
        }

        if (this.config.settings.animateOnScroll === undefined) {
            this.config.settings.animateOnScroll = true;
        }
    }

    addStat() {
        if (!this.config.settings.stats) {
            this.config.settings.stats = [];
        }

        this.config.settings.stats.push({
            icon: 'bi bi-star-fill',
            value: '100',
            label: 'New Stat',
            prefix: '',
            suffix: ''
        });
    }

    removeStat(index: number) {
        this.config.settings.stats.splice(index, 1);
    }

    moveStatUp(index: number) {
        if (index > 0) {
            [this.config.settings.stats[index - 1], this.config.settings.stats[index]] = 
            [this.config.settings.stats[index], this.config.settings.stats[index - 1]];
        }
    }

    moveStatDown(index: number) {
        if (index < this.config.settings.stats.length - 1) {
            [this.config.settings.stats[index], this.config.settings.stats[index + 1]] = 
            [this.config.settings.stats[index + 1], this.config.settings.stats[index]];
        }
    }

    onSave() {
        this.update.emit(this.config.settings);
    }
}
