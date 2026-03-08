import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { GlassmorphismCard } from './glassmorphism-card-widget.component';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SliderModule } from 'primeng/slider';

@Component({
    selector: 'app-glassmorphism-card-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        InputTextModule,
        InputTextarea,
        ButtonModule,
        FieldsetModule,
        CheckboxModule,
        DropdownModule,
        InputNumberModule,
        ColorPickerModule,
        SliderModule
    ],
    template: `
        <div class="glassmorphism-editor">
            <p-card header="Glassmorphism Card Settings">
                <!-- General Settings -->
                <p-fieldset legend="General Settings" [toggleable]="true">
                    <div class="flex flex-column gap-3">
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.showTitle" [binary]="true" inputId="showTitle"></p-checkbox>
                            <label for="showTitle">Show Title</label>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.showTitle">
                            <label for="title">Title</label>
                            <input pInputText id="title" [(ngModel)]="config.settings.title" />
                        </div>

                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.showSubtitle" [binary]="true" inputId="showSubtitle"></p-checkbox>
                            <label for="showSubtitle">Show Subtitle</label>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.showSubtitle">
                            <label for="subtitle">Subtitle</label>
                            <textarea pInputTextarea id="subtitle" [(ngModel)]="config.settings.subtitle" rows="2"></textarea>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Glass Effect Settings -->
                <p-fieldset legend="Glass Effect" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="glassBlur">Blur Amount (px): {{ config.settings.glassBlur }}</label>
                            <p-slider 
                                [(ngModel)]="config.settings.glassBlur"
                                [min]="0"
                                [max]="30"
                                [step]="1"
                            ></p-slider>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="glassOpacity">Glass Opacity: {{ config.settings.glassOpacity }}</label>
                            <p-slider 
                                [(ngModel)]="config.settings.glassOpacity"
                                [min]="0.05"
                                [max]="0.5"
                                [step]="0.05"
                            ></p-slider>
                        </div>

                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.borderGlow" [binary]="true" inputId="borderGlow"></p-checkbox>
                            <label for="borderGlow">Enable Border Glow Effect</label>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Border Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.borderColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="shadowIntensity">Shadow Intensity</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.shadowIntensity"
                                [options]="shadowOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Background Settings -->
                <p-fieldset legend="Background Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="backgroundPattern">Background Pattern</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.backgroundPattern"
                                [options]="backgroundOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.backgroundPattern === 'gradient'">
                            <label>Gradient Start Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.gradientStart"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.backgroundPattern === 'gradient'">
                            <label>Gradient End Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.gradientEnd"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.backgroundPattern === 'image'">
                            <label for="backgroundImage">Background Image URL</label>
                            <input pInputText id="backgroundImage" [(ngModel)]="config.settings.backgroundImage" placeholder="https://..." />
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.backgroundPattern === 'solid'">
                            <label>Background Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.backgroundColor"></p-colorPicker>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Layout Settings -->
                <p-fieldset legend="Layout Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="columns">Grid Columns</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.columns" 
                                [min]="2" 
                                [max]="4"
                                [showButtons]="true"
                            ></p-inputNumber>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="padding">Section Padding (px)</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.padding" 
                                [min]="20" 
                                [max]="120"
                                [showButtons]="true"
                            ></p-inputNumber>
                        </div>

                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.animateOnScroll" [binary]="true" inputId="animateOnScroll"></p-checkbox>
                            <label for="animateOnScroll">Animate on Scroll</label>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Color Settings -->
                <p-fieldset legend="Color Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label>Title Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.titleColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Subtitle Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.subtitleColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Card Title Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.cardTitleColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Card Text Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.cardTextColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Icon Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.iconColor"></p-colorPicker>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Cards -->
                <p-fieldset legend="Cards" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <button pButton label="Add Card" icon="pi pi-plus" (click)="addCard()" class="p-button-sm"></button>

                        <div *ngFor="let card of config.settings.cards; let i = index" class="border rounded p-3">
                            <div class="flex justify-between items-center mb-2">
                                <strong>Card {{ i + 1 }}</strong>
                                <button pButton icon="pi pi-trash" (click)="removeCard(i)" class="p-button-danger p-button-sm p-button-text"></button>
                            </div>

                            <div class="flex flex-column gap-2">
                                <div class="flex flex-column gap-2">
                                    <label>Icon Class</label>
                                    <input pInputText [(ngModel)]="card.icon" placeholder="bi bi-star" />
                                    <small>Use Bootstrap Icons (e.g., bi bi-star) or Font Awesome</small>
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Title</label>
                                    <input pInputText [(ngModel)]="card.title" />
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Description</label>
                                    <textarea pInputTextarea [(ngModel)]="card.description" rows="3"></textarea>
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Link URL (optional)</label>
                                    <input pInputText [(ngModel)]="card.link" placeholder="https:// or /page" />
                                </div>
                            </div>
                        </div>

                        <small *ngIf="config.settings.cards?.length === 0" class="text-muted">No cards added yet. Click "Add Card" to create your first card.</small>
                    </div>
                </p-fieldset>

                <!-- Actions -->
                <div class="flex gap-2 mt-3">
                    <button pButton label="Save" icon="pi pi-check" (click)="onSubmit()" class="p-button-success"></button>
                    <button pButton label="Cancel" icon="pi pi-times" (click)="onCancel()" class="p-button-secondary"></button>
                </div>
            </p-card>
        </div>
    `,
    styles: [`
        .glassmorphism-editor {
            padding: 1rem;
        }

        .border {
            border: 1px solid var(--surface-border);
        }

        .rounded {
            border-radius: 0.5rem;
        }
    `]
})
export class GlassmorphismCardEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    backgroundOptions = [
        { label: 'Gradient', value: 'gradient' },
        { label: 'Solid Color', value: 'solid' },
        { label: 'Image', value: 'image' }
    ];

    shadowOptions = [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' }
    ];

    ngOnInit(): void {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Set defaults
        const defaults = {
            title: 'Our Services',
            subtitle: 'Discover what we can do for you',
            showTitle: true,
            showSubtitle: true,
            columns: 3,
            glassBlur: 10,
            glassOpacity: 0.15,
            borderGlow: true,
            borderColor: 'rgba(255,255,255,0.2)',
            shadowIntensity: 'medium',
            backgroundPattern: 'gradient',
            gradientStart: '#667eea',
            gradientEnd: '#764ba2',
            backgroundImage: '',
            backgroundColor: '#1e293b',
            titleColor: '#ffffff',
            subtitleColor: 'rgba(255,255,255,0.8)',
            cardTitleColor: '#ffffff',
            cardTextColor: 'rgba(255,255,255,0.9)',
            iconColor: '#ffffff',
            padding: 80,
            animateOnScroll: true,
            cards: []
        };

        this.config.settings = { ...defaults, ...this.config.settings };

        // Ensure cards array exists
        if (!this.config.settings.cards) {
            this.config.settings.cards = [];
        }
    }

    addCard(): void {
        if (!this.config.settings.cards) {
            this.config.settings.cards = [];
        }

        const newCard: GlassmorphismCard = {
            icon: 'bi bi-star',
            title: 'New Service',
            description: 'Service description goes here'
        };

        this.config.settings.cards.push(newCard);
    }

    removeCard(index: number): void {
        this.config.settings.cards.splice(index, 1);
    }

    onSubmit(): void {
        this.update.emit(this.config.settings);
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
