import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { MarqueeItem } from './marquee-widget.component';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';

@Component({
    selector: 'app-marquee-editor',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        CardModule,
        InputTextModule,
        ButtonModule,
        FieldsetModule,
        CheckboxModule,
        DropdownModule,
        InputNumberModule,
        ColorPickerModule
    ],
    template: `
        <div class="marquee-editor">
            <p-card header="Marquee Settings">
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
                    </div>
                </p-fieldset>

                <!-- Animation Settings -->
                <p-fieldset legend="Animation Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="direction">Scroll Direction</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.direction"
                                [options]="directionOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="speed">Animation Speed (seconds)</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.speed" 
                                [min]="10" 
                                [max]="120"
                                [step]="5"
                                [showButtons]="true"
                            ></p-inputNumber>
                            <small>Lower = faster, Higher = slower</small>
                        </div>

                        <div class="flex items-center gap-2">
                            <p-checkbox [(ngModel)]="config.settings.pauseOnHover" [binary]="true" inputId="pauseOnHover"></p-checkbox>
                            <label for="pauseOnHover">Pause on Hover</label>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="duplicateCount">Duplicate Count</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.duplicateCount" 
                                [min]="2" 
                                [max]="4"
                                [showButtons]="true"
                            ></p-inputNumber>
                            <small>Number of times to duplicate items for seamless loop</small>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Layout Settings -->
                <p-fieldset legend="Layout Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="itemSpacing">Item Spacing (px)</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.itemSpacing" 
                                [min]="20" 
                                [max]="100"
                                [step]="10"
                                [showButtons]="true"
                            ></p-inputNumber>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="itemScale">Item Scale</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.itemScale" 
                                [min]="0.5" 
                                [max]="1.5"
                                [step]="0.1"
                                [showButtons]="true"
                                [minFractionDigits]="1"
                                [maxFractionDigits]="1"
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
                    </div>
                </p-fieldset>

                <!-- Color Settings -->
                <p-fieldset legend="Color Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label>Background Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.backgroundColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Title Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.titleColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Text Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.textColor"></p-colorPicker>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Marquee Items -->
                <p-fieldset legend="Marquee Items" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <button pButton label="Add Item" icon="pi pi-plus" (click)="addItem()" class="p-button-sm"></button>

                        <div *ngFor="let item of config.settings.items; let i = index" class="border rounded p-3">
                            <div class="flex justify-between items-center mb-2">
                                <strong>Item {{ i + 1 }}</strong>
                                <button pButton icon="pi pi-trash" (click)="removeItem(i)" class="p-button-danger p-button-sm p-button-text"></button>
                            </div>

                            <div class="flex flex-column gap-2">
                                <div class="flex flex-column gap-2">
                                    <label>Type</label>
                                    <p-dropdown 
                                        [(ngModel)]="item.type"
                                        [options]="itemTypeOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                    ></p-dropdown>
                                </div>

                                <div class="flex flex-column gap-2" *ngIf="item.type === 'image'">
                                    <label>Image URL</label>
                                    <input pInputText [(ngModel)]="item.src" placeholder="https://..." />
                                    <label>Alt Text</label>
                                    <input pInputText [(ngModel)]="item.alt" placeholder="Company logo" />
                                </div>

                                <div class="flex flex-column gap-2" *ngIf="item.type === 'text'">
                                    <label>Text Content</label>
                                    <input pInputText [(ngModel)]="item.content" placeholder="Company Name or Testimonial" />
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Link URL (optional)</label>
                                    <input pInputText [(ngModel)]="item.link" placeholder="https:// or /page" />
                                </div>
                            </div>
                        </div>

                        <small *ngIf="config.settings.items?.length === 0" class="text-muted">No items added yet. Click "Add Item" to create your first marquee item.</small>
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
        .marquee-editor {
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
export class MarqueeEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    directionOptions = [
        { label: 'Left to Right', value: 'left' },
        { label: 'Right to Left', value: 'right' },
        { label: 'Up to Down', value: 'up' },
        { label: 'Down to Up', value: 'down' }
    ];

    itemTypeOptions = [
        { label: 'Image (Logo)', value: 'image' },
        { label: 'Text', value: 'text' }
    ];

    ngOnInit(): void {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Set defaults
        const defaults = {
            title: 'Trusted By',
            showTitle: true,
            direction: 'left',
            speed: 30,
            pauseOnHover: true,
            itemSpacing: 40,
            duplicateCount: 2,
            backgroundColor: 'transparent',
            titleColor: '#212529',
            textColor: '#212529',
            padding: 60,
            itemScale: 1.0,
            items: []
        };

        this.config.settings = { ...defaults, ...this.config.settings };

        // Ensure items array exists
        if (!this.config.settings.items) {
            this.config.settings.items = [];
        }
    }

    addItem(): void {
        if (!this.config.settings.items) {
            this.config.settings.items = [];
        }

        const newItem: MarqueeItem = {
            type: 'image',
            src: '',
            alt: 'Company logo'
        };

        this.config.settings.items.push(newItem);
    }

    removeItem(index: number): void {
        this.config.settings.items.splice(index, 1);
    }

    onSubmit(): void {
        this.update.emit(this.config.settings);
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
