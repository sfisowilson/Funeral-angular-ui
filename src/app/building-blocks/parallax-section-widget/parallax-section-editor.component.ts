import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';

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
    selector: 'app-parallax-section-editor',
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
        <div class="parallax-section-editor">
            <p-card header="Parallax Section Settings">
                <!-- Content Settings -->
                <p-fieldset legend="Content Settings" [toggleable]="true">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="title">Title</label>
                            <input pInputText id="title" [(ngModel)]="config.settings.title" />
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="subtitle">Subtitle</label>
                            <textarea pInputTextarea id="subtitle" [(ngModel)]="config.settings.subtitle" rows="3"></textarea>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Title Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.titleColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Subtitle Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.subtitleColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="contentAlign">Content Alignment</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.contentAlign"
                                [options]="alignmentOptions"
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
                            <label for="backgroundType">Background Type</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.backgroundType"
                                [options]="backgroundTypeOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.backgroundType === 'image'">
                            <label for="backgroundImage">Background Image URL</label>
                            <input pInputText id="backgroundImage" [(ngModel)]="config.settings.backgroundImage" placeholder="https://..." />
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.backgroundType === 'video'">
                            <label for="backgroundVideo">Background Video URL</label>
                            <input pInputText id="backgroundVideo" [(ngModel)]="config.settings.backgroundVideo" placeholder="https://..." />
                            <small>URL to MP4 video file</small>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.backgroundType === 'gradient'">
                            <label>Gradient Start Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.gradientStart"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.backgroundType === 'gradient'">
                            <label>Gradient End Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.gradientEnd"></p-colorPicker>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Parallax Settings -->
                <p-fieldset legend="Parallax Effect" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="parallaxSpeed">Parallax Speed: {{ config.settings.parallaxSpeed }}</label>
                            <p-slider 
                                [(ngModel)]="config.settings.parallaxSpeed"
                                [min]="0"
                                [max]="1"
                                [step]="0.1"
                            ></p-slider>
                            <small>0 = fixed, 0.5 = half speed, 1 = normal scroll</small>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="direction">Parallax Direction</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.direction"
                                [options]="directionOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Overlay Settings -->
                <p-fieldset legend="Overlay Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label>Overlay Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.overlayColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="overlayOpacity">Overlay Opacity: {{ config.settings.overlayOpacity }}</label>
                            <p-slider 
                                [(ngModel)]="config.settings.overlayOpacity"
                                [min]="0"
                                [max]="1"
                                [step]="0.05"
                            ></p-slider>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Layout Settings -->
                <p-fieldset legend="Layout Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="minHeight">Minimum Height (px)</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.minHeight" 
                                [min]="300" 
                                [max]="1000"
                                [step]="50"
                                [showButtons]="true"
                            ></p-inputNumber>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Call to Action -->
                <p-fieldset legend="Call to Action" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.showCTA" [binary]="true" inputId="showCTA"></p-checkbox>
                            <label for="showCTA">Show Call to Action Button</label>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.showCTA">
                            <label for="ctaText">Button Text</label>
                            <input pInputText id="ctaText" [(ngModel)]="config.settings.ctaText" />
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.showCTA">
                            <label for="ctaLink">Button Link</label>
                            <input pInputText id="ctaLink" [(ngModel)]="config.settings.ctaLink" placeholder="https:// or /page" />
                        </div>
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
        .parallax-section-editor {
            padding: 1rem;
        }
    `]
})
export class ParallaxSectionEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    backgroundTypeOptions = [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Gradient', value: 'gradient' }
    ];

    directionOptions = [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' }
    ];

    alignmentOptions = [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' }
    ];

    ngOnInit(): void {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Set defaults
        const defaults = {
            title: 'Parallax Section',
            subtitle: 'Scroll to see the parallax effect in action',
            backgroundType: 'image',
            backgroundImage: '',
            backgroundVideo: '',
            gradientStart: '#667eea',
            gradientEnd: '#764ba2',
            parallaxSpeed: 0.5,
            direction: 'vertical',
            overlayColor: '#000000',
            overlayOpacity: 0.4,
            minHeight: 500,
            contentAlign: 'center',
            titleColor: '#ffffff',
            subtitleColor: '#ffffff',
            showCTA: false,
            ctaText: 'Learn More',
            ctaLink: '#'
        };

        this.config.settings = { ...defaults, ...this.config.settings };
    }

    onSubmit(): void {
        this.update.emit(this.config.settings);
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
