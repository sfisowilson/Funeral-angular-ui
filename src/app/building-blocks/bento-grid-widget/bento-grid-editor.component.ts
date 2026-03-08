import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { BentoGridItem } from './bento-grid-widget.component';

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

@Component({
    selector: 'app-bento-grid-editor',
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
        ColorPickerModule
    ],
    template: `
        <div class="bento-grid-editor">
            <p-card header="Bento Grid Settings">
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

                <!-- Layout Settings -->
                <p-fieldset legend="Layout Settings" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <div class="flex flex-column gap-2">
                            <label for="columns">Grid Columns</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.columns" 
                                [min]="2" 
                                [max]="6"
                                [showButtons]="true"
                            ></p-inputNumber>
                            <small>Number of columns in the grid (2-6)</small>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label for="gap">Gap Size (px)</label>
                            <p-inputNumber 
                                [(ngModel)]="config.settings.gap" 
                                [min]="8" 
                                [max]="48"
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

                        <div class="flex flex-column gap-2">
                            <label for="hoverEffect">Hover Effect</label>
                            <p-dropdown 
                                [(ngModel)]="config.settings.hoverEffect"
                                [options]="hoverEffectOptions"
                                optionLabel="label"
                                optionValue="value"
                            ></p-dropdown>
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
                            <label>Background Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.backgroundColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Title Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.titleColor"></p-colorPicker>
                        </div>

                        <div class="flex flex-column gap-2">
                            <label>Subtitle Color</label>
                            <p-colorPicker [(ngModel)]="config.settings.subtitleColor"></p-colorPicker>
                        </div>
                    </div>
                </p-fieldset>

                <!-- Grid Items -->
                <p-fieldset legend="Grid Items" [toggleable]="true" class="mt-3">
                    <div class="flex flex-column gap-3">
                        <button pButton label="Add Item" icon="pi pi-plus" (click)="addItem()" class="p-button-sm"></button>

                        <div *ngFor="let item of config.settings.items; let i = index" class="border rounded p-3">
                            <div class="flex justify-between items-center mb-2">
                                <strong>Item {{ i + 1 }}</strong>
                                <button pButton icon="pi pi-trash" (click)="removeItem(i)" class="p-button-danger p-button-sm p-button-text"></button>
                            </div>

                            <div class="flex flex-column gap-2">
                                <div class="flex flex-column gap-2">
                                    <label>Size</label>
                                    <p-dropdown 
                                        [(ngModel)]="item.size"
                                        [options]="sizeOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                    ></p-dropdown>
                                    <small>{{ getSizeDescription(item.size) }}</small>
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Title</label>
                                    <input pInputText [(ngModel)]="item.title" />
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Description (optional)</label>
                                    <textarea pInputTextarea [(ngModel)]="item.description" rows="2"></textarea>
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Image URL (optional)</label>
                                    <input pInputText [(ngModel)]="item.image" placeholder="https://..." />
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Link URL (optional)</label>
                                    <input pInputText [(ngModel)]="item.link" placeholder="https://..." />
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Background Color (if no image)</label>
                                    <p-colorPicker [(ngModel)]="item.backgroundColor"></p-colorPicker>
                                </div>

                                <div class="flex flex-column gap-2">
                                    <label>Text Color</label>
                                    <p-colorPicker [(ngModel)]="item.textColor"></p-colorPicker>
                                </div>
                            </div>
                        </div>

                        <small *ngIf="config.settings.items?.length === 0" class="text-muted">No items added yet. Click "Add Item" to create your first grid item.</small>
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
        .bento-grid-editor {
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
export class BentoGridEditorComponent implements OnInit {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    hoverEffectOptions = [
        { label: 'None', value: 'none' },
        { label: 'Lift', value: 'lift' },
        { label: 'Scale', value: 'scale' },
        { label: 'Glow', value: 'glow' }
    ];

    sizeOptions = [
        { label: 'Small (1x1)', value: 'small' },
        { label: 'Medium (2x1)', value: 'medium' },
        { label: 'Large (2x2)', value: 'large' },
        { label: 'Wide (3x1)', value: 'wide' }
    ];

    ngOnInit(): void {
        if (!this.config.settings) {
            this.config.settings = {};
        }

        // Set defaults
        const defaults = {
            title: 'Featured Content',
            subtitle: 'Explore our highlighted items',
            showTitle: true,
            showSubtitle: true,
            columns: 4,
            gap: 16,
            padding: 60,
            animateOnScroll: true,
            hoverEffect: 'lift',
            backgroundColor: '#f8f9fa',
            titleColor: '#212529',
            subtitleColor: '#6c757d',
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

        const newItem: BentoGridItem = {
            size: 'medium',
            title: 'New Item',
            description: 'Item description',
            backgroundColor: '#667eea',
            textColor: '#ffffff'
        };

        this.config.settings.items.push(newItem);
    }

    removeItem(index: number): void {
        this.config.settings.items.splice(index, 1);
    }

    getSizeDescription(size: string): string {
        const descriptions: Record<string, string> = {
            small: '1 row × 1 column',
            medium: '1 row × 2 columns',
            large: '2 rows × 2 columns',
            wide: '1 row × 3 columns'
        };
        return descriptions[size] || '';
    }

    onSubmit(): void {
        this.update.emit(this.config.settings);
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
