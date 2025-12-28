import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeatureGridItem } from './feature-grid-widget.component';

@Component({
    selector: 'app-feature-grid-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './feature-grid-editor.component.html',
    styleUrls: ['./feature-grid-editor.component.scss']
})
export class FeatureGridEditorComponent implements OnInit {
    @Output() update = new EventEmitter<any>();
    @Input() config: any;
    ngOnInit() {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Initialize defaults
        if (!this.config.settings.title) {
            this.config.settings.title = 'Powerful Features for Modern Funeral Services';
        }

        if (!this.config.settings.subtitle) {
            this.config.settings.subtitle = 'Everything you need to run your business professionally';
        }

        if (!this.config.settings.features || this.config.settings.features.length === 0) {
            this.config.settings.features = [
                {
                    icon: 'bi bi-globe',
                    title: 'Professional Website',
                    description: 'Beautiful, mobile-responsive website with your custom subdomain'
                },
                {
                    icon: 'bi bi-people',
                    title: 'Member Management',
                    description: 'Complete system for registering and managing members'
                },
                {
                    icon: 'bi bi-file-text',
                    title: 'Claims Processing',
                    description: 'Streamlined workflow from submission to approval'
                },
                {
                    icon: 'bi bi-shield-check',
                    title: 'Secure & Compliant',
                    description: 'Bank-level security with automatic backups'
                },
                {
                    icon: 'bi bi-speedometer2',
                    title: 'Real-time Analytics',
                    description: 'Comprehensive dashboards and business insights'
                },
                {
                    icon: 'bi bi-headset',
                    title: '24/7 Support',
                    description: 'Always available to help you succeed'
                }
            ];
        }

        if (this.config.settings.columns === undefined) {
            this.config.settings.columns = 3;
        }

        if (this.config.settings.titleColor === undefined) {
            this.config.settings.titleColor = 'var(--text-color, #000000)';
        }

        if (this.config.settings.subtitleColor === undefined) {
            this.config.settings.subtitleColor = 'var(--muted-color, #6c757d)';
        }

        if (this.config.settings.backgroundColor === undefined) {
            this.config.settings.backgroundColor = 'var(--surface-card, #ffffff)';
        }

        if (this.config.settings.cardBackgroundColor === undefined) {
            this.config.settings.cardBackgroundColor = 'var(--surface-ground, #f8f9fa)';
        }

        if (this.config.settings.iconColor === undefined) {
            this.config.settings.iconColor = 'var(--primary-color, #0d6efd)';
        }

        if (this.config.settings.iconBackgroundColor === undefined) {
            this.config.settings.iconBackgroundColor = 'var(--surface-ground, #e7f1ff)';
        }

        if (this.config.settings.titleTextColor === undefined) {
            this.config.settings.titleTextColor = 'var(--text-color, #212529)';
        }

        if (this.config.settings.descriptionTextColor === undefined) {
            this.config.settings.descriptionTextColor = 'var(--muted-color, #6c757d)';
        }

        if (this.config.settings.padding === undefined) {
            this.config.settings.padding = 60;
        }

        if (this.config.settings.hoverEffect === undefined) {
            this.config.settings.hoverEffect = true;
        }

        if (this.config.settings.iconSize === undefined) {
            this.config.settings.iconSize = 'large';
        }
    }

    addFeature() {
        if (!this.config.settings.features) {
            this.config.settings.features = [];
        }

        this.config.settings.features.push({
            icon: 'bi bi-star-fill',
            title: 'New Feature',
            description: 'Feature description'
        });
    }

    removeFeature(index: number) {
        this.config.settings.features.splice(index, 1);
    }

    moveFeatureUp(index: number) {
        if (index > 0) {
            [this.config.settings.features[index - 1], this.config.settings.features[index]] = 
            [this.config.settings.features[index], this.config.settings.features[index - 1]];
        }
    }

    moveFeatureDown(index: number) {
        if (index < this.config.settings.features.length - 1) {
            [this.config.settings.features[index], this.config.settings.features[index + 1]] = 
            [this.config.settings.features[index + 1], this.config.settings.features[index]];
        }
    }

    onSave() {
        this.update.emit(this.config.settings);
    }
}
