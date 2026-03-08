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
    selector: 'app-split-screen-editor',
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
        <div class="split-screen-editor">
            <p-card header="Split Screen Settings">
                <!-- Layout Settings -->
                <p-fieldset legend="Layout Settings" [toggleable]="true">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="splitRatio">Split Ratio (%): {{ config.settings.splitRatio }}</label>
                            <p-slider 
                                [(ngModel)]="config.settings.splitRatio"
                                [min]="30"
                                [max]="70"
                                [step]="5"
                            ></p-slider>
                            <small>Percentage width of left panel</small>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="minHeight">Minimum Height (px)</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.minHeight" 
                                [min]="400" 
                                [max]="1200"
                                [step]="50"
                                [showButtons]="true"
                            ></p-inputNumber>
                        </div>

                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.reverseOnMobile" [binary]="true" inputId="reverseOnMobile"></p-checkbox>
                            <label for="reverseOnMobile">Reverse on Mobile</label>
                            <small>(Show left content above right on mobile)</small>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Left Panel Settings -->
                <p-fieldset legend="Left Panel" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="leftContentType">Content Type</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.leftContent.type"
                                [options]="leftContentTypeOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.leftContent.type === 'image'">
                            <label for="leftImage">Image URL</label>
                            <input pInputText id="leftImage" [(ngModel)]="config.settings.leftContent.image" placeholder="https://..." />
                        </div>

                        <div class="flex flex-column gap-2" *ngIf="config.settings.leftContent.type === 'video'">
                            <label for="leftVideo">Video URL</label>
                            <input pInputText id="leftVideo" [(ngModel)]="config.settings.leftContent.video" placeholder="https://..." />
                        </div>

                        <div class="flex flex-column gap-3" *ngIf="config.settings.leftContent.type === 'slideshow'">
                            <button pButton label="Add Image" icon="pi pi-plus" (click)="addLeftImage()" class="p-button-sm"></button>
                            <div *ngFor="let img of config.settings.leftContent.images; let i = index" class="flex gap-2 items-center">
                                <input pInputText [(ngModel)]="config.settings.leftContent.images[i]" placeholder="https://..." class="flex-1" />
                                <button pButton icon="pi pi-trash" (click)="removeLeftImage(i)" class="p-button-danger p-button-sm p-button-text"></button>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.leftContent.sticky" [binary]="true" inputId="leftSticky"></p-checkbox>
                            <label for="leftSticky">Sticky (Fixed while scrolling)</label>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="leftAlign">Vertical Alignment</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.leftContent.verticalAlign"
                                [options]="alignmentOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Background Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.leftBackgroundColor"></p-colorPicker>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Right Panel Settings -->
                <p-fieldset legend="Right Panel" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="rightContentType">Content Type</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.rightContent.type"
                                [options]="rightContentTypeOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
                        </div>

                        <div class="flex flex-column gap-3" *ngIf="config.settings.rightContent.type === 'list' || config.settings.rightContent.type === 'steps'">
                            <button pButton label="Add Item" icon="pi pi-plus" (click)="addRightItem()" class="p-button-sm"></button>
                            <div *ngFor="let item of config.settings.rightContent.items; let i = index" class="border rounded p-3">
                                <div class="flex justify-between items-center mb-2">
                                    <strong>Item {{ i + 1 }}</strong>
                                    <button pButton icon="pi pi-trash" (click)="removeRightItem(i)" class="p-button-danger p-button-sm p-button-text"></button>
                                </div>
                                <div class="flex flex-column gap-2">
                                    <label>Title</label>
                                    <input pInputText [(ngModel)]="item.title" />
                                    <label>Description</label>
                                    <textarea pInputTextarea [(ngModel)]="item.description" rows="3"></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.rightContent.scrollable" [binary]="true" inputId="rightScrollable"></p-checkbox>
                            <label for="rightScrollable">Scrollable</label>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Background Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.rightBackgroundColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Text Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.textColor"></p-colorPicker>
                        </div>
                    </div>
                </p-fieldset>

                <!-- General -->
                <p-fieldset legend="General Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label>Background Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.backgroundColor"></p-colorPicker>
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
        .split-screen-editor {
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
export class SplitScreenEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    leftContentTypeOptions = [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Slideshow', value: 'slideshow' }
    ];

    rightContentTypeOptions = [
        { label: 'Text', value: 'text' },
        { label: 'List', value: 'list' },
        { label: 'Steps', value: 'steps' }
    ];

    alignmentOptions = [
        { label: 'Top', value: 'top' },
        { label: 'Center', value: 'center' },
        { label: 'Bottom', value: 'bottom' }
    ];

    ngOnInit(): void {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Set defaults
        const defaults = {
            splitRatio: 50,
            minHeight: 600,
            gap: 40,
            reverseOnMobile: true,
            backgroundColor: '#ffffff',
            leftBackgroundColor: 'transparent',
            rightBackgroundColor: 'transparent',
            textColor: '#212529',
            leftContent: {
                type: 'image',
                image: '',
                video: '',
                images: [],
                sticky: true,
                verticalAlign: 'center'
            },
            rightContent: {
                type: 'text',
                items: [],
                scrollable: true
            }
        };

        this.config.settings = { ...defaults, ...this.config.settings };

        // Ensure nested objects exist
        if (!this.config.settings.leftContent) {
            this.config.settings.leftContent = defaults.leftContent;
        }
        if (!this.config.settings.rightContent) {
            this.config.settings.rightContent = defaults.rightContent;
        }
        if (!this.config.settings.leftContent.images) {
            this.config.settings.leftContent.images = [];
        }
        if (!this.config.settings.rightContent.items) {
            this.config.settings.rightContent.items = [];
        }
    }

    addLeftImage(): void {
        if (!this.config.settings.leftContent.images) {
            this.config.settings.leftContent.images = [];
        }
        this.config.settings.leftContent.images.push('');
    }

    removeLeftImage(index: number): void {
        this.config.settings.leftContent.images.splice(index, 1);
    }

    addRightItem(): void {
        if (!this.config.settings.rightContent.items) {
            this.config.settings.rightContent.items = [];
        }
        this.config.settings.rightContent.items.push({
            title: 'New Item',
            description: 'Description goes here'
        });
    }

    removeRightItem(index: number): void {
        this.config.settings.rightContent.items.splice(index, 1);
    }

    onSubmit(): void {
        this.update.emit(this.config.settings);
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
