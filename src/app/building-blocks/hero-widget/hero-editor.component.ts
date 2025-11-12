import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';

@Component({
    selector: 'app-hero-editor',
    standalone: true,
    imports: [FormsModule, CommonModule, ReactiveFormsModule, CardModule, InputTextModule, ButtonModule, FieldsetModule],
    template: `
        <div class="bg-gray-100 p-4 rounded-lg">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
                <p-fieldset legend="Content" [toggleable]="true">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col">
                            <label for="title" class="font-medium text-gray-700 mb-2">Title</label>
                            <input id="title" type="text" pInputText formControlName="title" class="w-full" />
                        </div>
                        <div class="flex flex-col">
                            <label for="titleSize" class="font-medium text-gray-700 mb-2">Title Size (px)</label>
                            <input id="titleSize" type="number" pInputText formControlName="titleSize" class="w-full" />
                        </div>
                        <div class="flex flex-col">
                            <label for="subtitle" class="font-medium text-gray-700 mb-2">Subtitle</label>
                            <input id="subtitle" type="text" pInputText formControlName="subtitle" class="w-full" />
                        </div>
                        <div class="flex flex-col">
                            <label for="subtitleSize" class="font-medium text-gray-700 mb-2">Subtitle Size (px)</label>
                            <input id="subtitleSize" type="number" pInputText formControlName="subtitleSize" class="w-full" />
                        </div>
                    </div>
                </p-fieldset>

                <p-fieldset legend="Style" [toggleable]="true">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col">
                            <label for="backgroundColor" class="font-medium text-gray-700 mb-2">Background Color</label>
                            <input id="backgroundColor" type="color" formControlName="backgroundColor" class="w-full h-10 rounded-md border-gray-300" />
                        </div>
                        <div class="flex flex-col">
                            <label for="textColor" class="font-medium text-gray-700 mb-2">Text Color</label>
                            <input id="textColor" type="color" formControlName="textColor" class="w-full h-10 rounded-md border-gray-300" />
                        </div>
                        <div class="flex flex-col">
                            <label for="padding" class="font-medium text-gray-700 mb-2">Padding (px)</label>
                            <input id="padding" type="number" pInputText formControlName="padding" class="w-full" />
                        </div>
                    </div>
                </p-fieldset>

                <p-fieldset legend="Button" [toggleable]="true">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col">
                            <label for="buttonText" class="font-medium text-gray-700 mb-2">Button Text</label>
                            <input id="buttonText" type="text" pInputText formControlName="buttonText" class="w-full" />
                        </div>
                        <div class="flex flex-col">
                            <label for="buttonLink" class="font-medium text-gray-700 mb-2">Button Link</label>
                            <input id="buttonLink" type="url" pInputText formControlName="buttonLink" class="w-full" />
                        </div>
                        <div class="flex flex-col">
                            <label for="buttonColor" class="font-medium text-gray-700 mb-2">Button Color</label>
                            <input id="buttonColor" type="color" formControlName="buttonColor" class="w-full h-10 rounded-md border-gray-300" />
                        </div>
                        <div class="flex flex-col">
                            <label for="buttonTextColor" class="font-medium text-gray-700 mb-2">Button Text Color</label>
                            <input id="buttonTextColor" type="color" formControlName="buttonTextColor" class="w-full h-10 rounded-md border-gray-300" />
                        </div>
                        <div class="flex flex-col">
                            <label for="buttonTextSize" class="font-medium text-gray-700 mb-2">Button Text Size (px)</label>
                            <input id="buttonTextSize" type="number" pInputText formControlName="buttonTextSize" class="w-full" />
                        </div>
                        <div class="flex flex-col">
                            <label for="buttonPadding" class="font-medium text-gray-700 mb-2">Button Padding (px)</label>
                            <input id="buttonPadding" type="number" pInputText formControlName="buttonPadding" class="w-full" />
                        </div>
                    </div>
                </p-fieldset>

                <div class="flex justify-end gap-3 pt-6">
                        <button pButton type="button" label="Cancel" icon="pi pi-times" class="p-button-outlined" (click)="onCancel()"></button>
                        <button pButton type="submit" label="Save Changes" icon="pi pi-check"></button>
                </div>
            </form>
        </div>
    `
})
export class HeroEditorComponent implements OnInit, OnChanges {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();
    @Output() cancel = new EventEmitter<void>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            title: [''],
            titleSize: [24],
            subtitle: [''],
            subtitleSize: [16],
            backgroundColor: ['#ffffff'],
            textColor: ['#000000'],
            padding: [20],
            buttonText: ['Click Me'],
            buttonLink: ['#'],
            buttonColor: ['#007bff'],
            buttonTextColor: ['#ffffff'],
            buttonTextSize: [16],
            buttonPadding: [10]
        });
    }

    ngOnInit(): void {
        if (this.config?.settings) {
            this.form.patchValue(this.config.settings);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['config'] && this.config?.settings) {
            this.form.patchValue(this.config.settings);
        }
    }

    onSubmit() {
        console.log('=== HERO EDITOR onSubmit called ===');
        console.log('Form value:', this.form.value);
        console.log('Form valid:', this.form.valid);
        console.log('Update emitter observers:', this.update.observers.length);
        
        if (this.form.valid) {
            console.log('Emitting update event with:', this.form.value);
            this.update.emit(this.form.value);
            console.log('Update event emitted');
        } else {
            console.error('Form is invalid:', this.form.errors);
        }
    }

    onCancel() {
        this.cancel.emit();
    }
}
