import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcessStep } from './process-steps-widget.component';

@Component({
    selector: 'app-process-steps-editor',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './process-steps-editor.component.html',
    styleUrls: ['./process-steps-editor.component.scss']
})
export class ProcessStepsEditorComponent implements OnInit {
    @Input() config: any;
    @Output() update = new EventEmitter<any>();


    ngOnInit() {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Initialize defaults
        if (!this.config.settings.title) {
            this.config.settings.title = 'How to Get Started';
        }

        if (!this.config.settings.subtitle) {
            this.config.settings.subtitle = 'Your funeral service platform in 5 simple steps';
        }

        if (!this.config.settings.steps || this.config.settings.steps.length === 0) {
            this.config.settings.steps = [
                {
                    number: 1,
                    icon: 'bi bi-person-plus-fill',
                    title: 'Sign Up',
                    description: 'Create your account and choose your subdomain in under 2 minutes'
                },
                {
                    number: 2,
                    icon: 'bi bi-palette-fill',
                    title: 'Customize',
                    description: 'Add your logo, colors, and branding with our drag-and-drop builder'
                },
                {
                    number: 3,
                    icon: 'bi bi-sliders',
                    title: 'Configure',
                    description: 'Set up your policies, services, and pricing structure'
                },
                {
                    number: 4,
                    icon: 'bi bi-rocket-takeoff-fill',
                    title: 'Publish',
                    description: 'Go live with one click - your professional website is ready'
                },
                {
                    number: 5,
                    icon: 'bi bi-graph-up-arrow',
                    title: 'Grow',
                    description: 'Register members and manage your business efficiently'
                }
            ];
        }

        if (this.config.settings.layout === undefined) {
            this.config.settings.layout = 'horizontal';
        }

        if (this.config.settings.showConnectors === undefined) {
            this.config.settings.showConnectors = true;
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

        if (this.config.settings.stepBackgroundColor === undefined) {
            this.config.settings.stepBackgroundColor = 'var(--surface-ground, #f8f9fa)';
        }

        if (this.config.settings.stepNumberColor === undefined) {
            this.config.settings.stepNumberColor = 'var(--primary-color, #0d6efd)';
        }

        if (this.config.settings.iconColor === undefined) {
            this.config.settings.iconColor = 'var(--primary-color, #0d6efd)';
        }

        if (this.config.settings.connectorColor === undefined) {
            this.config.settings.connectorColor = 'var(--surface-border, #dee2e6)';
        }

        if (this.config.settings.padding === undefined) {
            this.config.settings.padding = 40;
        }

        if (this.config.settings.showCTA === undefined) {
            this.config.settings.showCTA = false;
        }

        if (this.config.settings.ctaText === undefined) {
            this.config.settings.ctaText = 'Get Started Now';
        }

        if (this.config.settings.ctaUrl === undefined) {
            this.config.settings.ctaUrl = '/auth/register';
        }

        if (this.config.settings.ctaStyle === undefined) {
            this.config.settings.ctaStyle = 'primary';
        }
    }

    addStep() {
        if (!this.config.settings.steps) {
            this.config.settings.steps = [];
        }

        const newNumber = this.config.settings.steps.length + 1;
        this.config.settings.steps.push({
            number: newNumber,
            icon: 'bi bi-check-circle-fill',
            title: 'Step ' + newNumber,
            description: 'Description for step ' + newNumber
        });
    }

    removeStep(index: number) {
        this.config.settings.steps.splice(index, 1);
        // Renumber remaining steps
        this.config.settings.steps.forEach((step: ProcessStep, i: number) => {
            step.number = i + 1;
        });
    }
    onSave() {
        this.update.emit(this.config.settings);
    }

    moveStepUp(index: number) {
        if (index > 0) {
            [this.config.settings.steps[index - 1], this.config.settings.steps[index]] = 
            [this.config.settings.steps[index], this.config.settings.steps[index - 1]];
            // Renumber
            this.config.settings.steps.forEach((step: ProcessStep, i: number) => {
                step.number = i + 1;
            });
        }
    }

    moveStepDown(index: number) {
        if (index < this.config.settings.steps.length - 1) {
            [this.config.settings.steps[index], this.config.settings.steps[index + 1]] = 
            [this.config.settings.steps[index + 1], this.config.settings.steps[index]];
            // Renumber
            this.config.settings.steps.forEach((step: ProcessStep, i: number) => {
                step.number = i + 1;
            });
        }
    }
}
