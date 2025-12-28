import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-cta-editor',
    standalone: true,
    imports: [FormsModule, CommonModule, ReactiveFormsModule, CardModule, InputTextModule, ButtonModule],
    template: `
        <div class="bg-gray-100 p-4 rounded-lg">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                        <label for="title" class="font-medium text-gray-700 mb-2">Title</label>
                        <input id="title" type="text" pInputText formControlName="title" class="w-full" />
                    </div>

                    <div class="flex flex-col">
                        <label for="text" class="font-medium text-gray-700 mb-2">Text</label>
                        <input id="text" type="text" pInputText formControlName="text" class="w-full" />
                    </div>

                    <div class="flex flex-col">
                        <label for="textColor" class="font-medium text-gray-700 mb-2">Text Color</label>
                        <input id="textColor" type="color" formControlName="textColor" class="w-full h-10 rounded-md border-gray-300" />
                    </div>

                    <div class="flex flex-col">
                        <label for="backgroundColor" class="font-medium text-gray-700 mb-2">Background Color</label>
                        <input id="backgroundColor" type="color" formControlName="backgroundColor" class="w-full h-10 rounded-md border-gray-300" />
                    </div>

                    <div class="flex flex-col">
                        <label for="padding" class="font-medium text-gray-700 mb-2">Padding (px)</label>
                        <input id="padding" type="number" pInputText formControlName="padding" class="w-full" />
                    </div>
                </div>

                <div class="border-t border-gray-200 pt-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Button Settings</h3>
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
                    </div>
                </div>

                <div class="flex justify-end pt-6">
                    <p-button type="submit" label="Save Changes" icon="pi pi-check"></p-button>
                </div>
            </form>
        </div>
    `
})
export class CtaEditorComponent {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            title: [''],
            text: [''],
            textColor: ['var(--text-color, #ffffff)'],
            backgroundColor: ['var(--primary-color, #007bff)'],
            padding: [40],
            buttonText: ['Get Started'],
            buttonLink: ['#'],
            buttonColor: ['var(--primary-contrast-color, #ffffff)'],
            buttonTextColor: ['var(--primary-color, #007bff)']
        });
    }

    ngOnChanges() {
        if (this.config) {
            this.form.patchValue(this.config.settings);
        }
    }

    onSubmit() {
        if (this.form.valid) {
            this.update.emit(this.form.value);
        }
    }
}
