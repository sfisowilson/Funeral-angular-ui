import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, FormArray } from '@angular/forms';
import { WidgetConfig } from '../widget-config';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';

@Component({
    selector: 'app-features-editor',
    standalone: true,
    imports: [FormsModule, CommonModule, ReactiveFormsModule, CardModule, InputTextModule, ButtonModule, FieldsetModule],
    template: `
        <div class="bg-gray-100 p-4 rounded-lg">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                        <label for="title" class="font-medium text-gray-700 mb-2">Title</label>
                        <input id="title" type="text" pInputText formControlName="title" class="w-full" />
                    </div>

                    <div class="flex flex-col">
                        <label for="titleColor" class="font-medium text-gray-700 mb-2">Title Color</label>
                        <input id="titleColor" type="color" formControlName="titleColor" class="w-full h-10 rounded-md border-gray-300" />
                    </div>

                    <div class="flex flex-col">
                        <label for="backgroundColor" class="font-medium text-gray-700 mb-2">Background Color</label>
                        <input id="backgroundColor" type="color" formControlName="backgroundColor" class="w-full h-10 rounded-md border-gray-300" />
                    </div>

                    <div class="flex flex-col">
                        <label for="padding" class="font-medium text-gray-700 mb-2">Padding (px)</label>
                        <input id="padding" type="number" pInputText formControlName="padding" class="w-full" />
                    </div>

                    <div class="flex flex-col">
                        <label for="iconSize" class="font-medium text-gray-700 mb-2">Icon Size (px)</label>
                        <input id="iconSize" type="number" pInputText formControlName="iconSize" class="w-full" />
                    </div>

                    <div class="flex flex-col">
                        <label for="iconColor" class="font-medium text-gray-700 mb-2">Icon Color</label>
                        <input id="iconColor" type="color" formControlName="iconColor" class="w-full h-10 rounded-md border-gray-300" />
                    </div>

                    <div class="flex flex-col">
                        <label for="featureTitleColor" class="font-medium text-gray-700 mb-2">Feature Title Color</label>
                        <input id="featureTitleColor" type="color" formControlName="featureTitleColor" class="w-full h-10 rounded-md border-gray-300" />
                    </div>

                    <div class="flex flex-col">
                        <label for="featureTextColor" class="font-medium text-gray-700 mb-2">Feature Text Color</label>
                        <input id="featureTextColor" type="color" formControlName="featureTextColor" class="w-full h-10 rounded-md border-gray-300" />
                    </div>
                </div>

                <div><a href="https://primeng.org/icons" target="_blank" rel="noopener noreferrer">Find icons here</a></div>

                <p-fieldset legend="Features" [toggleable]="true">
                    <div formArrayName="features" class="space-y-4">
                        <div *ngFor="let feature of features.controls; let i = index" [formGroupName]="i" class="flex items-center space-x-4 p-4 bg-white rounded-lg shadow">
                            <div class="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input type="text" pInputText formControlName="icon" placeholder="e.g., pi pi-check" class="w-full" />
                                <input type="text" pInputText formControlName="title" placeholder="Feature Title" class="w-full" />
                                <input type="text" pInputText formControlName="text" placeholder="Feature Text" class="w-full" />
                            </div>
                            <p-button type="button" icon="pi pi-trash" (click)="removeFeature(i)" styleClass="p-button-danger p-button-rounded p-button-text"></p-button>
                        </div>
                    </div>
                    <p-button type="button" label="Add Feature" icon="pi pi-plus" (click)="addFeature()" styleClass="p-button-secondary mt-4"></p-button>
                </p-fieldset>

                <div class="flex justify-end pt-6">
                    <p-button type="submit" label="Save Changes" icon="pi pi-check"></p-button>
                </div>
            </form>
        </div>
    `
})
export class FeaturesEditorComponent {
    @Input() config!: WidgetConfig;
    @Output() update = new EventEmitter<any>();

    form: FormGroup;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            title: [''],
            titleColor: ['var(--text-color, #000000)'],
            backgroundColor: ['var(--surface-card, #ffffff)'],
            padding: [20],
            iconSize: [48],
            iconColor: ['var(--primary-color, #007bff)'],
            featureTitleColor: ['var(--text-color, #000000)'],
            featureTextColor: ['var(--muted-color, #6c757d)'],
            features: this.fb.array([])
        });
    }

    ngOnChanges() {
        if (this.config) {
            this.form.patchValue(this.config.settings);
            this.features.clear();
            this.config.settings.features?.forEach((feature: any) => {
                this.features.push(this.fb.group(feature));
            });
        }
    }

    get features() {
        return this.form.get('features') as FormArray;
    }

    addFeature() {
        this.features.push(this.fb.group({ icon: '', title: '', text: '' }));
    }

    removeFeature(index: number) {
        this.features.removeAt(index);
    }

    onSubmit() {
        if (this.form.valid) {
            this.update.emit(this.form.value);
        }
    }
}
